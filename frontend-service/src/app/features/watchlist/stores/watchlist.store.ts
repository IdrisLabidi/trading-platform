import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WatchlistService } from '../services/watchlist.service';
import type {
  IWatchlist,
  IWatchlistItem,
  IWatchlistItemRequest,
  IWatchlistRequest
} from '../models/watchlist.model';

export interface IAssetSnapshot {
  readonly price: number;
  readonly currency: string;
  readonly name: string;
}

const EMPTY_ASSETS: ReadonlyMap<string, IAssetSnapshot> = new Map();

/**
 * Aggregated store for the watchlist feature. Combines the REST
 * endpoints exposed by `WatchlistService` with an in-memory cache of
 * asset prices (sourced from `asset-service`) so the UI can render
 * each row with the latest price / target comparison.
 *
 * The store owns the command wrappers that surface user actions
 * (create / rename / delete a list, add / remove / update an item)
 * and updates the local signal state accordingly so the views do not
 * have to refresh after every mutation.
 */
@Injectable({ providedIn: 'root' })
export class WatchlistStore {
  private readonly service = inject(WatchlistService);
  private readonly loader = inject(LoadingService);
  private readonly notifications = inject(NotificationService);

  private readonly _watchlists = signal<readonly IWatchlist[]>([]);
  private readonly _assets = signal<ReadonlyMap<string, IAssetSnapshot>>(EMPTY_ASSETS);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastLoadedAt = signal<string | null>(null);

  readonly watchlists = this._watchlists.asReadonly();
  readonly assets = this._assets.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastLoadedAt = this._lastLoadedAt.asReadonly();

  readonly selectedWatchlist = computed<IWatchlist | null>(() => {
    const id = this._selectedId();
    if (!id) {
      return this._watchlists()[0] ?? null;
    }
    return this._watchlists().find((watchlist) => watchlist.id === id) ?? null;
  });

  readonly totalItems = computed<number>(() =>
    this._watchlists().reduce((sum, list) => sum + list.items.length, 0)
  );

  /** Refresh the bundle (watchlists + asset catalog). */
  async refresh(): Promise<void> {
    if (this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
    this.loader.start();
    try {
      const bundle = await firstValue(this.service.loadBundle());
      this._watchlists.set(bundle.watchlists);
      this._assets.set(bundle.assets);
      this._lastLoadedAt.set(new Date().toISOString());
      if (!this._selectedId() && bundle.watchlists.length > 0) {
        this._selectedId.set(bundle.watchlists[0].id);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'watchlist.error.unknown';
      this._error.set(message);
      this.notifications.error('watchlist.error.title', message);
    } finally {
      this._loading.set(false);
      this.loader.stop();
    }
  }

  select(id: string): void {
    this._selectedId.set(id);
  }

  async create(request: IWatchlistRequest): Promise<IWatchlist> {
    this.loader.start();
    try {
      const watchlist = await firstValue(this.service.create(request));
      this._watchlists.update((list) => [...list, watchlist]);
      this._selectedId.set(watchlist.id);
      this.notifications.success(
        'watchlist.notifications.created.title',
        'watchlist.notifications.created.message'
      );
      return watchlist;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'watchlist.error.create';
      this.notifications.error('watchlist.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  async rename(watchlistId: string, request: IWatchlistRequest): Promise<IWatchlist> {
    this.loader.start();
    try {
      const watchlist = await firstValue(this.service.update(watchlistId, request));
      this.replaceWatchlist(watchlist);
      this.notifications.success(
        'watchlist.notifications.updated.title',
        'watchlist.notifications.updated.message'
      );
      return watchlist;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'watchlist.error.update';
      this.notifications.error('watchlist.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  async remove(watchlistId: string): Promise<void> {
    this.loader.start();
    try {
      await firstValue(this.service.delete(watchlistId));
      this._watchlists.update((list) => list.filter((entry) => entry.id !== watchlistId));
      if (this._selectedId() === watchlistId) {
        const fallback = this._watchlists()[0]?.id ?? null;
        this._selectedId.set(fallback);
      }
      this.notifications.success(
        'watchlist.notifications.removed.title',
        'watchlist.notifications.removed.message'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'watchlist.error.remove';
      this.notifications.error('watchlist.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  async addItem(watchlistId: string, request: IWatchlistItemRequest): Promise<IWatchlistItem> {
    this.loader.start();
    try {
      const item = await firstValue(this.service.addItem(watchlistId, request));
      this.applyItemChange(watchlistId, item, 'add');
      this.notifications.success(
        'watchlist.notifications.itemAdded.title',
        'watchlist.notifications.itemAdded.message'
      );
      return item;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'watchlist.error.itemAdd';
      this.notifications.error('watchlist.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  async updateItem(
    watchlistId: string,
    symbol: string,
    request: Partial<IWatchlistItemRequest>
  ): Promise<IWatchlistItem> {
    this.loader.start();
    try {
      const item = await firstValue(this.service.updateItem(watchlistId, symbol, request));
      this.applyItemChange(watchlistId, item, 'update');
      return item;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'watchlist.error.itemUpdate';
      this.notifications.error('watchlist.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  async removeItem(watchlistId: string, symbol: string): Promise<void> {
    this.loader.start();
    try {
      await firstValue(this.service.removeItem(watchlistId, symbol));
      this.applyItemChange(
        watchlistId,
        { symbol, addedAt: new Date().toISOString() },
        'remove'
      );
      this.notifications.success(
        'watchlist.notifications.itemRemoved.title',
        'watchlist.notifications.itemRemoved.message'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'watchlist.error.itemRemove';
      this.notifications.error('watchlist.error.title', message);
      throw err;
    } finally {
      this.loader.stop();
    }
  }

  /** Look up an asset snapshot (price / currency / name). */
  asset(symbol: string): IAssetSnapshot | null {
    return this._assets().get(symbol) ?? null;
  }

  reset(): void {
    this._watchlists.set([]);
    this._assets.set(EMPTY_ASSETS);
    this._selectedId.set(null);
    this._error.set(null);
    this._lastLoadedAt.set(null);
  }

  // --- Internals ----------------------------------------------------

  private replaceWatchlist(watchlist: IWatchlist): void {
    this._watchlists.update((list) =>
      list.map((entry) => (entry.id === watchlist.id ? watchlist : entry))
    );
  }

  private applyItemChange(
    watchlistId: string,
    item: IWatchlistItem,
    action: 'add' | 'update' | 'remove'
  ): void {
    this._watchlists.update((list) =>
      list.map((watchlist) => {
        if (watchlist.id !== watchlistId) {
          return watchlist;
        }
        const filtered = watchlist.items.filter((entry) => entry.symbol !== item.symbol);
        if (action === 'remove') {
          return { ...watchlist, items: filtered };
        }
        return { ...watchlist, items: [...filtered, item] };
      })
    );
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
