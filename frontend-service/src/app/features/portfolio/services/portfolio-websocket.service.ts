import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RealtimeService } from '../../../core/realtime/realtime.service';
import type {
  IPosition,
  IPortfolioSummary
} from '../models/portfolio.model';

/**
 * Live signal store for the user portfolio. Subscribes to the
 * realtime gateway and exposes three derived signals:
 *
 * - `summary()`     : most recent full summary.
 * - `positions()`   : the full position list (latest known snapshot).
 * - `position(symbol)` : the position for a given symbol, if any.
 *
 * No REST calls are issued from this service.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioWebSocketService {
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _summary = signal<IPortfolioSummary | null>(null);
  private readonly _positions = signal<readonly IPosition[]>([]);
  private readonly _lastEvent = signal<IPosition | null>(null);

  readonly summary = this._summary.asReadonly();
  readonly positions = this._positions.asReadonly();
  readonly lastEvent = this._lastEvent.asReadonly();

  readonly totalValue = computed(() => this._summary()?.totalValue ?? 0);
  readonly totalPnL = computed(() => this._summary()?.totalPnL ?? 0);

  constructor() {
    this.realtime
      .portfolioSummary$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((summary) => {
        this._summary.set(summary);
        this._positions.set(summary.positions);
      });

    this.realtime
      .portfolioPosition$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((position) => this.applyPosition(position));
  }

  /** Look up a position by symbol without iterating the view layer. */
  position(symbol: string): IPosition | null {
    return this._positions().find((p) => p.symbol === symbol) ?? null;
  }

  /** Force a snapshot from the REST layer (called by HTTP services). */
  hydrate(summary: IPortfolioSummary): void {
    this._summary.set(summary);
    this._positions.set(summary.positions);
  }

  private applyPosition(position: IPosition): void {
    this._lastEvent.set(position);
    this._positions.update((list) => upsertBySymbol(list, position));
  }
}

function upsertBySymbol(
  list: readonly IPosition[],
  position: IPosition
): IPosition[] {
  const filtered = list.filter((p) => p.symbol !== position.symbol);
  return [position, ...filtered];
}
