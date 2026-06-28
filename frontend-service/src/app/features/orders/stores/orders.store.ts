import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import type { IOrder, IOrderBook, IOrderResponse } from '../models/order.model';
import type { IOrderRequest } from '../../markets/models/market.model';
import { MarketService } from '../../markets/services/market.service';
import { OrderWebSocketService } from '../services/order-websocket.service';
import { OrderService } from '../services/order.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Aggregated store for orders consumed by the UI.
 *
 * - Exposes `history` (full lifecycle) and `openOrders` (in-flight).
 * - Provides lightweight selectors the feature components can call
 *   without re-implementing filter logic.
 * - Owns the command wrappers that hit the REST endpoints and rely
 *   on the websocket stream to keep the in-memory state in sync.
 */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly ws = inject(OrderWebSocketService);
  private readonly service = inject(OrderService);
  private readonly marketService = inject(MarketService);
  private readonly loader = inject(LoadingService);
  private readonly notifications = inject(NotificationService);

  private readonly _loading = signal<boolean>(false);
  private readonly _submitting = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastLoadedAt = signal<string | null>(null);

  readonly history = computed<readonly IOrder[]>(() => this.ws.orders());
  readonly openOrders = computed<readonly IOrder[]>(() => this.ws.openOrders());
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastLoadedAt = this._lastLoadedAt.asReadonly();

  countByStatus(status: IOrder['status']): number {
    return this.history().filter((order) => order.status === status).length;
  }

  forSymbol(symbol: string): readonly IOrder[] {
    return this.history().filter((order) => order.symbol === symbol);
  }

  orderBook(): IOrderBook | null {
    return this.ws.orderBook();
  }

  /** Refresh the user's order history through the REST endpoint. */
  async refresh(): Promise<void> {
    if (this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this.loader.start();
    try {
      const orders = await firstValue(this.service.history());
      this.ws.hydrate(orders);
      this._lastLoadedAt.set(new Date().toISOString());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'orders.error.unknown';
      this._error.set(message);
      this.notifications.error('orders.error.title', message);
    } finally {
      this._loading.set(false);
      this.loader.stop();
    }
  }

  /** Submit a new order. */
  async submit(request: IOrderRequest): Promise<IOrderResponse> {
    if (this._submitting()) {
      throw new Error('orders.error.busy');
    }
    this._submitting.set(true);
    this._error.set(null);
    this.loader.start();
    try {
      const response = await firstValue(this.marketService.submitOrder(request));
      this.notifications.success(
        'orders.notifications.submitted.title',
        'orders.notifications.submitted.message'
      );
      // Refresh asynchronously so the user immediately returns to the
      // history page without waiting for the round trip.
      void this.refresh();
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'orders.error.submit';
      this._error.set(message);
      this.notifications.error('orders.error.title', message);
      throw err;
    } finally {
      this._submitting.set(false);
      this.loader.stop();
    }
  }

  /** Cancel an existing order. */
  async cancel(orderId: string): Promise<IOrderResponse> {
    this.loader.start();
    try {
      const response = await firstValue(this.marketService.cancelOrder(orderId));
      this.notifications.success(
        'orders.notifications.cancelled.title',
        'orders.notifications.cancelled.message'
      );
      void this.refresh();
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'orders.error.cancel';
      this._error.set(message);
      this.notifications.error('orders.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  /** Fetch the order book for a symbol. */
  async loadBook(symbol: string): Promise<void> {
    this.loader.start();
    try {
      const book = await firstValue(this.service.book(symbol));
      this.ws.setBook(book);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'orders.error.book';
      this._error.set(message);
      this.notifications.error('orders.error.title', message);
    } finally {
      this.loader.stop();
    }
  }

  reset(): void {
    this._error.set(null);
    this._lastLoadedAt.set(null);
  }
}

function firstValue<T>(source: Observable<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const subscription = source.subscribe({
      next: (value: T) => {
        resolve(value);
        subscription.unsubscribe();
      },
      error: (err: unknown) => {
        reject(err);
        subscription.unsubscribe();
      },
      complete: () => undefined
    });
  });
}
