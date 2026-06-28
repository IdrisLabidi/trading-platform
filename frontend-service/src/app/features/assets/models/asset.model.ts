import type { AssetType, IAsset } from '../../markets/models/market.model';

export type { AssetType, IAsset } from '../../markets/models/market.model';

/**
 * Catalog-wide filter applied on the assets listing page.
 */
export interface IAssetCatalogCriteria {
  readonly query: string;
  readonly type: AssetType | 'ALL';
  readonly market: string | 'ALL';
  readonly activeOnly: boolean;
}

/**
 * Aggregated metadata for the catalog (markets / types / counts).
 */
export interface IAssetCatalogSummary {
  readonly total: number;
  readonly active: number;
  readonly byType: ReadonlyMap<AssetType, number>;
  readonly byMarket: ReadonlyMap<string, number>;
}
