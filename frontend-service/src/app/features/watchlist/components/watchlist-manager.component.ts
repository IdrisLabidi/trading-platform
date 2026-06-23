import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-watchlist-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class WatchlistManagerComponent {}
