import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RealtimeService } from '../../../core/realtime/realtime.service';
import type { IOrder, IOrderBook, IOpenOrder, OrderStatus } from '../models/order.model';

/**
 * Live signal store for orders. Subscribes to the realtime streams
 * once and reflects every event into the public signal surface:
 *
 * - `orders()`       : the full order history (newest first).
 * - `openOrders()`   : derived subset of orders still in flight.
 * - `orderBook()`    : latest snapshot received from the gateway.
 * - `lastEvent()`    : raw last envelope, useful for debugging.
 *
 * The store never reaches the network itself: it is a pure consumer
 * of `RealtimeService` observables.
 */
@Injectable({ providedIn: 'root' })
export class OrderWebSocketService {
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _orders = signal<readonly IOrder[]>([]);
  private readonly _orderBook = signal<IOrderBook | null>(null);
  private readonly _lastEvent = signal<IOrder | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly orderBook = this._orderBook.asReadonly();
  readonly lastEvent = this._lastEvent.asReadonly();

  readonly openOrders = computed<readonly IOpenOrder[]>(() => {
    const openStatuses: readonly OrderStatus[] = ['PENDING', 'OPEN', 'PARTIAL'];
    return this._orders()
      .filter((order) => openStatuses.includes(order.status))
      .map((order) => ({
        ...order,
        remainingQuantity: order.quantity
      }));
  });

  constructor() {
    this.realtime
      .orderUpdates$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order) => this.applyOrder(order));

    this.realtime
      .orderCreated$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order) => this.applyOrder(order));

    this.realtime
      .orderFilled$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order) => this.applyOrder(order));

    this.realtime
      .orderCancelled$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((order) => this.applyOrder(order));

    this.realtime
      .orderBook$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((book) => this._orderBook.set(book));
  }

  /** Replace the entire history (used when the page hydrates from REST). */
  hydrate(orders: readonly IOrder[]): void {
    this._orders.set([...orders]);
  }

  private applyOrder(order: IOrder): void {
    this._lastEvent.set(order);
    this._orders.update((list) => upsertById(list, order));
  }
}

function upsertById(list: readonly IOrder[], order: IOrder): IOrder[] {
  const filtered = list.filter((existing) => existing.id !== order.id);
  return [order, ...filtered];
}
