import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { MarketWebSocketService } from '../services/market-websocket.service';
import { MarketService } from '../services/market.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import type {
  IAsset,
  IMarket,
  IOrderBook,
  IOrderRequest,
  IOrderResponse
} from '../models/market.model';
import type { IOrder, IOrderUpdateRequest } from '../../orders/models/order.model';

/**
 * Aggregated store for the markets feature. Combines the realtime
 * price stream with REST calls to the market-service so the UI
 * consumes a single shape.
 *
 * - `assets()` and `markets()` are populated on first load from
 *   `GET /api/assets`; subsequent updates are pushed by the gateway.
 * - Order lifecycle (`submit`, `cancel`, `update`) goes through
 *   `MarketService` and the store is in charge of triggering the
 *   list refresh.
 */
@Injectable({ providedIn: 'root' })
export class MarketsStore {
  private readonly ws = inject(MarketWebSocketService);
  private readonly service = inject(MarketService);
  private readonly loader = inject(LoadingService);
  private readonly notifications = inject(NotificationService);

  private readonly _assets = signal<readonly IAsset[]>([]);
  private readonly _orderBooks = signal<ReadonlyMap<string, IOrderBook>>(new Map());
  private readonly _userOrders = signal<readonly IOrder[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastLoadedAt = signal<string | null>(null);

  // --- Assets / markets --------------------------------------------

  readonly assets = this._assets.asReadonly();
  readonly markets = this.ws.markets;
  readonly subscribed = computed<readonly string[]>(() => this.ws.subscribed());
  readonly lastUpdate = computed(() => this.ws.lastUpdate());

  // --- Order book --------------------------------------------------

  readonly orderBooks = this._orderBooks.asReadonly();
  orderBook(symbol: string): IOrderBook | null {
    return this._orderBooks().get(symbol) ?? null;
  }

  // --- User orders -------------------------------------------------

  readonly userOrders = this._userOrders.asReadonly();

  // --- Status -------------------------------------------------------

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastLoadedAt = this._lastLoadedAt.asReadonly();

  // --- Commands ----------------------------------------------------

  /** Refresh the shared catalog snapshot used by the market views. */
  syncCatalog(assets: readonly IAsset[]): void {
    this._assets.set(assets);
    this.ws.setCatalog(assets);
  }

  /** Refresh the catalog (assets) and the user's order history. */
  async refresh(): Promise<void> {
    if (this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this.loader.start();
    try {
      const assets = await firstValue(this.service.listAssets());
      this.syncCatalog(assets);
      if (assets.length > 0) {
        this.ws.subscribe(assets.map((asset) => asset.symbol));
      }
      const orders = await firstValue(this.service.getUserOrders());
      this._userOrders.set(orders.map((order) => this.service.toOrder(order)));
      this._lastLoadedAt.set(new Date().toISOString());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'markets.error.unknown';
      this._error.set(message);
      this.notifications.error('markets.error.title', message);
    } finally {
      this._loading.set(false);
      this.loader.stop();
    }
  }

  /** Fetch the order book for a single symbol. */
  async loadOrderBook(symbol: string): Promise<void> {
    this.loader.start();
    try {
      const book = await firstValue(this.service.getOrderBook(symbol));
      this._orderBooks.update((map) => {
        const next = new Map(map);
        next.set(symbol, book);
        return next;
      });
      this.ws.subscribe([symbol]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'markets.error.orderBook';
      this._error.set(message);
      this.notifications.error('markets.error.title', message);
    } finally {
      this.loader.stop();
    }
  }

  /** Submit a new order and refresh the local history snapshot. */
  async submitOrder(request: IOrderRequest): Promise<IOrderResponse> {
    this.loader.start();
    try {
      const response = await firstValue(this.service.submitOrder(request));
      this.notifications.success(
        'markets.notifications.submitted.title',
        'markets.notifications.submitted.message'
      );
      await this.refresh();
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'markets.error.submit';
      this._error.set(message);
      this.notifications.error('markets.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  /** Cancel an order owned by the caller. */
  async cancelOrder(orderId: string): Promise<IOrderResponse> {
    this.loader.start();
    try {
      const response = await firstValue(this.service.cancelOrder(orderId));
      this.notifications.success(
        'markets.notifications.cancelled.title',
        'markets.notifications.cancelled.message'
      );
      await this.refresh();
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'markets.error.cancel';
      this._error.set(message);
      this.notifications.error('markets.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  /** Update an open order. */
  async updateOrder(orderId: string, request: IOrderUpdateRequest): Promise<IOrderResponse> {
    this.loader.start();
    try {
      const response = await firstValue(this.service.updateOrder(orderId, request));
      this.notifications.success(
        'markets.notifications.updated.title',
        'markets.notifications.updated.message'
      );
      await this.refresh();
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'markets.error.update';
      this._error.set(message);
      this.notifications.error('markets.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  reset(): void {
    this._assets.set([]);
    this._orderBooks.set(new Map());
    this._userOrders.set([]);
    this._error.set(null);
    this._lastLoadedAt.set(null);
    this.ws.setCatalog([]);
  }
}

/**
 * Resolves with the first emission of an observable (or rejects with
 * the error). Equivalent to `firstValueFrom` but kept inline to avoid
 * the rxjs import churn.
 */
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
