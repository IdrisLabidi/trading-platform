import type { IPosition } from '../../portfolio/models/portfolio.model';
import type { IMarket, IPriceUpdate } from '../../markets/models/market.model';
import type { IWatchlist, IWatchlistItem } from '../../watchlist/models/watchlist.model';
import type { ITrade } from '../../history/models/trade.model';

/**
 * Top-level value rendered on the dashboard hero card. Mirrors what
 * the backend `GET /api/dashboard/summary` returns. The dashboard
 * service is responsible for normalising backend payloads into this
 * shape so the rest of the feature can consume a single contract.
 */
export interface IDashboardSummary {
  /** Total market value of the connected portfolio, in account currency. */
  readonly portfolioValue: number;
  /** Absolute change of the portfolio value since the previous session. */
  readonly dayChange: number;
  /** Relative change of the portfolio value since the previous session. */
  readonly dayChangePercent: number;
  /** Number of watchlists followed by the user. */
  readonly watchlistCount: number;
  /** Number of open (in-flight) orders for the user. */
  readonly openOrdersCount: number;
  /** Number of trades executed today. */
  readonly tradesToday: number;
  /** Server timestamp the snapshot was generated at. */
  readonly asOf: string;
}

/**
 * Snapshot of the portfolio rendered in the "Portfolio summary"
 * widget. It is a slimmed-down view of `IPortfolioSummary` from the
 * portfolio feature, intentionally copied here so the dashboard
 * remains decoupled from feature-level stores.
 */
export interface IDashboardPortfolioSnapshot {
  readonly totalValue: number;
  readonly totalCost: number;
  readonly totalPnL: number;
  readonly totalPnLPercent: number;
  readonly positions: readonly IPosition[];
}

/**
 * Index/Market overview shown in the dedicated card. Kept tiny: a
 * label (e.g. "CAC 40"), the latest value, and the variation since
 * the previous session close.
 */
export interface IDashboardMarketIndex {
  readonly symbol: string;
  readonly name: string;
  readonly value: number;
  readonly change: number;
  readonly changePercent: number;
}

/**
 * Watchlist snapshot used by the dashboard widget. The store keeps
 * the full list of watchlists but only the first `limit` items are
 * rendered by default to stay consistent with the layout.
 */
export interface IDashboardWatchlistSnapshot {
  readonly watchlists: readonly IWatchlist[];
  readonly topItems: readonly IWatchlistItem[];
}

/**
 * Lightweight projection of a recent trade shown in the "Recent
 * activity" widget. Wraps the backend `ITrade` together with the
 * resolved `displaySymbol` for ergonomics.
 */
export interface IDashboardRecentTrade {
  readonly id: string;
  readonly orderId: string;
  readonly symbol: string;
  readonly side: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly price: number;
  readonly executedAt: string;
}

/**
 * Bundle of the latest price updates pushed by the realtime layer.
 * The dashboard renders a small ticker from the first few entries.
 */
export type IDashboardPriceTicker = readonly IPriceUpdate[];

/**
 * Aggregated payload produced by the dashboard service. The signal
 * store mirrors this shape via the `data` signal.
 */
export interface IDashboardData {
  readonly summary: IDashboardSummary;
  readonly portfolio: IDashboardPortfolioSnapshot;
  readonly marketIndices: readonly IDashboardMarketIndex[];
  readonly watchlist: IDashboardWatchlistSnapshot;
  readonly recentTrades: readonly IDashboardRecentTrade[];
  readonly priceTicker: IDashboardPriceTicker;
}

/**
 * Re-exports of the most useful upstream models so dashboard widgets
 * do not have to import from sibling features directly. This is the
 * single public surface of the dashboard model layer.
 */
export type {
  IMarket,
  IPosition,
  ITrade,
  IWatchlist,
  IWatchlistItem
};
