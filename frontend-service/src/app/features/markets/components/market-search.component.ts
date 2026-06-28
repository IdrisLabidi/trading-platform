import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

import type { AssetType } from '../models/market.model';

export interface IMarketSearchCriteria {
  readonly query: string;
  readonly type: AssetType | 'ALL';
  readonly activeOnly: boolean;
}

const DEFAULT_CRITERIA: IMarketSearchCriteria = {
  query: '',
  type: 'ALL',
  activeOnly: true
};

/**
 * Lightweight search bar used by the markets listing page. Emits
 * normalised criteria through the `criteriaChange` event so the
 * parent component can filter its data set.
 */
@Component({
  selector: 'app-market-search',
  standalone: true,
  imports: [FormsModule, TranslatePipe, InputTextModule, ButtonModule, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      class="flex flex-col gap-2 sm:flex-row sm:items-center"
      (submit)="$event.preventDefault(); apply()"
      role="search"
      [attr.aria-label]="'markets.search.aria' | translate"
    >
      <span class="p-input-icon-left flex-1">
        <input
          pInputText
          type="search"
          class="w-full"
          [placeholder]="'markets.search.placeholder' | translate"
          [ngModel]="query()"
          (ngModelChange)="query.set($event)"
          name="query"
          autocomplete="off"
        />
      </span>

      <p-select
        class="w-full sm:w-40"
        [options]="typeOptions"
        [ngModel]="type()"
        (ngModelChange)="type.set($event)"
        optionLabel="label"
        optionValue="value"
        appendTo="body"
        name="type"
        [placeholder]="'markets.search.type' | translate"
      ></p-select>

      <label class="flex items-center gap-2 text-sm text-[var(--app-fg-muted)]">
        <input
          type="checkbox"
          class="h-4 w-4 accent-[var(--app-accent)]"
          [checked]="activeOnly()"
          (change)="onActiveOnlyChange($event)"
        />
        <span>{{ 'markets.search.activeOnly' | translate }}</span>
      </label>

      <p-button
        size="small"
        severity="secondary"
        [outlined]="true"
        type="submit"
        [attr.aria-label]="'markets.search.apply' | translate"
      >
        <span pButtonLabel>{{ 'markets.search.apply' | translate }}</span>
      </p-button>
    </form>
  `
})
export class MarketSearchComponent {
  @Input() initial: IMarketSearchCriteria = DEFAULT_CRITERIA;

  @Output() readonly criteriaChange = new EventEmitter<IMarketSearchCriteria>();

  protected readonly query = signal<string>(this.initial.query);
  protected readonly type = signal<AssetType | 'ALL'>(this.initial.type);
  protected readonly activeOnly = signal<boolean>(this.initial.activeOnly);

  readonly typeOptions: { readonly label: string; readonly value: AssetType | 'ALL' }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'STOCK', value: 'STOCK' },
    { label: 'ETF', value: 'ETF' },
    { label: 'BOND', value: 'BOND' },
    { label: 'FOREX', value: 'FOREX' }
  ];

  apply(): void {
    this.criteriaChange.emit({
      query: this.query().trim(),
      type: this.type(),
      activeOnly: this.activeOnly()
    });
  }

  reset(): void {
    this.query.set(DEFAULT_CRITERIA.query);
    this.type.set(DEFAULT_CRITERIA.type);
    this.activeOnly.set(DEFAULT_CRITERIA.activeOnly);
    this.apply();
  }

  onActiveOnlyChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    this.activeOnly.set(target.checked);
  }
}
