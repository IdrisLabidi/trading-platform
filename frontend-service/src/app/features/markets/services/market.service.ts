import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import { AuthService } from '../../../core/services/auth.service';
import type {
  IAsset,
  IMarket,
  IMarketOrder,
  IOrderBook,
  IOrderRequest,
  IOrderResponse
} from '../models/market.model';
import type { IOrder, IOrderUpdateRequest } from '../../orders/models/order.model';

interface IRawAsset {
  readonly id?: string;
  readonly symbol?: string;
  readonly description?: string;
  readonly name?: string;
  readonly type?: IAsset['type'];
  readonly market?: string;
  readonly currency?: string;
  readonly lastPrice?: number | string | null;
  readonly isActive?: boolean;
  readonly listedAt?: string;
}

interface IRawAssetList {
  readonly items?: readonly IRawAsset[];
}

interface IRawOrderBookLevel {
  readonly price?: number | string | null;
  readonly totalQuantity?: number | string | null;
}

interface IRawOrderBook {
  readonly symbol?: string;
  readonly bids?: readonly IRawOrderBookLevel[];
  readonly asks?: readonly IRawOrderBookLevel[];
}

interface IRawOrderResponse {
  readonly id?: string;
  readonly status?: string;
  readonly createdAt?: string;
}

interface IRawOrderDetails {
  readonly id?: string;
  readonly userId?: string;
  readonly symbol?: string;
  readonly side?: string;
  readonly type?: string;
  readonly price?: number | string | null;
  readonly quantity?: number | string | null;
  readonly remainingQty?: number | string | null;
  readonly status?: string;
  readonly createdAt?: string;
}

interface IOrderRequestPayload {
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly type: 'MARKET' | 'LIMIT';
  readonly price: number | null;
  readonly quantity: number;
}

interface IOrderUpdateRequestPayload {
  readonly price?: number;
  readonly quantity?: number;
}

/**
 * REST adapter for the `market-service`. All write operations
 * (`POST`, `PUT`, `DELETE`) target the order endpoints; the read
 * endpoints also include the order book and the user history.
 *
 * The service never reaches the network directly: it goes through
 * `HttpService` so the interceptor chain (auth, error, loading,
 * baseUrl) is applied consistently.
 */
@Injectable({ providedIn: 'root' })
export class MarketService {
  private readonly http = inject(HttpService);
  private readonly auth = inject(AuthService);

  // --- Assets / market catalog --------------------------------------

  /** Fetch the list of tradable assets. */
  listAssets(): Observable<readonly IAsset[]> {
    return this.http
      .get<unknown>('/api/assets')
      .pipe(map((payload) => this.unwrapList(payload).map((raw) => this.toAsset(raw))));
  }

  /** Fetch a single asset by symbol. */
  getAsset(symbol: string): Observable<IAsset> {
    return this.http
      .get<IRawAsset>(`/api/assets/symbol/${encodeURIComponent(symbol)}`)
      .pipe(map((raw) => this.toAsset(raw)));
  }

  /** Convenience: list combined with the latest known price for each market. */
  listMarkets(): Observable<readonly IMarket[]> {
    return this.listAssets().pipe(
      map((assets) => assets.map((asset) => this.toMarket(asset, asset.lastPrice, asset.lastPrice)))
    );
  }

  // --- Order book ---------------------------------------------------

  /** Fetch the current order book for a given symbol. */
  getOrderBook(symbol: string): Observable<IOrderBook> {
    return this.http
      .get<IRawOrderBook>(`/api/orders/book/${encodeURIComponent(symbol)}`)
      .pipe(map((raw) => this.toOrderBook(raw, symbol)));
  }

  // --- Order lifecycle ---------------------------------------------

  /** Submit a new BUY/SELL order. */
  submitOrder(request: IOrderRequest): Observable<IOrderResponse> {
    return this.http
      .post<IRawOrderResponse, IOrderRequestPayload>('/api/orders', this.toOrderPayload(request))
      .pipe(map((raw) => this.toOrderResponse(raw)));
  }

  /** Fetch a single order owned by the caller. */
  getOrder(orderId: string): Observable<IMarketOrder> {
    return this.http
      .get<IRawOrderDetails>(`/api/orders/${encodeURIComponent(orderId)}`)
      .pipe(map((raw) => this.toMarketOrder(raw)));
  }

  /** Fetch the caller''s order history (most recent first). */
  getUserOrders(): Observable<readonly IMarketOrder[]> {
    const userId = this.auth.user()?.id;
    const path = userId
      ? `/api/orders/users/${encodeURIComponent(userId)}`
      : '/api/orders/users/_self';
    return this.http
      .get<readonly IRawOrderDetails[]>(path)
      .pipe(map((list) => list.map((raw) => this.toMarketOrder(raw))));
  }

  /** Fetch the caller''s open (PENDING/PARTIAL) orders. */
  getUserOpenOrders(): Observable<readonly IMarketOrder[]> {
    const userId = this.auth.user()?.id;
    const path = userId
      ? `/api/orders/users/${encodeURIComponent(userId)}/book`
      : '/api/orders/users/_self/book';
    return this.http
      .get<readonly IRawOrderDetails[]>(path)
      .pipe(map((list) => list.map((raw) => this.toMarketOrder(raw))));
  }

  /** Update an open order (price/quantity). */
  updateOrder(orderId: string, request: IOrderUpdateRequest): Observable<IOrderResponse> {
    return this.http
      .put<IRawOrderResponse, IOrderUpdateRequestPayload>(
        `/api/orders/${encodeURIComponent(orderId)}`,
        this.toUpdatePayload(request)
      )
      .pipe(map((raw) => this.toOrderResponse(raw)));
  }

  /** Cancel an open order. */
  cancelOrder(orderId: string): Observable<IOrderResponse> {
    return this.http
      .delete<IRawOrderResponse>(`/api/orders/${encodeURIComponent(orderId)}`)
      .pipe(map((raw) => this.toOrderResponse(raw)));
  }

  // --- Conversions --------------------------------------------------

  /** Project a fully populated `IOrder` from a market-order payload. */
  toOrder(marketOrder: IMarketOrder): IOrder {
    return {
      id: marketOrder.id,
      userId: marketOrder.userId,
      symbol: marketOrder.symbol,
      side: marketOrder.side,
      type: marketOrder.type,
      price: marketOrder.price,
      quantity: marketOrder.quantity,
      remainingQty: marketOrder.remainingQty,
      status: marketOrder.status,
      createdAt: marketOrder.createdAt
    };
  }

  // --- Internals ----------------------------------------------------

  private toMarket(asset: IAsset, price: number, previousPrice: number): IMarket {
    const safePrice = Number.isFinite(price) ? price : asset.lastPrice;
    const safePrev = Number.isFinite(previousPrice) ? previousPrice : safePrice;
    const change = safePrice - safePrev;
    const changePercent = safePrev === 0 ? 0 : change / safePrev;
    return {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      currency: asset.currency,
      price: safePrice,
      previousPrice: safePrev,
      change,
      changePercent,
      isActive: asset.isActive
    };
  }

  private unwrapList(payload: unknown): readonly IRawAsset[] {
    if (!payload) {
      return [];
    }
    if (Array.isArray(payload)) {
      return payload as readonly IRawAsset[];
    }
    if (typeof payload === 'object' && payload !== null && 'items' in payload) {
      const items = (payload as IRawAssetList).items;
      if (Array.isArray(items)) {
        return items;
      }
    }
    return [];
  }

  private toAsset(raw: IRawAsset | null | undefined): IAsset {
    if (!raw) {
      throw new Error('Empty asset payload');
    }
    return {
      id: raw.id ?? '',
      symbol: raw.symbol ?? '',
      description: raw.description,
      name: raw.name ?? raw.symbol ?? '',
      type: raw.type ?? 'STOCK',
      market: raw.market,
      currency: raw.currency ?? 'USD',
      lastPrice: this.toNumber(raw.lastPrice),
      isActive: raw.isActive ?? true,
      listedAt: raw.listedAt
    };
  }

  private toOrderBook(raw: IRawOrderBook | null | undefined, fallbackSymbol: string): IOrderBook {
    return {
      symbol: raw?.symbol ?? fallbackSymbol,
      bids: (raw?.bids ?? []).map((level) => ({
        price: this.toNumber(level.price),
        totalQuantity: this.toInt(level.totalQuantity)
      })),
      asks: (raw?.asks ?? []).map((level) => ({
        price: this.toNumber(level.price),
        totalQuantity: this.toInt(level.totalQuantity)
      }))
    };
  }

  private toOrderResponse(raw: IRawOrderResponse | null | undefined): IOrderResponse {
    if (!raw) {
      throw new Error('Empty order response');
    }
    return {
      id: raw.id ?? '',
      status: (raw.status as IOrderResponse['status']) ?? 'PENDING',
      createdAt: raw.createdAt ?? new Date().toISOString()
    };
  }

  private toMarketOrder(raw: IRawOrderDetails | null | undefined): IMarketOrder {
    if (!raw) {
      throw new Error('Empty order details');
    }
    return {
      id: raw.id ?? '',
      userId: raw.userId ?? '',
      symbol: raw.symbol ?? '',
      side: (raw.side as IMarketOrder['side']) ?? 'BUY',
      type: this.normaliseType(raw.type),
      price: this.toNumber(raw.price),
      quantity: this.toInt(raw.quantity),
      remainingQty: this.toInt(raw.remainingQty),
      status: (raw.status as IMarketOrder['status']) ?? 'PENDING',
      createdAt: raw.createdAt ?? new Date().toISOString()
    };
  }

  private normaliseType(value: string | null | undefined): IMarketOrder['type'] {
    if (value === 'MARKET' || value === 'LIMIT') {
      return value;
    }
    return 'LIMIT';
  }

  private toOrderPayload(request: IOrderRequest): IOrderRequestPayload {
    return {
      symbol: request.symbol,
      side: request.side,
      type: this.toBackendType(request.type),
      price: request.price,
      quantity: request.quantity
    };
  }

  private toUpdatePayload(request: IOrderUpdateRequest): IOrderUpdateRequestPayload {
    return {
      price: request.price,
      quantity: request.quantity
    };
  }

  private toBackendType(type: IOrderRequest['type']): 'MARKET' | 'LIMIT' {
    return type === 'MARKET' ? 'MARKET' : 'LIMIT';
  }

  private toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toInt(value: number | string | null | undefined): number {
    const num = this.toNumber(value);
    return Number.isFinite(num) ? Math.trunc(num) : 0;
  }
}
