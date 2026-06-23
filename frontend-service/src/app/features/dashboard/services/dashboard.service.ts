import { Injectable, inject } from '@angular/core';
import { combineLatest, map, type Observable } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import type { IPosition, IPortfolioSummary } from '../../portfolio/models/portfolio.model';
import type { IWatchlist, IWatchlistItem } from '../../watchlist/models/watchlist.model';
import type { ITrade } from '../../history/models/trade.model';

import type { IDashboardService } from './dashboard.service.interface';
import type {
  IDashboardData,
  IDashboardMarketIndex,
  IDashboardPortfolioSnapshot,
  IDashboardRecentTrade,
  IDashboardSummary,
  IDashboardWatchlistSnapshot
} from '../models/dashboard.model';

interface IDashboardSummaryDto {
  readonly portfolioValue?: number;
  readonly dayChange?: number;
  readonly dayChangePercent?: number;
  readonly watchlistCount?: number;
  readonly openOrdersCount?: number;
  readonly tradesToday?: number;
  readonly asOf?: string;
}

interface IPortfolioDto {
  readonly totalValue?: number;
  readonly totalCost?: number;
  readonly totalPnL?: number;
  readonly totalPnLPercent?: number;
  readonly positions?: readonly IPosition[];
}

interface IWatchlistsDto {
  readonly watchlists?: readonly IWatchlist[];
}

interface ITradesDto {
  readonly items?: readonly ITrade[];
}

interface IIndicesDto {
  readonly items?: readonly IDashboardMarketIndex[];
}

interface IMarketsDto {
  readonly items?: readonly { readonly symbol: string; readonly name: string; readonly price: number; readonly change: number; readonly changePercent: number }[];
}

const EMPTY_SUMMARY: IDashboardSummary = {
  portfolioValue: 0,
  dayChange: 0,
  dayChangePercent: 0,
  watchlistCount: 0,
  openOrdersCount: 0,
  tradesToday: 0,
  asOf: new Date(0).toISOString()
};

const EMPTY_PORTFOLIO: IDashboardPortfolioSnapshot = {
  totalValue: 0,
  totalCost: 0,
  totalPnL: 0,
  totalPnLPercent: 0,
  positions: []
};

const EMPTY_WATCHLIST: IDashboardWatchlistSnapshot = {
  watchlists: [],
  topItems: [] as readonly IWatchlistItem[]
};

/**
 * Concrete implementation of the dashboard service.
 *
 * Aggregates the backend endpoints required to render the dashboard
 * widgets in a single `load()` call. The real backend is not wired
 * yet so each request is intentionally lightweight: the service maps
 * the (potentially empty) payload into the dashboard contract shape
 * and lets the store surface defaults.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService implements IDashboardService {
  private readonly http = inject(HttpService);

  load(): Observable<IDashboardData> {
    return combineLatest([
      this.fetchSummary(),
      this.fetchPortfolio(),
      this.fetchWatchlists(),
      this.fetchIndices(),
      this.fetchRecentTrades()
    ]).pipe(
      map(([summary, portfolio, watchlist, indices, trades]) => ({
        summary,
        portfolio,
        watchlist,
        marketIndices: indices,
        recentTrades: trades,
        priceTicker: []
      }))
    );
  }

  // --- HTTP wrappers ------------------------------------------------

  private fetchSummary(): Observable<IDashboardSummary> {
    return this.http.get<IDashboardSummaryDto>('/api/dashboard/summary').pipe(
      map((dto) => this.toSummary(dto))
    );
  }

  private fetchPortfolio(): Observable<IDashboardPortfolioSnapshot> {
    return this.http.get<IPortfolioSummary | IPortfolioDto>('/api/portfolio/summary').pipe(
      map((dto) => this.toPortfolio(dto))
    );
  }

  private fetchWatchlists(): Observable<IDashboardWatchlistSnapshot> {
    return this.http.get<IWatchlistsDto>('/api/watchlists').pipe(
      map((dto) => this.toWatchlist(dto))
    );
  }

  private fetchIndices(): Observable<readonly IDashboardMarketIndex[]> {
    return this.http.get<IIndicesDto | IMarketsDto>('/api/markets/indices').pipe(
      map((dto) => this.toIndices(dto))
    );
  }

  private fetchRecentTrades(): Observable<readonly IDashboardRecentTrade[]> {
    return this.http.get<ITradesDto>('/api/history/recent').pipe(
      map((dto) => this.toTrades(dto))
    );
  }

  // --- Mappers ------------------------------------------------------

  private toSummary(dto: IDashboardSummaryDto | null | undefined): IDashboardSummary {
    if (!dto) {
      return EMPTY_SUMMARY;
    }
    return {
      portfolioValue: dto.portfolioValue ?? 0,
      dayChange: dto.dayChange ?? 0,
      dayChangePercent: dto.dayChangePercent ?? 0,
      watchlistCount: dto.watchlistCount ?? 0,
      openOrdersCount: dto.openOrdersCount ?? 0,
      tradesToday: dto.tradesToday ?? 0,
      asOf: dto.asOf ?? new Date().toISOString()
    };
  }

  private toPortfolio(
    dto: IPortfolioSummary | IPortfolioDto | null | undefined
  ): IDashboardPortfolioSnapshot {
    if (!dto) {
      return EMPTY_PORTFOLIO;
    }
    const totalValue = dto.totalValue ?? 0;
    const totalCost = dto.totalCost ?? totalValue;
    const totalPnL = dto.totalPnL ?? totalValue - totalCost;
    return {
      totalValue,
      totalCost,
      totalPnL,
      totalPnLPercent:
        'totalPnLPercent' in dto && typeof dto.totalPnLPercent === 'number'
          ? dto.totalPnLPercent
          : totalCost === 0
            ? 0
            : totalPnL / totalCost,
      positions: dto.positions ?? []
    };
  }

  private toWatchlist(dto: IWatchlistsDto | null | undefined): IDashboardWatchlistSnapshot {
    if (!dto) {
      return EMPTY_WATCHLIST;
    }
    const watchlists = dto.watchlists ?? [];
    const flat: IWatchlistItem[] = watchlists.flatMap((w) => w.items ?? []);
    return {
      watchlists,
      topItems: flat.slice(0, 8)
    };
  }

  private toIndices(
    dto: IIndicesDto | IMarketsDto | null | undefined
  ): readonly IDashboardMarketIndex[] {
    if (!dto) {
      return [];
    }
    if ('items' in dto && Array.isArray(dto.items)) {
      return dto.items;
    }
    return [];
  }

  private toTrades(dto: ITradesDto | null | undefined): readonly IDashboardRecentTrade[] {
    if (!dto || !Array.isArray(dto.items)) {
      return [];
    }
    return dto.items.slice(0, 10).map((trade) => ({
      id: trade.id,
      orderId: trade.orderId,
      symbol: trade.symbol,
      side: trade.side,
      quantity: trade.quantity,
      price: trade.price,
      executedAt: trade.executedAt
    }));
  }
}
