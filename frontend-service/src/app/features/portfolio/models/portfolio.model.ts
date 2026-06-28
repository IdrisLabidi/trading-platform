/**
 * Position held by a user in a given asset. Mirrors the backend
 * `PositionResponse` record returned by `portfolio-service`.
 */
export interface IPosition {
  readonly symbol: string;
  readonly quantity: number;
  readonly averagePrice: number;
  readonly currentPrice: number;
  readonly frozenQuantity?: number;
  readonly availableQuantity?: number;
}

/**
 * Aggregate cash balance returned by `GET /api/portfolio/{userId}/balance`.
 */
export interface IBalance {
  readonly userId: string;
  readonly cashBalance: number;
  readonly frozenBalance: number;
  readonly availableBalance: number;
}

/**
 * Portfolio summary consumed by the portfolio feature. The total
 * fields are derived locally from positions + balance; the backend
 * currently returns positions only.
 */
export interface IPortfolioSummary {
  readonly totalValue: number;
  readonly totalCost: number;
  readonly totalPnL: number;
  readonly positions: readonly IPosition[];
}
