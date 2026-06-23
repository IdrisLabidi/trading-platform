import { Injectable, computed, inject } from '@angular/core';

import type { IOpenOrder, IOrder, OrderStatus } from '../models/order.model';
import { OrderWebSocketService } from '../services/order-websocket.service';

/**
 * Aggregated store for orders consumed by the UI.
 *
 * - Exposes `history` (full lifecycle) and `openOrders` (in-flight).
 * - Provides lightweight selectors the feature components can call
 *   without re-implementing filter logic.
 *
 * The store is read-only from the UI perspective: it reflects what
 * the realtime stream produced. REST POSTs are handled by the
 * dedicated order services elsewhere.
 */
@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly ws = inject(OrderWebSocketService);

  readonly history = computed<readonly IOrder[]>(() => this.ws.orders());
  readonly openOrders = computed<readonly IOpenOrder[]>(() => this.ws.openOrders());

  countByStatus(status: OrderStatus): number {
    return this.history().filter((order) => order.status === status).length;
  }

  forSymbol(symbol: string): readonly IOrder[] {
    return this.history().filter((order) => order.symbol === symbol);
  }
}
