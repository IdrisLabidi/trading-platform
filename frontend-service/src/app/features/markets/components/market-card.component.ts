import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-market-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class MarketCardComponent {}
