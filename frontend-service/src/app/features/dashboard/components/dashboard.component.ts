import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { DashboardToolbarComponent } from './dashboard-toolbar.component';
import { DashboardSummaryCardsComponent } from './dashboard-summary-cards.component';
import { PortfolioSummaryComponent } from './portfolio-summary.component';
import { MarketOverviewComponent } from './market-overview.component';
import { WatchlistSummaryComponent } from './watchlist-summary.component';
import { RecentActivityComponent } from './recent-activity.component';
import { DashboardStore } from '../stores/dashboard.store';

/**
 * Dashboard page. Pure layout component: it composes the toolbar
 * and the four widgets and triggers the initial data load.
 *
 * The component does not own any state of its own. All data flow
 * goes through the `DashboardStore` signal store. A future revision
 * will add range selectors and timeframe switching without
 * touching this file.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardToolbarComponent,
    DashboardSummaryCardsComponent,
    PortfolioSummaryComponent,
    MarketOverviewComponent,
    WatchlistSummaryComponent,
    RecentActivityComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col">
      <app-dashboard-toolbar />

      <div class="flex-1 overflow-auto p-4 sm:p-6">
        <div class="flex flex-col gap-6">
          <app-dashboard-summary-cards />

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div class="lg:col-span-2">
              <app-portfolio-summary class="block h-[28rem]" />
            </div>
            <div>
              <app-market-overview class="block h-[28rem]" />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <app-watchlist-summary class="block h-[24rem]" />
            <app-recent-activity class="block h-[24rem]" />
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(DashboardStore);

  ngOnInit(): void {
    void this.store.refresh();
  }
}
