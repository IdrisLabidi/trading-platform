import {ChangeDetectionStrategy, Component, OnInit, computed, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {RouterLink} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {ProgressSpinnerModule} from 'primeng/progressspinner';

import {PortfolioStore} from '../stores/portfolio.store';
import {CurrencyFormatPipe} from '../../../shared/pipes/currency-format.pipe';
import {PercentFormatPipe} from '../../../shared/pipes/percent-format.pipe';
import {AssetListComponent} from './asset-list.component';
import {PerformanceChartComponent} from './performance-chart.component';
import type {IBalance} from '../models/portfolio.model';

/**
 * Portfolio overview page. Combines the cash balance, the position
 * list and a computed P&L so the trader can see the whole account
 * at a glance. Pulls data from the realtime store, hydrated by
 * `PortfolioStore.refresh()` on init.
 */
@Component({
  selector: 'app-portfolio-overview',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    CurrencyFormatPipe,
    PercentFormatPipe,
    AssetListComponent,
    PerformanceChartComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-wallet text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'portfolio.overview.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'portfolio.overview.subtitle' | translate }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          @if (lastLoadedAt(); as stamp) {
            <p-tag [value]="(stamp | date: 'short') ?? ''" severity="info" [rounded]="true"></p-tag>
          }
          <p-button
            size="small"
            severity="secondary"
            [outlined]="true"
            [loading]="store.loading()"
            (onClick)="refresh()"
          >
            <i class="pi pi-refresh" pButtonIcon></i>
            <span pButtonLabel>{{ 'portfolio.overview.refresh' | translate }}</span>
          </p-button>
          <p-button
            size="small"
            [routerLink]="['/orders', 'open']"
          >
            <span pButtonLabel>{{ 'portfolio.overview.openOrders' | translate }}</span>
          </p-button>
        </div>
      </header>

      @if (store.loading() && positions().length === 0 && !hasBalance()) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
        >
          <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
          <span>{{ 'portfolio.overview.loading' | translate }}</span>
        </div>
      } @else if (store.error() && positions().length === 0) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-danger)]"
          role="alert"
        >
          <i class="pi pi-exclamation-triangle text-2xl" aria-hidden="true"></i>
          <p>{{ store.error() }}</p>
        </div>
      } @else {
        <section class="grid grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          <article
            class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
          >
            <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
              <span>{{ 'portfolio.overview.totalValue' | translate }}</span>
              <i class="pi pi-chart-line text-sm" aria-hidden="true"></i>
            </header>
            <strong class="text-2xl font-semibold tabular-nums">
              {{ totalValue() | appCurrency }}
            </strong>
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'portfolio.overview.positions' | translate }}: {{ positions().length }}
            </span>
          </article>

          <article
            class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
          >
            <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
              <span>{{ 'portfolio.overview.totalCost' | translate }}</span>
              <i class="pi pi-shopping-bag text-sm" aria-hidden="true"></i>
            </header>
            <strong class="text-2xl font-semibold tabular-nums">
              {{ totalCost() | appCurrency }}
            </strong>
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'portfolio.overview.cost' | translate }}
            </span>
          </article>

          <article
            class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
          >
            <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
              <span>{{ 'portfolio.overview.pnl' | translate }}</span>
              <i
                class="pi text-sm"
                [class.pi-arrow-up]="totalPnL() >= 0"
                [class.pi-arrow-down]="totalPnL() < 0"
                [class.text-[var(--app-success)]]="totalPnL() >= 0"
                [class.text-[var(--app-danger)]]="totalPnL() < 0"
                aria-hidden="true"
              ></i>
            </header>
            <strong
              class="text-2xl font-semibold tabular-nums"
              [class.text-[var(--app-success)]]="totalPnL() >= 0"
              [class.text-[var(--app-danger)]]="totalPnL() < 0"
            >
              {{ totalPnL() | appCurrency }}
            </strong>
            <span
              class="text-xs"
              [class.text-[var(--app-success)]]="totalPnLPercent() >= 0"
              [class.text-[var(--app-danger)]]="totalPnLPercent() < 0"
            >
              {{ totalPnLPercent() | appPercent }}
            </span>
          </article>

          <article
            class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
          >
            <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
              <span>{{ 'portfolio.overview.cash' | translate }}</span>
              <i class="pi pi-money-bill text-sm" aria-hidden="true"></i>
            </header>
            <strong class="text-2xl font-semibold tabular-nums">
              {{ balance().cashBalance | appCurrency }}
            </strong>
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'portfolio.overview.frozen' | translate }}: {{ balance().frozenBalance | appCurrency }}
            </span>
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'portfolio.overview.available' | translate }}: {{ balance().availableBalance | appCurrency }}
            </span>
          </article>
        </section>

        <section class="grid grid-cols-1 gap-4 px-4 pb-6 sm:px-6 xl:grid-cols-3">
          <div class="xl:col-span-2">
            <app-asset-list [positions]="positions()"/>
          </div>
          <div>
            <app-performance-chart
              class="block h-80"
              [positions]="positions()"
              [totalPnL]="totalPnL()"
            />
          </div>
        </section>
      }
    </div>
  `
})
export class PortfolioOverviewComponent implements OnInit {
  readonly store = inject(PortfolioStore);

  readonly positions = this.store.positions;
  readonly balance = computed<IBalance>(() => this.store.balance());
  readonly totalValue = this.store.totalValue;
  readonly totalPnL = this.store.totalPnL;

  readonly totalCost = computed<number>(() => {
    return this.positions().reduce(
      (sum, position) => sum + position.averagePrice * position.quantity,
      0
    );
  });

  readonly totalPnLPercent = computed<number>(() => {
    const cost = this.totalCost();
    if (cost === 0) {
      return 0;
    }
    return this.totalPnL() / cost;
  });

  readonly hasBalance = computed<boolean>(() => {
    const balance = this.store.balance();
    return balance.cashBalance > 0 || balance.frozenBalance > 0;
  });

  readonly lastLoadedAt = computed<string | null>(() => this.store.lastLoadedAt());

  ngOnInit(): void {
    void this.store.refresh();
  }

  refresh(): void {
    void this.store.refresh();
  }
}
