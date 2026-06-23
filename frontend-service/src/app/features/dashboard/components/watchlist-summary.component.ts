import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { DashboardStore } from '../stores/dashboard.store';

/**
 * Watchlist summary widget. Renders the top items collected by the
 * dashboard store (up to 8 entries) together with the number of
 * watchlists followed by the user.
 *
 * The widget is a placeholder. It deliberately does not subscribe to
 * the realtime price stream so the layout can be exercised in
 * isolation. A future revision will route the click handler to
 * `/markets/:symbol` and surface the latest price in the trailing
 * column.
 */
@Component({
  selector: 'app-watchlist-summary',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
    >
      <header
        class="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-eye text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <h2 class="text-sm font-semibold">
            {{ 'dashboard.watchlist.title' | translate }}
          </h2>
        </div>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ watchlistCount() }}
          {{ 'dashboard.watchlist.count' | translate }}
        </span>
      </header>

      <div class="flex-1 overflow-auto">
        @if (topItems().length === 0) {
          <div
            class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-bookmark text-2xl" aria-hidden="true"></i>
            <p>{{ 'dashboard.watchlist.empty' | translate }}</p>
          </div>
        } @else {
          <ul class="divide-y divide-[var(--app-border)]">
            @for (item of topItems(); track item.symbol) {
              <li class="flex items-center justify-between px-4 py-2 text-sm">
                <div class="flex flex-col">
                  <span class="font-medium">{{ item.symbol }}</span>
                  <span class="text-xs text-[var(--app-fg-muted)]">
                    {{ item.addedAt | date: 'shortDate' }}
                  </span>
                </div>
                @if (item.targetPrice !== undefined) {
                  <span class="text-xs text-[var(--app-fg-muted)]">
                    {{ 'dashboard.watchlist.target' | translate }}
                    {{ item.targetPrice }}
                  </span>
                }
              </li>
            }
          </ul>
        }
      </div>
    </article>
  `
})
export class WatchlistSummaryComponent {
  private readonly store = inject(DashboardStore);
  readonly topItems = computed(() => this.store.watchlist().topItems);
  readonly watchlistCount = computed<number>(
    () => this.store.watchlist().watchlists.length
  );
}
