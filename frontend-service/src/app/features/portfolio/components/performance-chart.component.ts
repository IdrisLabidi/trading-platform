import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class PerformanceChartComponent {}
