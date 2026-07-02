import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RealtimeService } from '../../../core/realtime/realtime.service';
import type { IAsset, IMarket, IPriceUpdate } from '../models/market.model';

/**
 * Live signal store for market prices.
 *
 * - Maintains a per-symbol price map updated by every `price:update`
 *   event.
 * - Exposes `subscribe(symbols)` / `unsubscribe(symbols)` helpers that
 *   forward to the underlying realtime transport.
 * - The derived `markets()` signal returns the merged view (symbol +
 *   latest price) ready to be consumed by UI components. When no live
 *   price update has been received yet the store falls back to the
 *   catalog snapshot provided by `markets.store.ts`.
 */
@Injectable({ providedIn: 'root' })
export class MarketWebSocketService {
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _prices = signal<ReadonlyMap<string, IPriceUpdate>>(new Map());
  private readonly _catalog = signal<readonly IAsset[]>([]);
  private readonly _subscribed = signal<readonly string[]>([]);
  private readonly _lastUpdate = signal<IPriceUpdate | null>(null);

  readonly prices = this._prices.asReadonly();
  readonly subscribed = this._subscribed.asReadonly();
  readonly lastUpdate = this._lastUpdate.asReadonly();

  readonly markets = computed<readonly IMarket[]>(() => {
    const priceMap = this._prices();
    const catalog = this._catalog();
    const out: IMarket[] = [];
    if (priceMap.size > 0) {
      for (const [symbol, update] of priceMap) {
        const asset = catalog.find((entry) => entry.symbol === symbol);
        const previous = asset?.lastPrice ?? asset?.previousClose ?? update.price;
        out.push({
          symbol,
          name: asset?.name ?? symbol,
          type: asset?.type ?? 'STOCK',
          currency: asset?.currency ?? 'USD',
          price: update.price,
          previousPrice: previous,
          change: update.price - previous,
          changePercent:
            asset && Number.isFinite(asset.variationPercent)
              ? asset.variationPercent
              : previous === 0
                ? 0
                : (update.price - previous) / previous,
          quantity: asset?.quantity ?? 0,
          volume: asset?.volume ?? 0,
          buyQuantity: asset?.buyQuantity ?? 0,
          buyPrice: asset?.buyPrice ?? 0,
          sellPrice: asset?.sellPrice ?? 0,
          sellQuantity: asset?.sellQuantity ?? 0,
          isActive: asset?.isActive ?? true
        });
      }
      return out;
    }
    return catalog.map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      currency: asset.currency,
      price: asset.lastPrice,
      previousPrice: asset.previousClose,
      change: asset.lastPrice - asset.previousClose,
      changePercent: asset.variationPercent,
      quantity: asset.quantity,
      volume: asset.volume,
      buyQuantity: asset.buyQuantity,
      buyPrice: asset.buyPrice,
      sellPrice: asset.sellPrice,
      sellQuantity: asset.sellQuantity,
      isActive: asset.isActive
    }));
  });

  constructor() {
    this.realtime
      .priceUpdate$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update) => this.applyPrice(update));
  }

  /** Provide the latest asset catalog so price updates can be enriched. */
  setCatalog(assets: readonly IAsset[]): void {
    this._catalog.set(assets);
  }

  /** Subscribe to live price updates for a set of symbols. */
  subscribe(symbols: readonly string[]): void {
    if (symbols.length === 0) {
      return;
    }
    this.realtime.subscribePrices(symbols);
    const next = new Set<string>(this._subscribed());
    for (const symbol of symbols) {
      next.add(symbol);
    }
    this._subscribed.set([...next]);
  }

  /** Cancel a previous subscription. */
  unsubscribe(symbols: readonly string[]): void {
    if (symbols.length === 0) {
      return;
    }
    this.realtime.unsubscribePrices(symbols);
    const next = new Set<string>(this._subscribed());
    for (const symbol of symbols) {
      next.delete(symbol);
    }
    this._subscribed.set([...next]);
  }

  /** Look up the latest known price for a symbol. */
  price(symbol: string): number | null {
    return this._prices().get(symbol)?.price ?? null;
  }

  private applyPrice(update: IPriceUpdate): void {
    this._lastUpdate.set(update);
    this._prices.update((map) => {
      const next = new Map(map);
      next.set(update.symbol, update);
      return next;
    });
  }
}
