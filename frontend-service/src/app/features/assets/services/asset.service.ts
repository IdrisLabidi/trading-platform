import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import type { IAsset } from '../models/asset.model';

interface IRawAsset {
  readonly id?: string;
  readonly symbol?: string;
  readonly description?: string;
  readonly name?: string;
  readonly type?: IAsset['type'];
  readonly market?: string;
  readonly currency?: string;
  readonly lastPrice?: number | string | null;
  readonly isActive?: boolean;
  readonly listedAt?: string;
}

interface IRawAssetList {
  readonly items?: readonly IRawAsset[];
}

/**
 * Concrete adapter for the `asset-service` REST API. The service is
 * intentionally thin: it only performs HTTP calls and normalises the
 * payload. All UI state lives in the feature store.
 */
@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpService);

  /** Fetch every asset registered in the catalog. */
  list(): Observable<readonly IAsset[]> {
    return this.http
      .get<IRawAssetList | null>('/api/assets')
      .pipe(map((payload) => this.unwrapList(payload).map((raw) => this.toAsset(raw))));
  }

  /** Fetch a single asset by its catalog UUID. */
  get(id: string): Observable<IAsset> {
    return this.http
      .get<IRawAsset>(`/api/assets/${encodeURIComponent(id)}`)
      .pipe(map((raw) => this.toAsset(raw)));
  }

  /** Fetch a single asset by its symbol (e.g. `AAPL`). */
  getBySymbol(symbol: string): Observable<IAsset> {
    return this.http
      .get<IRawAsset>(`/api/assets/symbol/${encodeURIComponent(symbol)}`)
      .pipe(map((raw) => this.toAsset(raw)));
  }

  // --- Helpers ------------------------------------------------------

  private unwrapList(payload: IRawAssetList | null | undefined): readonly IRawAsset[] {
    if (!payload) {
      return [];
    }
    const items = payload.items;
    if (Array.isArray(items)) {
      return items;
    }
    return [];
  }

  private toAsset(raw: IRawAsset | null | undefined): IAsset {
    if (!raw) {
      throw new Error('Empty asset payload');
    }
    const lastPrice = this.toNumber(raw.lastPrice);
    return {
      id: raw.id ?? '',
      symbol: raw.symbol ?? '',
      description: raw.description,
      name: raw.name ?? raw.symbol ?? '',
      type: raw.type ?? 'STOCK',
      market: raw.market,
      currency: raw.currency ?? 'USD',
      lastPrice,
      isActive: raw.isActive ?? true,
      listedAt: raw.listedAt
    };
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
}
