import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { DashboardStore } from '../stores/dashboard.store';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';

/**
 * Market overview widget. Renders a static list of market indices
 * sourced from the dashboard store. Each row exposes the symbol,
 * last value and absolute / percent variation since the previous
 * session close.
 *
 * The widget is a placeholder: no chart, no sparkline, no realtime
 * streaming. The markup is laid out so a future revision can drop a
 * `<p-chart>` element in the `body` slot without touching the
 * surrounding card chrome.
 */
@Component({
  selector: 'app-market-overview',
  standalone: true,
  imports: [TranslatePipe, NumberFormatPipe, PercentFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
    >
      <header
        class="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-globe text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <h2 class="text-sm font-semibold">
            {{ 'dashboard.market.title' | translate }}
          </h2>
        </div>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ 'dashboard.common.placeholder' | translate }}
        </span>
      </header>

      <div class="flex-1 overflow-auto p-4">
        @if (indices().length === 0) {
          <div
            class="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-chart-bar text-2xl" aria-hidden="true"></i>
            <p>{{ 'dashboard.market.empty' | translate }}</p>
          </div>
        } @else {
          <ul class="flex flex-col gap-3">
            @for (index of indices(); track index.symbol) {
              <li
                class="flex items-center justify-between gap-2 rounded-md border border-[var(--app-border)] px-3 py-2"
              >
                <div class="flex flex-col">
                  <span class="text-sm font-semibold">{{ index.symbol }}</span>
                  <span class="text-xs text-[var(--app-fg-muted)]">{{ index.name }}</span>
                </div>
                <div class="text-end">
                  <div class="text-sm font-semibold tabular-nums">
                    {{ index.value | appNumber }}
                  </div>
                  <div
                    class="text-xs tabular-nums"
                    [class.text-[var(--app-success)]]="index.changePercent >= 0"
                    [class.text-[var(--app-danger)]]="index.changePercent < 0"
                  >
                    {{ index.change | appNumber }}
                    ({{ index.changePercent | appPercent }})
                  </div>
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <footer
        class="flex items-center justify-between border-t border-[var(--app-border)] px-4 py-2 text-xs text-[var(--app-fg-muted)]"
      >
        <span>{{ 'dashboard.common.widgetPlaceholder' | translate }}</span>
      </footer>
    </article>
  `
})
export class MarketOverviewComponent {
  private readonly store = inject(DashboardStore);
  readonly indices = computed(() => this.store.marketIndices());
}
