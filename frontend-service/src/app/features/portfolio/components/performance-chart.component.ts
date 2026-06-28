import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';
import type { IPosition } from '../models/portfolio.model';

interface IPerformanceBar {
  readonly symbol: string;
  readonly value: number;
  readonly percent: number;
  readonly color: string;
}

/**
 * Lightweight horizontal bar chart rendered with plain HTML to avoid
 * pulling a chart library. Each bar represents the contribution of a
 * single position to the total P&L. Pure presentational component.
 */
@Component({
  selector: 'app-performance-chart',
  standalone: true,
  imports: [TranslatePipe, CurrencyFormatPipe, PercentFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
    >
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-bar text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <h2 class="text-sm font-semibold">
            {{ 'portfolio.performance.title' | translate }}
          </h2>
        </div>
        <span
          class="text-sm font-semibold tabular-nums"
          [class.text-[var(--app-success)]]="totalPnL >= 0"
          [class.text-[var(--app-danger)]]="totalPnL < 0"
        >
          {{ totalPnL | appCurrency }}
        </span>
      </header>

      @if (bars().length === 0) {
        <div
          class="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
        >
          <i class="pi pi-chart-line text-2xl" aria-hidden="true"></i>
          <p>{{ 'portfolio.performance.empty' | translate }}</p>
        </div>
      } @else {
        <ul class="flex flex-1 flex-col gap-2 overflow-auto">
          @for (bar of bars(); track bar.symbol) {
            <li class="flex flex-col gap-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium">{{ bar.symbol }}</span>
                <span class="tabular-nums">{{ bar.percent | appPercent }}</span>
              </div>
              <div class="relative h-3 overflow-hidden rounded-md bg-[var(--app-bg-overlay)]">
                <div
                  class="absolute inset-y-0 start-0 transition-all"
                  [class]="bar.color"
                  [style.width.%]="bar.value"
                ></div>
              </div>
            </li>
          }
        </ul>
      }
    </article>
  `
})
export class PerformanceChartComponent {
  private readonly _positions = signal<readonly IPosition[]>([]);
  private readonly _totalPnL = signal<number>(0);

  @Input({ required: true })
  set positions(value: readonly IPosition[]) {
    this._positions.set(value ?? []);
  }

  @Input()
  set totalPnL(value: number) {
    this._totalPnL.set(value ?? 0);
  }
  get totalPnL(): number {
    return this._totalPnL();
  }

  readonly bars = computed<readonly IPerformanceBar[]>(() => {
    const positions = this._positions();
    if (positions.length === 0) {
      return [];
    }
    const maxAbs = Math.max(
      1,
      ...positions.map((position) => Math.abs(this.pnl(position)))
    );
    return positions
      .map((position) => {
        const value = this.pnl(position);
        const width = (Math.abs(value) / maxAbs) * 100;
        const totalAbs = positions.reduce(
          (sum, entry) => sum + Math.abs(this.pnl(entry)),
          0
        );
        const percent = totalAbs === 0 ? 0 : value / totalAbs;
        return {
          symbol: position.symbol,
          value: width,
          percent,
          color: value >= 0 ? 'bg-[var(--app-success)]' : 'bg-[var(--app-danger)]'
        } satisfies IPerformanceBar;
      })
      .sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent));
  });

  private pnl(position: IPosition): number {
    return (position.currentPrice - position.averagePrice) * position.quantity;
  }
}
