import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import { AuthService } from '../../../core/services/auth.service';
import type {
  IBalance,
  IPosition,
  IPortfolioSummary
} from '../models/portfolio.model';
import { PortfolioWebSocketService } from './portfolio-websocket.service';

/**
 * REST adapter for `portfolio-service`. Combines the cash balance
 * and the position list into the shape expected by the UI and
 * hydrates the realtime store so the feature keeps a single source
 * of truth.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly http = inject(HttpService);
  private readonly auth = inject(AuthService);
  private readonly ws = inject(PortfolioWebSocketService);

  /** Fetch the caller's cash balance. */
  getBalance(): Observable<IBalance> {
    const userId = this.requireUserId();
    return this.http
      .get<IRawBalance>(`/api/portfolio/${encodeURIComponent(userId)}/balance`)
      .pipe(map((raw) => this.toBalance(raw, userId)));
  }

  /** Fetch every position owned by the caller. */
  getPositions(): Observable<readonly IPosition[]> {
    const userId = this.requireUserId();
    return this.http
      .get<readonly IRawPosition[]>(`/api/portfolio/${encodeURIComponent(userId)}/positions`)
      .pipe(map((list) => list.map((raw) => this.toPosition(raw))));
  }

  /** Fetch a single position by symbol. */
  getPosition(symbol: string): Observable<IPosition> {
    const userId = this.requireUserId();
    return this.http
      .get<IRawPosition>(
        `/api/portfolio/${encodeURIComponent(userId)}/positions/${encodeURIComponent(symbol)}`
      )
      .pipe(map((raw) => this.toPosition(raw)));
  }

  /**
   * Convenience: fetch the balance + positions, compute the derived
   * totals and push the resulting summary into the realtime store
   * so the rest of the UI consumes a single contract.
   */
  loadSummary(): Observable<IPortfolioSummary> {
    return forkJoin({
      balance: this.getBalance(),
      positions: this.getPositions()
    }).pipe(
      map(({ balance, positions }) => {
        const totalCost = positions.reduce(
          (sum, position) => sum + position.averagePrice * position.quantity,
          0
        );
        const totalValue = positions.reduce(
          (sum, position) => sum + position.currentPrice * position.quantity,
          balance.cashBalance
        );
        const totalPnL = totalValue - totalCost - balance.cashBalance;
        const summary: IPortfolioSummary = {
          totalValue,
          totalCost,
          totalPnL,
          positions
        };
        this.ws.hydrate({
          totalValue,
          totalCost,
          totalPnL,
          positions
        });
        return summary;
      })
    );
  }

  // --- Helpers -----------------------------------------------------

  private requireUserId(): string {
    const userId = this.auth.user()?.id;
    if (!userId) {
      throw new Error('Cannot resolve user id for portfolio request');
    }
    return userId;
  }

  private toBalance(raw: IRawBalance | null | undefined, fallbackUserId: string): IBalance {
    return {
      userId: raw?.userId ?? fallbackUserId,
      cashBalance: this.toNumber(raw?.cashBalance),
      frozenBalance: this.toNumber(raw?.frozenBalance),
      availableBalance: this.toNumber(raw?.availableBalance)
    };
  }

  private toPosition(raw: IRawPosition | null | undefined): IPosition {
    if (!raw) {
      throw new Error('Empty position payload');
    }
    return {
      symbol: raw.symbol ?? '',
      quantity: this.toInt(raw.quantity),
      averagePrice: this.toNumber(raw.avgPrice),
      currentPrice: this.toNumber(raw.avgPrice),
      frozenQuantity: raw.frozenQuantity !== undefined ? this.toInt(raw.frozenQuantity) : undefined,
      availableQuantity:
        raw.availableQuantity !== undefined ? this.toInt(raw.availableQuantity) : undefined
    };
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

interface IRawBalance {
  readonly userId?: string;
  readonly cashBalance?: number | string | null;
  readonly frozenBalance?: number | string | null;
  readonly availableBalance?: number | string | null;
}

interface IRawPosition {
  readonly userId?: string;
  readonly symbol?: string;
  readonly quantity?: number | string | null;
  readonly frozenQuantity?: number | string | null;
  readonly availableQuantity?: number | string | null;
  readonly avgPrice?: number | string | null;
}
