import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-portfolio-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class PortfolioOverviewComponent {}
