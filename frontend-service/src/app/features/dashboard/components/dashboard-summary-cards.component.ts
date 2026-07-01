import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { DashboardStore } from '../stores/dashboard.store';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';

/**
 * Top row of summary cards. Renders three metric placeholders driven
 * by the dashboard store:
 *  - Portfolio value
 *  - Day change (absolute + percent)
 *  - Watchlist / open orders counts
 *
 * The component is purely presentational: it observes the store
 * signals and emits no events. Future actions (e.g. "navigate to
 * portfolio") can be added by wrapping the cards in `<a routerLink>`
 * without touching the data layer.
 */
@Component({
  selector: 'app-dashboard-summary-cards',
  standalone: true,
  imports: [DatePipe, TranslatePipe, CurrencyFormatPipe, NumberFormatPipe, PercentFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="dashboard.summary.label"
    >
      <article
        class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
      >
        <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
          <span>{{ 'dashboard.summary.portfolio' | translate }}</span>
          <i class="pi pi-wallet text-sm" aria-hidden="true"></i>
        </header>
        <strong class="text-2xl font-semibold text-[var(--app-fg)]">
          {{ portfolioValue() | appCurrency }}
        </strong>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ 'dashboard.summary.asOf' | translate }} {{ asOf() | date: 'short' }}
        </span>
      </article>

      <article
        class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
      >
        <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
          <span>{{ 'dashboard.summary.dayChange' | translate }}</span>
          <i
            class="pi text-sm"
            [class.pi-arrow-up]="dayChange() >= 0"
            [class.pi-arrow-down]="dayChange() < 0"
            [class.text-[var(--app-success)]]="dayChange() >= 0"
            [class.text-[var(--app-danger)]]="dayChange() < 0"
            aria-hidden="true"
          ></i>
        </header>
        <strong
          class="text-2xl font-semibold"
          [class.text-[var(--app-success)]]="dayChange() >= 0"
          [class.text-[var(--app-danger)]]="dayChange() < 0"
        >
          {{ dayChange() | appCurrency }}
        </strong>
        <span
          class="text-xs"
          [class.text-[var(--app-success)]]="dayChangePercent() >= 0"
          [class.text-[var(--app-danger)]]="dayChangePercent() < 0"
        >
          {{ dayChangePercent() | appPercent }}
        </span>
      </article>

      <article
        class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
      >
        <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
          <span>{{ 'dashboard.summary.openOrders' | translate }}</span>
          <i class="pi pi-shopping-cart text-sm" aria-hidden="true"></i>
        </header>
        <strong class="text-2xl font-semibold text-[var(--app-fg)]">
          {{ openOrders() | appNumber:undefined:0 }}
        </strong>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ 'dashboard.summary.tradesToday' | translate }}: {{ tradesToday() | appNumber:undefined:0 }}
        </span>
      </article>

      <article
        class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
      >
        <header class="flex items-center justify-between text-xs text-[var(--app-fg-muted)]">
          <span>{{ 'dashboard.summary.watchlist' | translate }}</span>
          <i class="pi pi-eye text-sm" aria-hidden="true"></i>
        </header>
        <strong class="text-2xl font-semibold text-[var(--app-fg)]">
          {{ watchlistCount() | appNumber:undefined:0 }}
        </strong>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ 'dashboard.summary.assets' | translate }}
        </span>
      </article>
    </section>
  `
})
export class DashboardSummaryCardsComponent {
  private readonly store = inject(DashboardStore);

  readonly portfolioValue = computed<number>(() => this.store.summary()?.portfolioValue ?? 0);
  readonly dayChange = computed<number>(() => this.store.summary()?.dayChange ?? 0);
  readonly dayChangePercent = computed<number>(() => this.store.summary()?.dayChangePercent ?? 0);
  readonly openOrders = computed<number>(() => this.store.summary()?.openOrdersCount ?? 0);
  readonly tradesToday = computed<number>(() => this.store.summary()?.tradesToday ?? 0);
  readonly watchlistCount = computed<number>(() => this.store.summary()?.watchlistCount ?? 0);
  readonly asOf = computed<string>(() => this.store.summary()?.asOf ?? '');
}
