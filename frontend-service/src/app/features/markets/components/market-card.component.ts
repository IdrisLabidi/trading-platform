import { ChangeDetectionStrategy, Component, Input, computed, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';
import { AuthService } from '../../../core/services/auth.service';
import type { IMarket } from '../models/market.model';

/**
 * Compact card representing a single tradable market. Renders the
 * last traded price, the change vs. the previous close, and links to
 * the detail page. The card surfaces a quick "Trade" action that
 * opens the order form on the details page when the user holds the
 * trader role.
 */
@Component({
  selector: 'app-market-card',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    TagModule,
    ButtonModule,
    CurrencyFormatPipe,
    NumberFormatPipe,
    PercentFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm transition-colors hover:border-[var(--app-accent)]"
      [attr.data-symbol]="market.symbol"
    >
      <header class="flex items-start justify-between gap-2">
        <div class="flex flex-col">
          <span class="text-base font-semibold">{{ market.symbol }}</span>
          <span class="text-xs text-[var(--app-fg-muted)]">{{ market.name }}</span>
        </div>
        <p-tag
          [value]="market.type"
          severity="secondary"
          [rounded]="true"
        ></p-tag>
      </header>

      <div class="flex items-end justify-between gap-2">
        <div>
          <div class="text-2xl font-semibold tabular-nums">
            {{ market.price | appCurrency: market.currency }}
          </div>
          <div
            class="text-xs tabular-nums"
            [class.text-[var(--app-success)]]="market.change >= 0"
            [class.text-[var(--app-danger)]]="market.change < 0"
          >
            {{ market.change | appNumber }}
            ({{ market.changePercent | appPercent }})
          </div>
        </div>
        @if (!market.isActive) {
          <span
            class="rounded-md border border-[var(--app-warning)] px-2 py-0.5 text-xs text-[var(--app-warning)]"
          >
            {{ 'markets.status.inactive' | translate }}
          </span>
        }
      </div>

      <footer class="mt-auto flex items-center justify-between gap-2">
        <a
          [routerLink]="['/markets', market.symbol]"
          class="text-xs font-medium text-[var(--app-accent)] hover:underline"
        >
          {{ 'markets.card.details' | translate }}
        </a>
        @if (canTrade()) {
          <p-button
            size="small"
            [outlined]="true"
            [routerLink]="['/orders', 'new']"
            [queryParams]="{ symbol: market.symbol }"
          >
            <span pButtonLabel>{{ 'markets.card.trade' | translate }}</span>
          </p-button>
        }
      </footer>
    </article>
  `
})
export class MarketCardComponent {
  private readonly auth = inject(AuthService);

  private readonly _market = signal<IMarket | null>(null);

  @Input({ required: true })
  set market(value: IMarket) {
    this._market.set(value);
  }
  get market(): IMarket {
    const value = this._market();
    if (!value) {
      throw new Error('MarketCardComponent: missing required `market` input');
    }
    return value;
  }

  readonly canTrade = computed<boolean>(() => {
    const user = this.auth.user();
    if (!user) {
      return false;
    }
    return user.roles.some((role) => role === 'trader' || role === 'admin');
  });
}
