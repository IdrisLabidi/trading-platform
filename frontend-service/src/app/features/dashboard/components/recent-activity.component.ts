import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { DashboardStore } from '../stores';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';

/**
 * Recent activity widget. Lists the latest trades executed by the
 * user. Each row shows the side (BUY/SELL), the symbol, the
 * quantity and the execution price.
 *
 * The widget is a placeholder: it does not paginate, it does not
 * deep-link to the trade history, and it does not surface the order
 * id. All those concerns are intentionally left for the trade
 * history feature.
 */
@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [DatePipe, TranslatePipe, NumberFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col rounded-lg border border-(--app-border) bg-(--app-bg-elevated) shadow-sm"
    >
      <header
        class="flex items-center justify-between border-b border-(--app-border) px-4 py-3"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-history text-sm text-(--app-fg-muted)" aria-hidden="true"></i>
          <h2 class="text-sm font-semibold">
            {{ 'dashboard.activity.title' | translate }}
          </h2>
        </div>
        <span class="text-xs text-(--app-fg-muted)">
          {{ 'dashboard.common.placeholder' | translate }}
        </span>
      </header>

      <div class="flex-1 overflow-auto">
        @if (trades().length === 0) {
          <div
            class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-clock text-2xl" aria-hidden="true"></i>
            <p>{{ 'dashboard.activity.empty' | translate }}</p>
          </div>
        } @else {
          <ul class="divide-y divide-[var(--app-border)]">
            @for (trade of trades(); track trade.id) {
              <li
                class="flex items-center justify-between gap-2 px-4 py-2 text-sm"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
                    [class.bg-[var(--app-success)]]="trade.side === 'BUY'"
                    [class.bg-[var(--app-danger)]]="trade.side === 'SELL'"
                    [class.text-white]="true"
                  >
                    {{ trade.side }}
                  </span>
                  <span class="font-medium">{{ trade.symbol }}</span>
                </div>
                <div class="flex flex-col items-end text-xs">
                  <span class="tabular-nums">
                    {{ trade.quantity | appNumber }}
                    &#64; {{ trade.price | appNumber }}
                  </span>
                  <span class="text-[var(--app-fg-muted)]">
                    {{ trade.executedAt | date: 'short' }}
                  </span>
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
export class RecentActivityComponent {
  private readonly store = inject(DashboardStore);
  readonly trades = computed(() => this.store.recentTrades());
}
