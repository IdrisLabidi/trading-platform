export interface IAsset {
  readonly symbol: string;
  readonly name: string;
  readonly type: 'STOCK' | 'ETF' | 'CRYPTO' | 'BOND';
  readonly currency: string;
}
