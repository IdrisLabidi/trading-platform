import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export interface IChartSeries {
  readonly name: string;
  readonly data: readonly number[];
}

@Component({
  selector: 'app-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class ChartComponent {
  @Input() type: 'line' | 'bar' | 'candlestick' = 'line';
  @Input() series: readonly IChartSeries[] = [];
}
