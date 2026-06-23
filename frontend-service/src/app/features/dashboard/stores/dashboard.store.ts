import { Injectable, computed, inject, signal } from '@angular/core';

import type {
  IDashboardData,
  IDashboardMarketIndex,
  IDashboardPortfolioSnapshot,
  IDashboardRecentTrade,
  IDashboardSummary,
  IDashboardWatchlistSnapshot
} from '../models/dashboard.model';
import { DashboardService } from '../services/dashboard.service';
import type { IDashboardService } from '../services/dashboard.service.interface';
import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Signal-based state for the dashboard feature.
 *
 * - `data`    : the most recent aggregated payload (or `null` before
 *               the first successful load).
 * - `loading` : `true` while a refresh is in flight.
 * - `error`   : last error message, cleared on every successful load.
 *
 * Derived signals (`summary`, `portfolio`, ...) are exposed as
 * read-only views so the widgets do not have to repeat the `data()`
 * null check and can simply `?? EMPTY_VALUE` at the call-site.
 *
 * The store owns no business logic: it delegates fetching to the
 * `IDashboardService` contract and is therefore trivial to mock in
 * tests.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly service: IDashboardService = inject(DashboardService);
  private readonly loader = inject(LoadingService);
  private readonly notifications = inject(NotificationService);

  private readonly _data = signal<IDashboardData | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastLoadedAt = signal<string | null>(null);

  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastLoadedAt = this._lastLoadedAt.asReadonly();

  // --- Derived selectors -------------------------------------------

  readonly summary = computed<IDashboardSummary | null>(() => this._data()?.summary ?? null);
  readonly portfolio = computed<IDashboardPortfolioSnapshot | null>(
    () => this._data()?.portfolio ?? null
  );
  readonly marketIndices = computed<readonly IDashboardMarketIndex[]>(
    () => this._data()?.marketIndices ?? []
  );
  readonly watchlist = computed<IDashboardWatchlistSnapshot>(
    () => this._data()?.watchlist ?? { watchlists: [], topItems: [] }
  );
  readonly recentTrades = computed<readonly IDashboardRecentTrade[]>(
    () => this._data()?.recentTrades ?? []
  );

  readonly isReady = computed<boolean>(() => this._data() !== null);
  readonly hasError = computed<boolean>(() => this._error() !== null);

  // --- Commands -----------------------------------------------------

  /**
   * Trigger a fresh fetch. Idempotent: if a load is already in
   * flight, the call is a no-op. Returns the promise for callers
   * that want to await completion (e.g. the toolbar refresh button).
   */
  async refresh(): Promise<void> {
    if (this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this.loader.start();
    try {
      const data = await new Promise<IDashboardData>((resolve, reject) => {
        this.service.load().subscribe({
          next: (value) => resolve(value),
          error: (err: unknown) => reject(err)
        });
      });
      this._data.set(data);
      this._lastLoadedAt.set(new Date().toISOString());
    } catch (err: unknown) {
      const message = this.toMessage(err);
      this._error.set(message);
      this.notifications.error('dashboard.error.title', message);
    } finally {
      this._loading.set(false);
      this.loader.stop();
    }
  }

  /** Drop the in-memory state. Useful when the user signs out. */
  reset(): void {
    this._data.set(null);
    this._error.set(null);
    this._lastLoadedAt.set(null);
  }

  // --- Internals ---------------------------------------------------

  private toMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string') {
      return err;
    }
    return 'dashboard.error.unknown';
  }
}
