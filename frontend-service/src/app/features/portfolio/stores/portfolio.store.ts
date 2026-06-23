import { Injectable, computed, inject } from '@angular/core';

import { PortfolioWebSocketService } from '../services/portfolio-websocket.service';
import type { IPosition, IPortfolioSummary } from '../models/portfolio.model';

/**
 * Aggregated store for the user portfolio. Sources exclusively from
 * the realtime layer; the HTTP service may call
 * `PortfolioWebSocketService.hydrate()` after a successful REST call
 * so the UI keeps a single shape.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  private readonly ws = inject(PortfolioWebSocketService);

  readonly summary = computed<IPortfolioSummary | null>(() => this.ws.summary());
  readonly positions = computed<readonly IPosition[]>(() => this.ws.positions());
  readonly totalValue = computed(() => this.ws.totalValue());
  readonly totalPnL = computed(() => this.ws.totalPnL());

  position(symbol: string): IPosition | null {
    return this.ws.position(symbol);
  }
}
