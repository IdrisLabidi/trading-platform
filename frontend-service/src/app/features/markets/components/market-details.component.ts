import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-market-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class MarketDetailsComponent {}
