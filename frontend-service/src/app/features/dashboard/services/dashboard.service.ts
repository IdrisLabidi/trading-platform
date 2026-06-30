import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { MarketsStore } from '../../markets/stores/markets.store';
import { OrderService } from '../../orders/services/order.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { WatchlistService } from '../../watchlist/services/watchlist.service';
import type { IOrder } from '../../orders/models/order.model';
import type { IPriceUpdate } from '../../markets/models/market.model';
import type { IWatchlist } from '../../watchlist/models/watchlist.model';
import type { IPortfolioSummary } from '../../portfolio/models/portfolio.model';

import type { IDashboardService } from './dashboard.service.interface';
import type {
  IDashboardData,
  IDashboardMarketIndex,
  IDashboardPortfolioSnapshot,
  IDashboardRecentTrade,
  IDashboardSummary,
  IDashboardWatchlistSnapshot
} from '../models/dashboard.model';

const OPEN_ORDER_STATUSES: ReadonlySet<IOrder['status']> = new Set(['PENDING', 'PARTIAL', 'OPEN']);
const RECENT_TRADE_STATUSES: ReadonlySet<IOrder['status']> = new Set(['FILLED', 'PARTIAL']);
const RECENT_TRADES_LIMIT = 10;
const MARKET_INDICES_LIMIT = 8;
const PRICE_TICKER_LIMIT = 6;
const WATCHLIST_TOP_LIMIT = 8;

const EMPTY_SUMMARY: IDashboardSummary = {
  portfolioValue: 0,
  dayChange: 0,
  dayChangePercent: 0,
  watchlistCount: 0,
  openOrdersCount: 0,
  tradesToday: 0,
  asOf: new Date(0).toISOString()
};

const EMPTY_PORTFOLIO: IPortfolioSummary = {
  totalValue: 0,
  totalCost: 0,
  totalPnL: 0,
  positions: []
};

const EMPTY_WATCHLIST: IDashboardWatchlistSnapshot = {
  watchlists: [],
  topItems: []
};

/**
 * Frontend aggregation layer for the dashboard. The real backend
 * does not expose a `dashboard-service` microservice, so this
 * service composes the `IDashboardData` payload by combining calls
 * to the existing feature services:
 *
 * - `PortfolioService.loadSummary()`   (`portfolio-service`)
 * - `OrderService.openOrders()`         (`market-service`)
 * - `OrderService.history()`            (`market-service`)
 * - `WatchlistService.list()`           (`/api/watchlists`)
 * - `MarketsStore.markets()`            (`asset-service` + realtime)
 *
 * The widget ownership is documented above and mirrored in the
 * project documentation (see `.ai/context/ARCHITECTURE.md`).
 *
 * Individual source failures are swallowed (`catchError` returns the
 * empty default) so a single broken backend does not break the
 * whole dashboard; the store already surfaces toast errors.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService implements IDashboardService {
  private readonly portfolioService = inject(PortfolioService);
  private readonly orderService = inject(OrderService);
  private readonly watchlistService = inject(WatchlistService);
  private readonly marketsStore = inject(MarketsStore);

  load(): Observable<IDashboardData> {
    return forkJoin({
      portfolio: this.portfolioService.loadSummary().pipe(
        catchError(() => of(EMPTY_PORTFOLIO))
      ),
      openOrders: this.orderService.openOrders().pipe(
        catchError(() => of<readonly IOrder[]>([]))
      ),
      history: this.orderService.history().pipe(
        catchError(() => of<readonly IOrder[]>([]))
      ),
      watchlists: this.watchlistService.list().pipe(
        catchError(() => of<readonly IWatchlist[]>([]))
      )
    }).pipe(
      map(({ portfolio, openOrders, history, watchlists }) => {
        const markets = this.marketsStore.markets();
        const portfolioSnapshot = this.toPortfolioSnapshot(portfolio);
        return {
          summary: this.toSummary(portfolioSnapshot, openOrders, history),
          portfolio: portfolioSnapshot,
          marketIndices: this.toMarketIndices(markets),
          watchlist: this.toWatchlist(watchlists),
          recentTrades: this.toRecentTrades(history),
          priceTicker: this.toPriceTicker(markets)
        };
      })
    );
  }

  // --- Mappers ------------------------------------------------------

  private toSummary(
    portfolio: IDashboardPortfolioSnapshot,
    openOrders: readonly IOrder[],
    history: readonly IOrder[]
  ): IDashboardSummary {
    return {
      portfolioValue: portfolio.totalValue,
      dayChange: portfolio.totalPnL,
      dayChangePercent: portfolio.totalPnLPercent,
      watchlistCount: 0,
      openOrdersCount: this.countOpenOrders(openOrders),
      tradesToday: this.countTradesToday(history),
      asOf: new Date().toISOString()
    };
  }

  private toPortfolioSnapshot(portfolio: IPortfolioSummary): IDashboardPortfolioSnapshot {
    const totalCost = this.toNumber(portfolio.totalCost);
    const totalPnL = this.toNumber(portfolio.totalPnL);
    const totalValue = this.toNumber(portfolio.totalValue);
    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent: totalCost === 0 ? 0 : totalPnL / totalCost,
      positions: portfolio.positions ?? []
    };
  }

  private toWatchlist(
    watchlists: readonly IWatchlist[]
  ): IDashboardWatchlistSnapshot {
    const flat = watchlists
      .flatMap((entry) => entry.items ?? [])
      .slice()
      .sort((a, b) => this.compareTimestampDesc(a.addedAt, b.addedAt))
      .slice(0, WATCHLIST_TOP_LIMIT);
    return {
      watchlists,
      topItems: flat
    };
  }

  private toMarketIndices(
    markets: ReadonlyArray<{
      readonly symbol: string;
      readonly name: string;
      readonly price: number;
      readonly previousPrice: number;
      readonly change: number;
      readonly changePercent: number;
    }>
  ): readonly IDashboardMarketIndex[] {
    return [...markets]
      .map((market) => ({
        symbol: market.symbol,
        name: market.name,
        value: this.toNumber(market.price),
        change: this.toNumber(market.change),
        changePercent: this.toPercent(market.changePercent)
      }))
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, MARKET_INDICES_LIMIT);
  }

  private toPriceTicker(
    markets: ReadonlyArray<{
      readonly symbol: string;
      readonly price: number;
    }>
  ): readonly IPriceUpdate[] {
    const now = new Date().toISOString();
    return markets.slice(0, PRICE_TICKER_LIMIT).map((market) => ({
      symbol: market.symbol,
      price: this.toNumber(market.price),
      timestamp: now
    }));
  }

  private toRecentTrades(history: readonly IOrder[]): readonly IDashboardRecentTrade[] {
    return history
      .filter((order) => RECENT_TRADE_STATUSES.has(order.status))
      .sort((a, b) => this.compareTimestampDesc(a.createdAt, b.createdAt))
      .slice(0, RECENT_TRADES_LIMIT)
      .map((order) => ({
        id: order.id,
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price,
        executedAt: order.createdAt
      }));
  }

  // --- Helpers ------------------------------------------------------

  private countOpenOrders(openOrders: readonly IOrder[]): number {
    return openOrders.filter((order) => OPEN_ORDER_STATUSES.has(order.status)).length;
  }

  private countTradesToday(history: readonly IOrder[]): number {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startTime = start.getTime();
    return history.filter((order) => {
      if (!RECENT_TRADE_STATUSES.has(order.status)) {
        return false;
      }
      const stamp = new Date(order.createdAt).getTime();
      return Number.isFinite(stamp) && stamp >= startTime;
    }).length;
  }

  private compareTimestampDesc(a: string, b: string): number {
    const ta = new Date(a).getTime();
    const tb = new Date(b).getTime();
    if (!Number.isFinite(ta) && !Number.isFinite(tb)) {
      return 0;
    }
    if (!Number.isFinite(ta)) {
      return 1;
    }
    if (!Number.isFinite(tb)) {
      return -1;
    }
    return tb - ta;
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

  private toPercent(value: number | string | null | undefined): number {
    const num = this.toNumber(value);
    return Number.isFinite(num) ? num : 0;
  }
}
