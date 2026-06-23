export interface IPosition {
  readonly symbol: string;
  readonly quantity: number;
  readonly averagePrice: number;
  readonly currentPrice: number;
}

export interface IPortfolioSummary {
  readonly totalValue: number;
  readonly totalCost: number;
  readonly totalPnL: number;
  readonly positions: readonly IPosition[];
}
