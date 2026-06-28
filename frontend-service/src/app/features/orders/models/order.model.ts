export type OrderSide = 'BUY' | 'SELL';
/**
 * Backend exposes `MARKET` and `LIMIT` only; `STOP` is kept for the
 * legacy UI but it is never sent to the backend.
 */
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
/**
 * Backend statuses are `PENDING`, `PARTIAL`, `FILLED` and
 * `CANCELLED`. The frontend UI may also surface `OPEN` and
 * `REJECTED` from cached client-side state.
 */
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';

/**
 * Full order detail. Mirrors the backend `OrderDetailsResponse`
 * record returned by the order endpoints.
 */
export interface IOrder {
  readonly id: string;
  readonly userId: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly price: number;
  readonly quantity: number;
  readonly remainingQty: number;
  readonly status: OrderStatus;
  readonly createdAt: string;
}

/**
 * Order book snapshot consumed by the orders feature. Shape matches
 * `OrderBookSnapshot` on the backend.
 */
export interface IOrderBookLevel {
  readonly price: number;
  readonly totalQuantity: number;
}

export interface IOrderBook {
  readonly symbol: string;
  readonly bids: readonly IOrderBookLevel[];
  readonly asks: readonly IOrderBookLevel[];
}

/**
 * Convenience alias for orders still in flight. Mirrors `IOrder` so
 * the UI can keep a single contract when listing open orders.
 */
export type IOpenOrder = IOrder;

/**
 * Response payload returned by order write endpoints
 * (`POST /api/orders`, `PUT`, `DELETE`). Carries the minimal
 * information required to update the in-memory store.
 */
export interface IOrderResponse {
  readonly id: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
}

/**
 * Body for `PUT /api/orders/{id}` to amend price/quantity on a
 * pending or partial order.
 */
export interface IOrderUpdateRequest {
  readonly price?: number;
  readonly quantity?: number;
}
