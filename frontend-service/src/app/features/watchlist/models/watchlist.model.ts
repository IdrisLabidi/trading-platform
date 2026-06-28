/**
 * Watchlist group. The backend currently exposes a single list per
 * user; the shape is kept generic so multiple groups can be added
 * later without API churn.
 */
export interface IWatchlist {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly items: readonly IWatchlistItem[];
}

/**
 * Symbol tracked inside a watchlist. `targetPrice` is optional and
 * used to drive alerts / sorting on the UI.
 */
export interface IWatchlistItem {
  readonly symbol: string;
  readonly addedAt: string;
  readonly targetPrice?: number;
  readonly note?: string;
}

/**
 * Body used to create or update a watchlist entry.
 */
export interface IWatchlistItemRequest {
  readonly symbol: string;
  readonly targetPrice?: number;
  readonly note?: string;
}

/**
 * Body used to create or rename a watchlist.
 */
export interface IWatchlistRequest {
  readonly name: string;
  readonly description?: string;
}
