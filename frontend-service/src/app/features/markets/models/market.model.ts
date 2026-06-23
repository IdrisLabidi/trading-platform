export interface IMarket {
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
}

export interface IPriceUpdate {
  readonly symbol: string;
  readonly price: number;
  readonly timestamp: string;
}
