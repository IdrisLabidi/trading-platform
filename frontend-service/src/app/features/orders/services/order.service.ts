import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import { AuthService } from '../../../core/services/auth.service';
import type {
  IOrder,
  IOrderBook,
  IOrderResponse,
  IOrderUpdateRequest
} from '../models/order.model';

interface IRawOrderBookLevel {
  readonly price?: number | string | null;
  readonly totalQuantity?: number | string | null;
}

interface IRawOrderBook {
  readonly symbol?: string;
  readonly bids?: readonly IRawOrderBookLevel[];
  readonly asks?: readonly IRawOrderBookLevel[];
}

interface IRawOrder {
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

interface IRawOrderResponse {
  readonly id?: string;
  readonly status?: string;
  readonly createdAt?: string;
}

interface IOrderUpdateRequestPayload {
  price?: number;
  quantity?: number;
}

/**
 * REST adapter for the order lifecycle endpoints exposed by
 * `market-service` (`/api/orders`). The service only owns HTTP
 * concerns; persistence, selection and UI state live in the order
 * stores.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpService);
  private readonly auth = inject(AuthService);

  /** Fetch a single order owned by the caller. */
  get(orderId: string): Observable<IOrder> {
    return this.http
      .get<IRawOrder>(`/api/orders/${encodeURIComponent(orderId)}`)
      .pipe(map((raw) => this.toOrder(raw)));
  }

  /** Fetch the caller's full order history. */
  history(): Observable<readonly IOrder[]> {
    const userId = this.auth.user()?.id;
    const path = userId
      ? `/api/orders/users/${encodeURIComponent(userId)}`
      : '/api/orders/users/_self';
    return this.http
      .get<readonly IRawOrder[]>(path)
      .pipe(map((list) => list.map((raw) => this.toOrder(raw))));
  }

  /** Fetch the caller's open (PENDING/PARTIAL) orders. */
  openOrders(): Observable<readonly IOrder[]> {
    const userId = this.auth.user()?.id;
    const path = userId
      ? `/api/orders/users/${encodeURIComponent(userId)}/book`
      : '/api/orders/users/_self/book';
    return this.http
      .get<readonly IRawOrder[]>(path)
      .pipe(map((list) => list.map((raw) => this.toOrder(raw))));
  }

  /** Fetch the order book snapshot for a symbol. */
  book(symbol: string): Observable<IOrderBook> {
    return this.http
      .get<IRawOrderBook>(`/api/orders/book/${encodeURIComponent(symbol)}`)
      .pipe(map((raw) => this.toBook(raw, symbol)));
  }

  /** Cancel an open order. */
  cancel(orderId: string): Observable<IOrderResponse> {
    return this.http
      .delete<IRawOrderResponse>(`/api/orders/${encodeURIComponent(orderId)}`)
      .pipe(map((raw) => this.toResponse(raw)));
  }

  /** Update an open order (price/quantity). */
  update(orderId: string, request: IOrderUpdateRequest): Observable<IOrderResponse> {
    return this.http
      .put<IRawOrderResponse, IOrderUpdateRequestPayload>(
        `/api/orders/${encodeURIComponent(orderId)}`,
        this.toUpdatePayload(request)
      )
      .pipe(map((raw) => this.toResponse(raw)));
  }

  // --- Conversions --------------------------------------------------

  private toOrder(raw: IRawOrder | null | undefined): IOrder {
    if (!raw) {
      throw new Error('Empty order payload');
    }
    return {
      id: raw.id ?? '',
      userId: raw.userId ?? '',
      symbol: raw.symbol ?? '',
      side: (raw.side as IOrder['side']) ?? 'BUY',
      type: this.normaliseType(raw.type),
      price: this.toNumber(raw.price),
      quantity: this.toInt(raw.quantity),
      remainingQty: this.toInt(raw.remainingQty),
      status: (raw.status as IOrder['status']) ?? 'PENDING',
      createdAt: raw.createdAt ?? new Date().toISOString()
    };
  }

  private toBook(raw: IRawOrderBook | null | undefined, fallbackSymbol: string): IOrderBook {
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

  private toResponse(raw: IRawOrderResponse | null | undefined): IOrderResponse {
    if (!raw) {
      throw new Error('Empty order response');
    }
    return {
      id: raw.id ?? '',
      status: (raw.status as IOrderResponse['status']) ?? 'PENDING',
      createdAt: raw.createdAt ?? new Date().toISOString()
    };
  }

  private toUpdatePayload(request: IOrderUpdateRequest): IOrderUpdateRequestPayload {
    const payload: IOrderUpdateRequestPayload = {};
    if (request.price !== undefined) {
      payload.price = request.price;
    }
    if (request.quantity !== undefined) {
      payload.quantity = request.quantity;
    }
    return payload;
  }

  private normaliseType(value: string | null | undefined): IOrder['type'] {
    if (value === 'MARKET' || value === 'LIMIT') {
      return value;
    }
    return 'LIMIT';
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
