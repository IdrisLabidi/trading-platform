import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { DashboardStore } from '../stores/dashboard.store';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';

/**
 * Portfolio summary placeholder. Lists the user's positions in a
 * compact PrimeNG-less table so the layout is exercised without
 * pulling the portfolio feature store. The widget is intentionally
 * read-only: a future revision will deep-link each row to
 * `/portfolio?symbol=...`.
 */
@Component({
  selector: 'app-portfolio-summary',
  standalone: true,
  imports: [DatePipe, TranslatePipe, CurrencyFormatPipe, NumberFormatPipe, PercentFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
    >
      <header
        class="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-wallet text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <h2 class="text-sm font-semibold">
            {{ 'dashboard.portfolio.title' | translate }}
          </h2>
        </div>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ 'dashboard.common.updated' | translate }} {{ lastLoadedAt() | date: 'short' }}
        </span>
      </header>

      <div class="grid grid-cols-2 gap-4 border-b border-[var(--app-border)] px-4 py-3 text-sm">
        <div>
          <div class="text-xs text-[var(--app-fg-muted)]">
            {{ 'dashboard.portfolio.totalValue' | translate }}
          </div>
          <div class="text-base font-semibold">{{ totalValue() | appCurrency }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--app-fg-muted)]">
            {{ 'dashboard.portfolio.totalCost' | translate }}
          </div>
          <div class="text-base font-semibold">{{ totalCost() | appCurrency }}</div>
        </div>
        <div>
          <div class="text-xs text-[var(--app-fg-muted)]">
            {{ 'dashboard.portfolio.totalPnL' | translate }}
          </div>
          <div
            class="text-base font-semibold"
            [class.text-[var(--app-success)]]="totalPnL() >= 0"
            [class.text-[var(--app-danger)]]="totalPnL() < 0"
          >
            {{ totalPnL() | appCurrency }}
          </div>
        </div>
        <div>
          <div class="text-xs text-[var(--app-fg-muted)]">
            {{ 'dashboard.portfolio.totalPnLPercent' | translate }}
          </div>
          <div
            class="text-base font-semibold"
            [class.text-[var(--app-success)]]="totalPnLPercent() >= 0"
            [class.text-[var(--app-danger)]]="totalPnLPercent() < 0"
          >
            {{ totalPnLPercent() | appPercent }}
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        @if (positions().length === 0) {
          <div
            class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-inbox text-2xl" aria-hidden="true"></i>
            <p>{{ 'dashboard.portfolio.empty' | translate }}</p>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead class="text-xs uppercase text-[var(--app-fg-muted)]">
              <tr class="border-b border-[var(--app-border)]">
                <th class="px-4 py-2 text-start font-medium">
                  {{ 'dashboard.portfolio.symbol' | translate }}
                </th>
                <th class="px-4 py-2 text-end font-medium">
                  {{ 'dashboard.portfolio.quantity' | translate }}
                </th>
                <th class="px-4 py-2 text-end font-medium">
                  {{ 'dashboard.portfolio.averagePrice' | translate }}
                </th>
                <th class="px-4 py-2 text-end font-medium">
                  {{ 'dashboard.portfolio.currentPrice' | translate }}
                </th>
                <th class="px-4 py-2 text-end font-medium">
                  {{ 'dashboard.portfolio.marketValue' | translate }}
                </th>
              </tr>
            </thead>
            <tbody>
              @for (position of positions(); track position.symbol) {
                <tr class="border-b border-[var(--app-border)] last:border-b-0">
                  <td class="px-4 py-2 font-medium">{{ position.symbol }}</td>
                  <td class="px-4 py-2 text-end tabular-nums">
                    {{ position.quantity | appNumber }}
                  </td>
                  <td class="px-4 py-2 text-end tabular-nums">
                    {{ position.averagePrice | appCurrency }}
                  </td>
                  <td class="px-4 py-2 text-end tabular-nums">
                    {{ position.currentPrice | appCurrency }}
                  </td>
                  <td class="px-4 py-2 text-end tabular-nums">
                    {{ position.quantity * position.currentPrice | appCurrency }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </article>
  `
})
export class PortfolioSummaryComponent {
  private readonly store = inject(DashboardStore);

  readonly positions = computed(() => this.store.portfolio()?.positions ?? []);
  readonly totalValue = computed<number>(() => this.store.portfolio()?.totalValue ?? 0);
  readonly totalCost = computed<number>(() => this.store.portfolio()?.totalCost ?? 0);
  readonly totalPnL = computed<number>(() => this.store.portfolio()?.totalPnL ?? 0);
  readonly totalPnLPercent = computed<number>(
    () => this.store.portfolio()?.totalPnLPercent ?? 0
  );
  readonly lastLoadedAt = computed<string>(() => this.store.lastLoadedAt() ?? '');
}
