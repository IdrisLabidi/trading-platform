import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';
import { WatchlistStore } from '../stores/watchlist.store';
import type { IWatchlist, IWatchlistItem } from '../models/watchlist.model';

/**
 * Single watchlist row. Renders the symbol, current price (sourced
 * from the in-memory asset snapshot), target price and the distance
 * to target. Emits `remove` / `targetPriceChange` so the parent
 * component can dispatch the corresponding REST call.
 */
@Component({
  selector: 'app-watchlist-item',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    InputNumberModule,
    TagModule,
    CurrencyFormatPipe,
    PercentFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      [attr.data-symbol]="item.symbol"
    >
      <div class="flex flex-col">
        <a
          [routerLink]="['/markets', item.symbol]"
          class="text-sm font-semibold hover:text-[var(--app-accent)] hover:underline"
        >
          {{ item.symbol }}
        </a>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ assetName() }}
        </span>
        <span class="text-xs text-[var(--app-fg-muted)]">
          {{ 'watchlist.item.addedAt' | translate }}: {{ item.addedAt | date: 'short' }}
        </span>
      </div>

      <div class="flex flex-col items-start gap-1 text-sm sm:items-end">
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--app-fg-muted)]">
            {{ 'watchlist.item.price' | translate }}
          </span>
          <span class="font-semibold tabular-nums">
            {{ currentPrice() | appCurrency: currency() }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--app-fg-muted)]">
            {{ 'watchlist.item.target' | translate }}
          </span>
          <p-inputNumber
            class="w-32"
            [ngModel]="targetDraft()"
            (ngModelChange)="onTargetDraftChange($event)"
            [min]="0"
            [minFractionDigits]="2"
            [maxFractionDigits]="6"
            inputStyleClass="text-end"
          ></p-inputNumber>
          <p-button
            size="small"
            [text]="true"
            [disabled]="!canCommit()"
            (onClick)="commit()"
          >
            <span pButtonLabel>{{ 'watchlist.item.save' | translate }}</span>
          </p-button>
        </div>
        @if (targetPrice() !== undefined) {
          <span
            class="text-xs tabular-nums"
            [class.text-[var(--app-success)]]="distancePercent() >= 0"
            [class.text-[var(--app-danger)]]="distancePercent() < 0"
          >
            {{ 'watchlist.item.distance' | translate }}: {{ distancePercent() | appPercent }}
          </span>
        }
      </div>

      <p-button
        size="small"
        severity="danger"
        [outlined]="true"
        (onClick)="onRemove()"
      >
        <i class="pi pi-times" pButtonIcon></i>
        <span pButtonLabel>{{ 'watchlist.item.remove' | translate }}</span>
      </p-button>
    </article>
  `
})
export class WatchlistItemComponent {
  private readonly store = inject(WatchlistStore);

  private readonly _watchlist = signal<IWatchlist | null>(null);
  private readonly _item = signal<IWatchlistItem | null>(null);
  private readonly _targetDraft = signal<number | null>(null);

  @Input({ required: true })
  set watchlist(value: IWatchlist) {
    this._watchlist.set(value);
  }

  @Input({ required: true })
  set item(value: IWatchlistItem) {
    this._item.set(value);
    this._targetDraft.set(value.targetPrice ?? null);
  }
  get item(): IWatchlistItem {
    const value = this._item();
    if (!value) {
      throw new Error('WatchlistItemComponent: missing required `item` input');
    }
    return value;
  }

  @Output() readonly remove = new EventEmitter<string>();
  @Output() readonly targetPriceChange = new EventEmitter<{
    readonly symbol: string;
    readonly targetPrice: number | null;
  }>();

  readonly targetDraft = this._targetDraft.asReadonly();

  readonly assetSnapshot = computed(() => {
    return this.store.asset(this.item.symbol);
  });

  readonly currentPrice = computed<number>(() => this.assetSnapshot()?.price ?? 0);
  readonly currency = computed<string>(() => this.assetSnapshot()?.currency ?? 'USD');
  readonly assetName = computed<string>(() => this.assetSnapshot()?.name ?? '');

  readonly targetPrice = computed<number | undefined>(() => this._item()?.targetPrice);

  readonly distancePercent = computed<number>(() => {
    const target = this.targetPrice();
    if (target === undefined || target === 0) {
      return 0;
    }
    const price = this.currentPrice();
    if (price === 0) {
      return 0;
    }
    return (target - price) / price;
  });

  readonly canCommit = computed<boolean>(() => {
    const draft = this._targetDraft();
    const current = this._item()?.targetPrice;
    if (draft === null && current === undefined) {
      return false;
    }
    return draft !== current;
  });

  onTargetDraftChange(value: number | null): void {
    this._targetDraft.set(value === undefined ? null : value);
  }

  commit(): void {
    if (!this.canCommit()) {
      return;
    }
    this.targetPriceChange.emit({
      symbol: this.item.symbol,
      targetPrice: this._targetDraft()
    });
  }

  onRemove(): void {
    this.remove.emit(this.item.symbol);
  }
}
