import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RealtimeService } from '../../../core/realtime/realtime.service';
import type { IMarket, IPriceUpdate } from '../models/market.model';

/**
 * Live signal store for market prices.
 *
 * - Maintains a per-symbol price map updated by every `price:update`
 *   event.
 * - Exposes `subscribe(symbols)` / `unsubscribe(symbols)` helpers that
 *   forward to the underlying realtime transport.
 * - The derived `markets()` signal returns the merged view (symbol +
 *   latest price) ready to be consumed by UI components.
 */
@Injectable({ providedIn: 'root' })
export class MarketWebSocketService {
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _prices = signal<ReadonlyMap<string, IPriceUpdate>>(new Map());
  private readonly _subscribed = signal<readonly string[]>([]);
  private readonly _lastUpdate = signal<IPriceUpdate | null>(null);

  readonly prices = this._prices.asReadonly();
  readonly subscribed = this._subscribed.asReadonly();
  readonly lastUpdate = this._lastUpdate.asReadonly();

  readonly markets = computed<readonly IMarket[]>(() => {
    const out: IMarket[] = [];
    for (const [symbol, update] of this._prices()) {
      out.push({
        symbol,
        name: symbol,
        price: update.price,
        change: 0,
        changePercent: 0
      });
    }
    return out;
  });

  constructor() {
    this.realtime
      .priceUpdate$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((update) => this.applyPrice(update));
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
