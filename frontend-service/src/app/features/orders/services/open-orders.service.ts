import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import { AuthService } from '../../../core/services/auth.service';
import type { IOrder } from '../models/order.model';

/**
 * Lightweight wrapper around `OrderService.openOrders()` that
 * enforces the current user identity. Kept as a separate service so
 * the open-orders feature component can mock it without dragging the
 * whole order stack.
 */
@Injectable({ providedIn: 'root' })
export class OpenOrdersService {
  private readonly http = inject(HttpService);
  private readonly auth = inject(AuthService);

  /** Fetch the caller's open (PENDING/PARTIAL) orders. */
  list(): Observable<readonly IOrder[]> {
    const userId = this.auth.user()?.id;
    const path = userId
      ? `/api/orders/users/${encodeURIComponent(userId)}/book`
      : '/api/orders/users/_self/book';
    return this.http
      .get<readonly IRawOrder[]>(path)
      .pipe(map((list) => list.map((raw) => this.toOrder(raw))));
  }

  // --- Internals ----------------------------------------------------

  private toOrder(raw: IRawOrder | null | undefined): IOrder {
    if (!raw) {
      throw new Error('Empty open-order payload');
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
