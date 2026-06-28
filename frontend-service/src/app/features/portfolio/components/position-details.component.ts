import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { PortfolioStore } from '../stores/portfolio.store';
import { MarketsStore } from '../../markets/stores/markets.store';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';
import type { IAsset } from '../../markets/models/market.model';
import type { IPosition } from '../models/portfolio.model';

/**
 * Position details page. Resolves the `:symbol` route parameter and
 * renders the matching position from the websocket store alongside
 * the asset metadata. Falls back to the REST endpoint when the
 * realtime store is empty.
 */
@Component({
  selector: 'app-position-details',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    ButtonModule,
    TagModule,
    CardModule,
    ProgressSpinnerModule,
    CurrencyFormatPipe,
    NumberFormatPipe,
    PercentFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:px-6"
      >
        <div class="flex items-center gap-3">
          <a
            routerLink="/portfolio"
            class="grid h-8 w-8 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
            [attr.aria-label]="'common.close' | translate"
          >
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
          </a>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'portfolio.details.title' | translate }} � {{ position()?.symbol ?? symbol() }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ asset()?.name ?? ('portfolio.details.assetFallback' | translate) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <p-button
            size="small"
            [routerLink]="['/orders', 'new']"
            [queryParams]="{ symbol: position()?.symbol ?? symbol() }"
          >
            <span pButtonLabel>{{ 'portfolio.details.trade' | translate }}</span>
          </p-button>
          <p-button
            size="small"
            severity="secondary"
            [outlined]="true"
            [routerLink]="['/markets', position()?.symbol ?? symbol()]"
          >
            <span pButtonLabel>{{ 'portfolio.details.openMarket' | translate }}</span>
          </p-button>
        </div>
      </header>

      @if (loading()) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
        >
          <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
          <span>{{ 'portfolio.details.loading' | translate }}</span>
        </div>
      } @else if (!position()) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
        >
          <i class="pi pi-question-circle text-2xl" aria-hidden="true"></i>
          <p>{{ 'portfolio.details.notFound' | translate }}</p>
        </div>
      } @else {
        <section class="grid grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'portfolio.details.quantity' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="px-4 pb-4 text-2xl font-semibold tabular-nums">
              {{ position()!.quantity | appNumber }}
            </div>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'portfolio.details.avgPrice' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="px-4 pb-4 text-2xl font-semibold tabular-nums">
              {{ position()!.averagePrice | appCurrency }}
            </div>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'portfolio.details.currentPrice' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="px-4 pb-4 text-2xl font-semibold tabular-nums">
              {{ position()!.currentPrice | appCurrency }}
            </div>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'portfolio.details.marketValue' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="px-4 pb-4 text-2xl font-semibold tabular-nums">
              {{ marketValue() | appCurrency }}
            </div>
          </p-card>
        </section>

        <section class="grid grid-cols-1 gap-4 px-4 pb-6 sm:px-6 md:grid-cols-2">
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-sm font-semibold">
                  {{ 'portfolio.details.pnl' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="flex flex-col gap-2 px-4 pb-4 text-sm">
              <div
                class="text-3xl font-semibold tabular-nums"
                [class.text-[var(--app-success)]]="pnl() >= 0"
                [class.text-[var(--app-danger)]]="pnl() < 0"
              >
                {{ pnl() | appCurrency }}
              </div>
              <span
                class="text-sm"
                [class.text-[var(--app-success)]]="pnlPercent() >= 0"
                [class.text-[var(--app-danger)]]="pnlPercent() < 0"
              >
                {{ pnlPercent() | appPercent }}
              </span>
            </div>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-sm font-semibold">
                  {{ 'portfolio.details.reservations' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="grid grid-cols-2 gap-2 px-4 pb-4 text-sm">
              <div class="flex flex-col gap-1">
                <span class="text-xs text-[var(--app-fg-muted)]">
                  {{ 'portfolio.details.frozen' | translate }}
                </span>
                <span class="text-base font-semibold tabular-nums">
                  {{ position()!.frozenQuantity ?? 0 | appNumber }}
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-xs text-[var(--app-fg-muted)]">
                  {{ 'portfolio.details.available' | translate }}
                </span>
                <span class="text-base font-semibold tabular-nums">
                  {{ position()!.availableQuantity ?? position()!.quantity | appNumber }}
                </span>
              </div>
            </div>
          </p-card>
        </section>

        @if (asset()?.description) {
          <section class="px-4 sm:px-6">
            <p class="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 text-sm text-[var(--app-fg-muted)]">
              {{ asset()!.description }}
            </p>
          </section>
        }
      }
    </div>
  `
})
export class PositionDetailsComponent implements OnInit {
  private readonly portfolioStore = inject(PortfolioStore);
  private readonly marketsStore = inject(MarketsStore);
  private readonly route = inject(ActivatedRoute);

  private readonly _symbol = signal<string>('');
  private readonly _loading = signal<boolean>(false);

  readonly symbol = this._symbol.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly position = computed<IPosition | null>(() => {
    const sym = this._symbol();
    if (!sym) {
      return null;
    }
    return this.portfolioStore.positions().find((p) => p.symbol === sym) ?? null;
  });

  readonly asset = computed<IAsset | null>(() => {
    const sym = this._symbol();
    if (!sym) {
      return null;
    }
    return this.marketsStore.assets().find((entry) => entry.symbol === sym) ?? null;
  });

  readonly marketValue = computed<number>(() => {
    const position = this.position();
    if (!position) {
      return 0;
    }
    return position.quantity * position.currentPrice;
  });

  readonly pnl = computed<number>(() => {
    const position = this.position();
    if (!position) {
      return 0;
    }
    return (position.currentPrice - position.averagePrice) * position.quantity;
  });

  readonly pnlPercent = computed<number>(() => {
    const position = this.position();
    if (!position) {
      return 0;
    }
    const cost = position.averagePrice * position.quantity;
    if (cost === 0) {
      return 0;
    }
    return this.pnl() / cost;
  });

  ngOnInit(): void {
    const symbol = (this.route.snapshot.paramMap.get('symbol') ?? '').toUpperCase();
    if (symbol) {
      this._symbol.set(symbol);
    }
    this._loading.set(true);
    void this.portfolioStore
      .refresh()
      .then(() => {
        void this.marketsStore.refresh();
      })
      .finally(() => this._loading.set(false));
  }
}
