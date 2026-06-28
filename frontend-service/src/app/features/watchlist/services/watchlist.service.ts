import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { HttpService } from '../../../core/services/http.service';
import type {
  IWatchlist,
  IWatchlistItem,
  IWatchlistItemRequest,
  IWatchlistRequest
} from '../models/watchlist.model';

interface IRawWatchlistItem {
  readonly symbol?: string;
  readonly addedAt?: string;
  readonly targetPrice?: number | string | null;
  readonly note?: string;
}

interface IRawWatchlist {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly items?: readonly IRawWatchlistItem[];
}

interface IRawAsset {
  readonly symbol?: string;
  readonly name?: string;
  readonly currency?: string;
  readonly lastPrice?: number | string | null;
}

interface IRawAssetList {
  readonly items?: readonly IRawAsset[];
}

interface IItemPayload {
  symbol: string;
  targetPrice?: number;
  note?: string;
}

interface IWatchlistPayload {
  name: string;
  description?: string;
}

/**
 * REST adapter for the watchlist endpoints. The frontend treats the
 * watchlist as a collection owned by the authenticated user (the
 * backend enforces the ownership with `userId == jwt.sub`). The REST
 * surface is exposed at `/api/watchlists` so the API can add
 * per-resource endpoints later without changing the frontend.
 */
@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly http = inject(HttpService);

  /** Fetch the caller`s watchlists. */
  list(): Observable<readonly IWatchlist[]> {
    return this.http
      .get<IRawWatchlist[] | null>('/api/watchlists')
      .pipe(map((payload) => (payload ?? []).map((raw) => this.toWatchlist(raw))));
  }

  /** Fetch a single watchlist by id. */
  get(watchlistId: string): Observable<IWatchlist> {
    return this.http
      .get<IRawWatchlist>(`/api/watchlists/${encodeURIComponent(watchlistId)}`)
      .pipe(map((raw) => this.toWatchlist(raw)));
  }

  /** Create a new watchlist owned by the caller. */
  create(request: IWatchlistRequest): Observable<IWatchlist> {
    return this.http
      .post<IRawWatchlist, IWatchlistPayload>('/api/watchlists', this.toPayload(request))
      .pipe(map((raw) => this.toWatchlist(raw)));
  }

  /** Rename or update the description of an owned watchlist. */
  update(watchlistId: string, request: IWatchlistRequest): Observable<IWatchlist> {
    return this.http
      .put<IRawWatchlist, IWatchlistPayload>(
        `/api/watchlists/${encodeURIComponent(watchlistId)}`,
        this.toPayload(request)
      )
      .pipe(map((raw) => this.toWatchlist(raw)));
  }

  /** Delete an owned watchlist. */
  delete(watchlistId: string): Observable<void> {
    return this.http.delete<void>(`/api/watchlists/${encodeURIComponent(watchlistId)}`);
  }

  /** Add a symbol to a watchlist. */
  addItem(watchlistId: string, request: IWatchlistItemRequest): Observable<IWatchlistItem> {
    return this.http
      .post<IRawWatchlistItem, IItemPayload>(
        `/api/watchlists/${encodeURIComponent(watchlistId)}/items`,
        this.toItemPayload(request)
      )
      .pipe(map((raw) => this.toItem(raw)));
  }

  /** Update an existing watchlist entry (target price / note). */
  updateItem(
    watchlistId: string,
    symbol: string,
    request: Partial<IWatchlistItemRequest>
  ): Observable<IWatchlistItem> {
    return this.http
      .put<IRawWatchlistItem, IItemPayload>(
        `/api/watchlists/${encodeURIComponent(watchlistId)}/items/${encodeURIComponent(symbol)}`,
        this.toItemPayload(request)
      )
      .pipe(map((raw) => this.toItem(raw)));
  }

  /** Remove a symbol from a watchlist. */
  removeItem(watchlistId: string, symbol: string): Observable<void> {
    return this.http.delete<void>(
      `/api/watchlists/${encodeURIComponent(watchlistId)}/items/${encodeURIComponent(symbol)}`
    );
  }

  /**
   * Convenience: fetch every watchlist plus the asset catalog so the
   * UI can render the rows with their current price without an extra
   * round trip. The catalog is sourced from the public asset-service
   * so the watchlist feature does not depend on the markets store.
   */
  loadBundle(): Observable<{
    readonly watchlists: readonly IWatchlist[];
    readonly assets: ReadonlyMap<string, { readonly price: number; readonly currency: string; readonly name: string }>;
  }> {
    return forkJoin({
      watchlists: this.list(),
      assets: this.http
        .get<IRawAssetList | null>('/api/assets')
        .pipe(
          map((payload) => {
            const items = payload?.items ?? [];
            const map = new Map<
              string,
              { readonly price: number; readonly currency: string; readonly name: string }
            >();
            for (const item of items) {
              if (!item.symbol) {
                continue;
              }
              map.set(item.symbol, {
                price: this.toNumber(item.lastPrice),
                currency: item.currency ?? 'USD',
                name: item.name ?? item.symbol
              });
            }
            return map;
          })
        )
    }).pipe(map(({ watchlists, assets }) => ({ watchlists, assets })));
  }

  // --- Internals ----------------------------------------------------

  private toWatchlist(raw: IRawWatchlist | null | undefined): IWatchlist {
    if (!raw) {
      throw new Error('Empty watchlist payload');
    }
    return {
      id: raw.id ?? '',
      name: raw.name ?? '',
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      items: (raw.items ?? []).map((item) => this.toItem(item))
    };
  }

  private toItem(raw: IRawWatchlistItem | null | undefined): IWatchlistItem {
    if (!raw) {
      throw new Error('Empty watchlist item payload');
    }
    return {
      symbol: raw.symbol ?? '',
      addedAt: raw.addedAt ?? new Date().toISOString(),
      targetPrice: raw.targetPrice !== undefined ? this.toNumber(raw.targetPrice) : undefined,
      note: raw.note
    };
  }

  private toPayload(request: IWatchlistRequest): IWatchlistPayload {
    const payload: IWatchlistPayload = { name: request.name };
    if (request.description !== undefined) {
      payload.description = request.description;
    }
    return payload;
  }

  private toItemPayload(request: Partial<IWatchlistItemRequest>): IItemPayload {
    const payload: IItemPayload = { symbol: request.symbol ?? '' };
    if (request.targetPrice !== undefined) {
      payload.targetPrice = request.targetPrice;
    }
    if (request.note !== undefined) {
      payload.note = request.note;
    }
    return payload;
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
