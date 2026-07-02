import type { OrderSide, OrderType, OrderStatus } from '../../orders/models/order.model';

/**
 * Tradable asset exposed by `asset-service`. Mirrors the
 * `AssetResponse` record returned by `GET /api/assets`.
 */
export type AssetType = 'STOCK' | 'ETF' | 'BOND' | 'FOREX';

export interface IAsset {
  readonly id: string;
  readonly symbol: string;
  readonly description?: string;
  readonly name: string;
  readonly type: AssetType;
  readonly market?: string;
  readonly currency: string;
  readonly lastPrice: number;
  readonly previousClose: number;
  readonly variationPercent: number;
  readonly quantity: number;
  readonly volume: number;
  readonly buyQuantity: number;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly sellQuantity: number;
  readonly isActive: boolean;
  readonly listedAt?: string;
}

/**
 * Compact market snapshot projected for the listing pages. Built
 * from an `IAsset` enriched with the latest price update pushed by
 * the realtime gateway.
 */
export interface IMarket {
  readonly symbol: string;
  readonly name: string;
  readonly type: AssetType;
  readonly currency: string;
  readonly price: number;
  readonly previousPrice: number;
  readonly change: number;
  readonly changePercent: number;
  readonly quantity: number;
  readonly volume: number;
  readonly buyQuantity: number;
  readonly buyPrice: number;
  readonly sellPrice: number;
  readonly sellQuantity: number;
  readonly isActive: boolean;
}

/**
 * Server-pushed price update. Consumed by the markets feature via
 * the realtime gateway. Fields match the `IPriceUpdateEvent` payload
 * declared in `core/realtime/realtime-events.ts`.
 */
export interface IPriceUpdate {
  readonly symbol: string;
  readonly price: number;
  readonly timestamp: string;
}

/**
 * Order book snapshot returned by `GET /api/orders/book/{symbol}`.
 * Each level exposes a price and an aggregated quantity.
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
 * Lightweight order projection used by the market details page.
 * Mirrors the backend `OrderDetailsResponse` DTO.
 */
export interface IMarketOrder {
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
 * Body sent to `POST /api/orders` to submit a new order. Matches
 * the backend `OrderRequest` DTO. `price` is required for LIMIT
 * orders and ignored for MARKET orders.
 */
export interface IOrderRequest {
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly price: number | null;
  readonly quantity: number;
}

/**
 * Response from `POST /api/orders` and friends. Minimal lifecycle
 * information; details are fetched separately.
 */
export interface IOrderResponse {
  readonly id: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
}
