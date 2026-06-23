import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-market-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class MarketOverviewComponent {}
