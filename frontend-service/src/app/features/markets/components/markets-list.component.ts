import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';

import { MarketsStore } from '../stores/markets.store';
import type { IMarket } from '../models/market.model';
import type { AssetType } from '../models/market.model';
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
    TranslatePipe,
    RouterLink,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    CurrencyFormatPipe,
    NumberFormatPipe,
    PercentFormatPipe,
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
          <div class="overflow-auto rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)]">
            <table class="min-w-[1200px] w-full text-sm">
              <thead class="bg-[var(--app-bg-overlay)] text-xs uppercase text-[var(--app-fg-muted)]">
                <tr>
                  <th class="px-3 py-2 text-start font-medium">{{ 'markets.list.columns.symbol' | translate }}</th>
                  <th class="px-3 py-2 text-start font-medium">{{ 'markets.list.columns.name' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.veille' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.cours' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.varPercent' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.quantity' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.volume' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.buyQuantity' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.buyPrice' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.sellPrice' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.sellQuantity' | translate }}</th>
                  <th class="px-3 py-2 text-center font-medium">{{ 'markets.list.columns.status' | translate }}</th>
                  <th class="px-3 py-2 text-end font-medium">{{ 'markets.list.columns.actions' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (market of filteredMarkets(); track market.symbol) {
                  <tr class="border-t border-[var(--app-border)] hover:bg-[var(--app-bg-overlay)]">
                    <td class="px-3 py-2 font-semibold">{{ market.symbol }}</td>
                    <td class="px-3 py-2">
                      <div class="flex flex-col">
                        <span class="font-medium">{{ market.name }}</span>
                        <span class="text-xs text-[var(--app-fg-muted)]">{{ market.type }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.previousPrice | appCurrency: market.currency }}</td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.price | appCurrency: market.currency }}</td>
                    <td
                      class="px-3 py-2 text-end tabular-nums"
                      [class.text-[var(--app-success)]]="market.changePercent >= 0"
                      [class.text-[var(--app-danger)]]="market.changePercent < 0"
                    >
                      {{ market.changePercent | appPercent }}
                    </td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.quantity | appNumber }}</td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.volume | appCurrency: market.currency }}</td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.buyQuantity | appNumber }}</td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.buyPrice | appCurrency: market.currency }}</td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.sellPrice | appCurrency: market.currency }}</td>
                    <td class="px-3 py-2 text-end tabular-nums">{{ market.sellQuantity | appNumber }}</td>
                    <td class="px-3 py-2 text-center">
                      @if (market.isActive) {
                        <p-tag value="Active" severity="success" [rounded]="true"></p-tag>
                      } @else {
                        <p-tag [value]="'markets.status.inactive' | translate" severity="warn" [rounded]="true"></p-tag>
                      }
                    </td>
                    <td class="px-3 py-2 text-end">
                      <div class="flex items-center justify-end gap-2">
                        <a
                          [routerLink]="['/markets', market.symbol]"
                          class="text-xs font-medium text-[var(--app-accent)] hover:underline"
                        >
                          {{ 'markets.card.details' | translate }}
                        </a>
                        <a
                          [routerLink]="['/orders', 'new']"
                          [queryParams]="{ symbol: market.symbol }"
                          class="text-xs font-medium text-[var(--app-accent)] hover:underline"
                        >
                          {{ 'markets.card.trade' | translate }}
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
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
