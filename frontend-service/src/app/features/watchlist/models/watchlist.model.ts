export interface IWatchlist {
  readonly id: string;
  readonly name: string;
  readonly items: readonly IWatchlistItem[];
}

export interface IWatchlistItem {
  readonly symbol: string;
  readonly addedAt: string;
  readonly targetPrice?: number;
}
