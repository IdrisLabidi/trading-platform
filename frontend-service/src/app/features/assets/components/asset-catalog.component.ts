import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AssetsStore } from '../stores/assets.store';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { AssetSearchComponent } from './asset-search.component';
import type { AssetType, IAsset, IAssetCatalogCriteria } from '../models/asset.model';

/**
 * Asset catalog page. Loads every tradable symbol from the
 * `asset-service` backend, exposes a search/filter bar and renders
 * the result as a sortable card grid. Realtime price updates are
 * merged in through `AssetsStore.catalog()`.
 */
@Component({
  selector: 'app-asset-catalog',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    CurrencyFormatPipe,
    AssetSearchComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-box text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'assets.catalog.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'assets.catalog.subtitle' | translate }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <p-tag
            [value]="countLabel()"
            severity="info"
            [rounded]="true"
          ></p-tag>
          <p-tag
            [value]="activeLabel()"
            severity="success"
            [rounded]="true"
          ></p-tag>
          <p-button
            size="small"
            severity="secondary"
            [outlined]="true"
            [loading]="store.loading()"
            (onClick)="refresh()"
          >
            <i class="pi pi-refresh" pButtonIcon></i>
            <span pButtonLabel>{{ 'assets.catalog.refresh' | translate }}</span>
          </p-button>
        </div>
      </header>

      <div class="px-4 sm:px-6">
        <app-asset-search
          [markets]="store.markets()"
          (criteriaChange)="onCriteria($event)"
        />
      </div>

      <div class="flex-1 overflow-auto px-4 pb-6 sm:px-6">
        @if (store.loading() && filteredAssets().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
          >
            <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
            <span>{{ 'assets.catalog.loading' | translate }}</span>
          </div>
        } @else if (store.error() && filteredAssets().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-danger)]"
            role="alert"
          >
            <i class="pi pi-exclamation-triangle text-2xl" aria-hidden="true"></i>
            <p>{{ store.error() }}</p>
          </div>
        } @else if (filteredAssets().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-search text-2xl" aria-hidden="true"></i>
            <p>{{ 'assets.catalog.empty' | translate }}</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            @for (asset of filteredAssets(); track asset.symbol) {
              <article
                class="flex h-full flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm transition-colors hover:border-[var(--app-accent)]"
                [attr.data-symbol]="asset.symbol"
              >
                <header class="flex items-start justify-between gap-2">
                  <div class="flex flex-col">
                    <span class="text-base font-semibold">{{ asset.symbol }}</span>
                    <span class="text-xs text-[var(--app-fg-muted)]">{{ asset.name }}</span>
                  </div>
                  <p-tag
                    [value]="asset.type"
                    severity="secondary"
                    [rounded]="true"
                  ></p-tag>
                </header>

                @if (asset.description) {
                  <p class="text-xs text-[var(--app-fg-muted)] line-clamp-3">
                    {{ asset.description }}
                  </p>
                }

                <div class="flex items-end justify-between gap-2">
                  <div>
                    <div class="text-2xl font-semibold tabular-nums">
                      {{ asset.lastPrice | appCurrency: asset.currency }}
                    </div>
                    <div class="text-xs text-[var(--app-fg-muted)]">
                      {{ asset.currency }} - {{ asset.market || '-' }}
                    </div>
                  </div>
                  @if (!asset.isActive) {
                    <span
                      class="rounded-md border border-[var(--app-warning)] px-2 py-0.5 text-xs text-[var(--app-warning)]"
                    >
                      {{ 'assets.catalog.inactive' | translate }}
                    </span>
                  }
                </div>

                <div class="text-xs text-[var(--app-fg-muted)]">
                  {{ 'assets.catalog.listedAt' | translate }}:
                  {{ (asset.listedAt ?? '') | date: 'shortDate' }}
                </div>

                <footer class="mt-auto flex items-center justify-between gap-2">
                  <a
                    [routerLink]="['/assets', asset.symbol]"
                    class="text-xs font-medium text-[var(--app-accent)] hover:underline"
                  >
                    {{ 'assets.catalog.details' | translate }}
                  </a>
                  <p-button
                    size="small"
                    [outlined]="true"
                    [routerLink]="['/orders', 'new']"
                    [queryParams]="{ symbol: asset.symbol }"
                  >
                    <span pButtonLabel>{{ 'assets.catalog.trade' | translate }}</span>
                  </p-button>
                </footer>
              </article>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class AssetCatalogComponent implements OnInit {
  readonly store = inject(AssetsStore);

  private readonly _criteria = signal<IAssetCatalogCriteria>({
    query: '',
    type: 'ALL',
    market: 'ALL',
    activeOnly: true
  });

  readonly filteredAssets = computed<readonly IAsset[]>(() => {
    const criteria = this._criteria();
    const query = criteria.query.toUpperCase();
    return this.store.catalog().filter((asset) => {
      if (criteria.activeOnly && !asset.isActive) {
        return false;
      }
      if (criteria.type !== 'ALL' && asset.type !== (criteria.type as AssetType)) {
        return false;
      }
      if (criteria.market !== 'ALL' && asset.market !== criteria.market) {
        return false;
      }
      if (query.length > 0) {
        const haystack = `${asset.symbol} ${asset.name} ${asset.description ?? ''}`.toUpperCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
      return true;
    });
  });

  readonly countLabel = computed<string>(() => {
    const total = this.store.assets().length;
    return `${this.filteredAssets().length} / ${total}`;
  });

  readonly activeLabel = computed<string>(() => {
    const summary = this.store.summary();
    return `${summary.active} - ${summary.total}`;
  });

  ngOnInit(): void {
    void this.store.refresh();
  }

  refresh(): void {
    void this.store.refresh();
  }

  onCriteria(criteria: IAssetCatalogCriteria): void {
    this._criteria.set(criteria);
  }
}
