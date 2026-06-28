import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { MarketsStore } from '../stores/markets.store';
import type { IMarket } from '../models/market.model';
import type { AssetType } from '../models/market.model';
import { MarketCardComponent } from './market-card.component';
import {
  MarketSearchComponent,
  type IMarketSearchCriteria
} from './market-search.component';

/**
 * Markets listing page. Loads the catalog from the backend, keeps
 * the price stream live via the websocket store and lets the user
 * filter by symbol / asset type / activity flag.
 */
@Component({
  selector: 'app-markets-list',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    MarketCardComponent,
    MarketSearchComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-globe text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'markets.list.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'markets.list.subtitle' | translate }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          @if (lastUpdateLabel(); as label) {
            <p-tag [value]="label" severity="info" [rounded]="true"></p-tag>
          }
          <p-button
            size="small"
            [outlined]="true"
            severity="secondary"
            [loading]="store.loading()"
            (onClick)="refresh()"
          >
            <i class="pi pi-refresh" pButtonIcon></i>
            <span pButtonLabel>{{ 'markets.list.refresh' | translate }}</span>
          </p-button>
        </div>
      </header>

      <div class="px-4 sm:px-6">
        <app-market-search (criteriaChange)="onCriteria($event)" />
      </div>

      <div class="flex-1 overflow-auto px-4 pb-6 sm:px-6">
        @if (store.loading() && filteredMarkets().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
          >
            <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
            <span>{{ 'markets.list.loading' | translate }}</span>
          </div>
        } @else if (store.error() && filteredMarkets().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-danger)]"
            role="alert"
          >
            <i class="pi pi-exclamation-triangle text-2xl" aria-hidden="true"></i>
            <p>{{ store.error() }}</p>
          </div>
        } @else if (filteredMarkets().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-search text-2xl" aria-hidden="true"></i>
            <p>{{ 'markets.list.empty' | translate }}</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            @for (market of filteredMarkets(); track market.symbol) {
              <app-market-card [market]="market" />
            }
          </div>
        }
      </div>
    </div>
  `
})
export class MarketsListComponent implements OnInit {
  readonly store = inject(MarketsStore);

  private readonly _criteria = signal<IMarketSearchCriteria>({
    query: '',
    type: 'ALL',
    activeOnly: true
  });

  readonly filteredMarkets = computed<readonly IMarket[]>(() => {
    const criteria = this._criteria();
    const query = criteria.query.toUpperCase();
    return this.store.markets().filter((market) => {
      if (criteria.activeOnly && !market.isActive) {
        return false;
      }
      if (criteria.type !== 'ALL' && market.type !== (criteria.type as AssetType)) {
        return false;
      }
      if (query.length > 0) {
        const haystack = `${market.symbol} ${market.name}`.toUpperCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  });

  readonly lastUpdateLabel = computed<string | null>(() => {
    const last = this.store.lastUpdate();
    if (!last) {
      return null;
    }
    const stamp = new Date(last.timestamp);
    if (Number.isNaN(stamp.getTime())) {
      return null;
    }
    return stamp.toLocaleTimeString();
  });

  ngOnInit(): void {
    void this.store.refresh();
  }

  refresh(): void {
    void this.store.refresh();
  }

  onCriteria(criteria: IMarketSearchCriteria): void {
    this._criteria.set(criteria);
  }
}
