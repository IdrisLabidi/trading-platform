import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { PortfolioWebSocketService } from '../services/portfolio-websocket.service';
import { PortfolioService } from '../services/portfolio.service';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import type {
  IBalance,
  IPosition,
  IPortfolioSummary
} from '../models/portfolio.model';

const EMPTY_BALANCE: IBalance = {
  userId: '',
  cashBalance: 0,
  frozenBalance: 0,
  availableBalance: 0
};

/**
 * Aggregated store for the portfolio feature. Combines the realtime
 * websocket (single source of truth for the UI) with REST endpoints
 * used to hydrate the initial state. All UI components read from
 * this store and never touch the network directly.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  private readonly ws = inject(PortfolioWebSocketService);
  private readonly service = inject(PortfolioService);
  private readonly loader = inject(LoadingService);
  private readonly notifications = inject(NotificationService);

  private readonly _balance = signal<IBalance>(EMPTY_BALANCE);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastLoadedAt = signal<string | null>(null);

  readonly summary = computed<IPortfolioSummary | null>(() => this.ws.summary());
  readonly positions = computed<readonly IPosition[]>(() => this.ws.positions());
  readonly totalValue = computed(() => this.ws.totalValue());
  readonly totalPnL = computed(() => this.ws.totalPnL());
  readonly balance = computed<IBalance>(() => this._balance());
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastLoadedAt = this._lastLoadedAt.asReadonly();

  position(symbol: string): IPosition | null {
    return this.ws.position(symbol);
  }

  /**
   * Fetch the latest balance + positions from the backend and
   * hydrate the realtime store. Idempotent: if a refresh is already
   * in flight, the call is ignored.
   */
  async refresh(): Promise<void> {
    if (this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this.loader.start();
    try {
      const balance = await firstValue(this.service.getBalance());
      this._balance.set(balance);
      await firstValue(this.service.loadSummary());
      this._lastLoadedAt.set(new Date().toISOString());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'portfolio.error.unknown';
      this._error.set(message);
      this.notifications.error('portfolio.error.title', message);
    } finally {
      this._loading.set(false);
      this.loader.stop();
    }
  }

  reset(): void {
    this._balance.set(EMPTY_BALANCE);
    this._error.set(null);
    this._lastLoadedAt.set(null);
  }
}

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
