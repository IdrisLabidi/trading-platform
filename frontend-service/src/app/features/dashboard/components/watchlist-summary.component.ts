import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-watchlist-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class WatchlistSummaryComponent {}
