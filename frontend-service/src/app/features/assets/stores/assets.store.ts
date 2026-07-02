import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { LoadingService } from '../../../core/services/loading.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AssetService } from '../services/asset.service';
import { MarketsStore } from '../../markets/stores/markets.store';
import type { IAsset, AssetType } from '../models/asset.model';
import type { IAssetCatalogSummary } from '../models/asset.model';

const EMPTY_SUMMARY: IAssetCatalogSummary = {
  total: 0,
  active: 0,
  byType: new Map(),
  byMarket: new Map()
};

/**
 * Aggregated store for the assets feature. Owns the catalog fetch
 * (delegated to `AssetService`) and exposes the per-symbol
 * selectors used by the catalog / detail pages. Realtime price
 * updates are merged in through the shared `MarketsStore` so the
 * catalog row reflects the latest price without a refetch.
 */
@Injectable({ providedIn: 'root' })
export class AssetsStore {
  private readonly service = inject(AssetService);
  private readonly marketsStore = inject(MarketsStore);
  private readonly loader = inject(LoadingService);
  private readonly notifications = inject(NotificationService);
  private readonly refreshIntervalMs = 60_000;

  private readonly _assets = signal<readonly IAsset[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastLoadedAt = signal<string | null>(null);
  private _pollHandle: ReturnType<typeof setInterval> | null = null;

  readonly assets = this._assets.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastLoadedAt = this._lastLoadedAt.asReadonly();

  /** Catalog aggregated by type / market. */
  readonly summary = computed<IAssetCatalogSummary>(() => {
    const assets = this._assets();
    const byType = new Map<AssetType, number>();
    const byMarket = new Map<string, number>();
    let active = 0;
    for (const asset of assets) {
      byType.set(asset.type, (byType.get(asset.type) ?? 0) + 1);
      if (asset.market) {
        byMarket.set(asset.market, (byMarket.get(asset.market) ?? 0) + 1);
      }
      if (asset.isActive) {
        active += 1;
      }
    }
    return {
      total: assets.length,
      active,
      byType,
      byMarket
    };
  });

  readonly markets = computed<readonly string[]>(() => {
    const set = new Set<string>();
    for (const asset of this._assets()) {
      if (asset.market) {
        set.add(asset.market);
      }
    }
    return [...set].sort();
  });

  /** Combine the REST catalog with the latest market prices. */
  readonly catalog = computed<readonly IAsset[]>(() => {
    const markets = this.marketsStore.markets();
    if (markets.length === 0) {
      return this._assets();
    }
    const priceMap = new Map(markets.map((entry) => [entry.symbol, entry.price]));
    return this._assets().map((asset) => ({
      ...asset,
      lastPrice: priceMap.get(asset.symbol) ?? asset.lastPrice
    }));
  });

  /** Look up a single asset by symbol. */
  bySymbol(symbol: string): IAsset | null {
   return this.catalog().find((asset) => asset.symbol === symbol) ?? null;
  }

  /** Refresh the catalog from the backend. */
  async refresh(options: { readonly silent?: boolean } = {}): Promise<void> {
    if (this._loading()) {
      return;
    }
    this._loading.set(true);
    this._error.set(null);
   if (!options.silent) {
     this.loader.start();
   }
   try {
     const assets = await firstValue(this.service.list());
     this._assets.set(assets);
     this.marketsStore.syncCatalog(assets);
     this._lastLoadedAt.set(new Date().toISOString());
     this.startPolling();
   } catch (err: unknown) {
     const message = err instanceof Error ? err.message : 'assets.error.unknown';
     this._error.set(message);
     if (options.silent) {
       console.error('Failed to refresh assets catalog', err);
     } else {
       this.notifications.error('assets.error.title', message);
     }
   } finally {
     this._loading.set(false);
     if (!options.silent) {
       this.loader.stop();
     }
   }
  }

  /** Fetch a single asset by symbol (refreshes the local cache). */
  async loadBySymbol(symbol: string): Promise<IAsset | null> {
    const upper = symbol.toUpperCase();
    try {
      const asset = await firstValue(this.service.getBySymbol(upper));
      this._assets.update((list) => upsertBySymbol(list, asset));
      this.marketsStore.syncCatalog(this.catalog());
      return asset;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'assets.error.fetch';
      this.notifications.error('assets.error.title', message);
      return null;
    }
  }

  reset(): void {
    this._assets.set([]);
    this._error.set(null);
    this._lastLoadedAt.set(null);
    if (this._pollHandle !== null) {
      clearInterval(this._pollHandle);
      this._pollHandle = null;
    }
  }

  private startPolling(): void {
    if (this._pollHandle !== null) {
      return;
    }
    this._pollHandle = setInterval(() => {
      void this.refresh({ silent: true });
    }, this.refreshIntervalMs);
  }
}

function upsertBySymbol(list: readonly IAsset[], asset: IAsset): IAsset[] {
  const filtered = list.filter((entry) => entry.symbol !== asset.symbol);
  return [...filtered, asset];
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

export { EMPTY_SUMMARY };
