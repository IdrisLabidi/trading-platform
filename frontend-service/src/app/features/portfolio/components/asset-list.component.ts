import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';
import type { IPosition } from '../models/portfolio.model';

/**
 * List of the user''s positions rendered as a sortable table. The
 * table is presentational: positions arrive via the `[positions]`
 * input (typically wired to `PortfolioStore.positions()`).
 */
@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    TagModule,
    CurrencyFormatPipe,
    NumberFormatPipe,
    PercentFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
    >
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-list text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <h2 class="text-sm font-semibold">
            {{ 'portfolio.positions.title' | translate }}
          </h2>
        </div>
        <p-tag
          [value]="countLabel()"
          severity="info"
          [rounded]="true"
        ></p-tag>
      </header>

      <div class="flex-1 overflow-auto">
        @if (filteredPositions().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-inbox text-2xl" aria-hidden="true"></i>
            <p>{{ 'portfolio.positions.empty' | translate }}</p>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-[var(--app-bg-overlay)] text-xs uppercase text-[var(--app-fg-muted)]">
              <tr>
                <th class="px-3 py-2 text-start font-medium">
                  {{ 'portfolio.positions.col.symbol' | translate }}
                </th>
                <th class="px-3 py-2 text-end font-medium">
                  {{ 'portfolio.positions.col.quantity' | translate }}
                </th>
                <th class="px-3 py-2 text-end font-medium">
                  {{ 'portfolio.positions.col.avgPrice' | translate }}
                </th>
                <th class="px-3 py-2 text-end font-medium">
                  {{ 'portfolio.positions.col.currentPrice' | translate }}
                </th>
                <th class="px-3 py-2 text-end font-medium">
                  {{ 'portfolio.positions.col.marketValue' | translate }}
                </th>
                <th class="px-3 py-2 text-end font-medium">
                  {{ 'portfolio.positions.col.pnl' | translate }}
                </th>
                <th class="px-3 py-2 text-end font-medium">
                  {{ 'portfolio.positions.col.weight' | translate }}
                </th>
              </tr>
            </thead>
            <tbody>
              @for (position of filteredPositions(); track position.symbol) {
                <tr
                  class="border-t border-[var(--app-border)] transition-colors hover:bg-[var(--app-bg-overlay)]"
                >
                  <td class="px-3 py-2 font-medium">
                    <a
                      [routerLink]="['/portfolio', 'positions', position.symbol]"
                      class="text-[var(--app-fg)] hover:text-[var(--app-accent)] hover:underline"
                    >
                      {{ position.symbol }}
                    </a>
                  </td>
                  <td class="px-3 py-2 text-end tabular-nums">{{ position.quantity | appNumber }}</td>
                  <td class="px-3 py-2 text-end tabular-nums">
                    {{ position.averagePrice | appCurrency }}
                  </td>
                  <td class="px-3 py-2 text-end tabular-nums">
                    {{ position.currentPrice | appCurrency }}
                  </td>
                  <td class="px-3 py-2 text-end tabular-nums">
                    {{ marketValue(position) | appCurrency }}
                  </td>
                  <td
                    class="px-3 py-2 text-end tabular-nums"
                    [class.text-[var(--app-success)]]="pnl(position) >= 0"
                    [class.text-[var(--app-danger)]]="pnl(position) < 0"
                  >
                    {{ pnl(position) | appCurrency }}
                    <span class="block text-xs">
                      {{ pnlPercent(position) | appPercent }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-end tabular-nums">
                    {{ weight(position) | appPercent }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="border-t border-[var(--app-border)] bg-[var(--app-bg-overlay)] text-sm">
              <tr>
                <td class="px-3 py-2 font-semibold">
                  {{ 'portfolio.positions.total' | translate }}
                </td>
                <td class="px-3 py-2 text-end tabular-nums">{{ totalQuantity() | appNumber }}</td>
                <td class="px-3 py-2"></td>
                <td class="px-3 py-2"></td>
                <td class="px-3 py-2 text-end tabular-nums">{{ totalMarketValue() | appCurrency }}</td>
                <td
                  class="px-3 py-2 text-end tabular-nums"
                  [class.text-[var(--app-success)]]="totalPnL() >= 0"
                  [class.text-[var(--app-danger)]]="totalPnL() < 0"
                >
                  {{ totalPnL() | appCurrency }}
                </td>
                <td class="px-3 py-2 text-end tabular-nums">
                  {{ 'portfolio.positions.hundredPercent' | translate }}
                </td>
              </tr>
            </tfoot>
          </table>
        }
      </div>
    </article>
  `
})
export class AssetListComponent {
  private readonly _positions = signal<readonly IPosition[]>([]);

  @Input({ required: true })
  set positions(value: readonly IPosition[]) {
    this._positions.set(value ?? []);
  }

  readonly filteredPositions = computed<readonly IPosition[]>(() => this._positions());

  readonly countLabel = computed<string>(() => `${this._positions().length}`);

  readonly totalQuantity = computed<number>(() =>
    this._positions().reduce((sum, position) => sum + position.quantity, 0)
  );

  readonly totalMarketValue = computed<number>(() =>
    this._positions().reduce((sum, position) => sum + this.marketValue(position), 0)
  );

  readonly totalPnL = computed<number>(() =>
    this._positions().reduce((sum, position) => sum + this.pnl(position), 0)
  );

  marketValue(position: IPosition): number {
    return position.quantity * position.currentPrice;
  }

  pnl(position: IPosition): number {
    return (position.currentPrice - position.averagePrice) * position.quantity;
  }

  pnlPercent(position: IPosition): number {
    const cost = position.averagePrice * position.quantity;
    if (cost === 0) {
      return 0;
    }
    return this.pnl(position) / cost;
  }

  weight(position: IPosition): number {
    const total = this.totalMarketValue();
    if (total === 0) {
      return 0;
    }
    return this.marketValue(position) / total;
  }
}
