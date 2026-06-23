import { Injectable, computed, inject } from '@angular/core';

import { MarketWebSocketService } from '../services/market-websocket.service';
import type { IMarket, IPriceUpdate } from '../models/market.model';

/**
 * Aggregated store for market data. Wraps the realtime price stream
 * and exposes selectors (latest price, subscribed symbols) without
 * forcing components to know about the underlying Socket.IO
 * transport.
 */
@Injectable({ providedIn: 'root' })
export class MarketsStore {
  private readonly ws = inject(MarketWebSocketService);

  readonly markets = computed<readonly IMarket[]>(() => this.ws.markets());
  readonly subscribed = computed<readonly string[]>(() => this.ws.subscribed());
  readonly lastUpdate = computed<IPriceUpdate | null>(() => this.ws.lastUpdate());

  price(symbol: string): number | null {
    return this.ws.price(symbol);
  }

  subscribe(symbols: readonly string[]): void {
    this.ws.subscribe(symbols);
  }

  unsubscribe(symbols: readonly string[]): void {
    this.ws.unsubscribe(symbols);
  }
}
