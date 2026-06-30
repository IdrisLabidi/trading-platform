import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

import type { AssetType, IAssetCatalogCriteria } from '../models/asset.model';

interface ITypeOption {
  readonly label: string;
  readonly value: AssetType | 'ALL';
}

interface IMarketOption {
  readonly label: string;
  readonly value: string | 'ALL';
}

const TYPE_OPTIONS: ITypeOption[] = [
  { label: 'All', value: 'ALL' },
  { label: 'STOCK', value: 'STOCK' },
  { label: 'ETF', value: 'ETF' },
  { label: 'BOND', value: 'BOND' },
  { label: 'FOREX', value: 'FOREX' }
];

const DEFAULT_CRITERIA: IAssetCatalogCriteria = {
  query: '',
  type: 'ALL',
  market: 'ALL',
  activeOnly: true
};

/**
 * Search / filter bar used by the assets catalog page. Emits the
 * normalised criteria through the `criteriaChange` event so the
 * parent component can derive its filtered view.
 */
@Component({
  selector: 'app-asset-search',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ToggleSwitchModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      class="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_12rem_auto_auto]"
      (submit)="$event.preventDefault(); apply()"
      role="search"
      [attr.aria-label]="'assets.search.aria' | translate"
    >
      <input
        pInputText
        type="search"
        class="w-full"
        [placeholder]="'assets.search.placeholder' | translate"
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
        name="query"
        autocomplete="off"
      />
      <p-select
        class="w-full"
        [options]="typeOptions"
        [ngModel]="type()"
        (ngModelChange)="type.set($event)"
        optionLabel="label"
        optionValue="value"
        appendTo="body"
        name="type"
        [placeholder]="'assets.search.type' | translate"
      ></p-select>
      <p-select
        class="w-full"
        [options]="marketOptions()"
        [ngModel]="market()"
        (ngModelChange)="market.set($event)"
        optionLabel="label"
        optionValue="value"
        appendTo="body"
        name="market"
        [placeholder]="'assets.search.market' | translate"
      ></p-select>
      <label class="flex items-center gap-2 text-xs text-[var(--app-fg-muted)]">
        <p-toggleSwitch
          name="activeOnly"
          [ngModel]="activeOnly()"
          (ngModelChange)="activeOnly.set($event)"
        ></p-toggleSwitch>
        <span>{{ 'assets.search.activeOnly' | translate }}</span>
      </label>
      <p-button
        size="small"
        severity="secondary"
        [outlined]="true"
        type="submit"
        [attr.aria-label]="'assets.search.apply' | translate"
      >
        <i class="pi pi-filter" pButtonIcon></i>
        <span pButtonLabel>{{ 'assets.search.apply' | translate }}</span>
      </p-button>
    </form>
  `
})
export class AssetSearchComponent {
  @Input() initial: IAssetCatalogCriteria = DEFAULT_CRITERIA;
  @Input() markets: readonly string[] = [];

  @Output() readonly criteriaChange = new EventEmitter<IAssetCatalogCriteria>();

  protected readonly query = signal<string>(this.initial.query);
  protected readonly type = signal<AssetType | 'ALL'>(this.initial.type);
  protected readonly market = signal<string | 'ALL'>(this.initial.market);
  protected readonly activeOnly = signal<boolean>(this.initial.activeOnly);

  readonly typeOptions: ITypeOption[] = TYPE_OPTIONS;

  readonly marketOptions = computed<IMarketOption[]>(() => {
    const list: IMarketOption[] = [{ label: 'All', value: 'ALL' }];
    for (const market of this.markets) {
      list.push({ label: market, value: market });
    }
    return list;
  });

  apply(): void {
    this.criteriaChange.emit({
      query: this.query().trim(),
      type: this.type(),
      market: this.market(),
      activeOnly: this.activeOnly()
    });
  }

  reset(): void {
    this.query.set(DEFAULT_CRITERIA.query);
    this.type.set(DEFAULT_CRITERIA.type);
    this.market.set(DEFAULT_CRITERIA.market);
    this.activeOnly.set(DEFAULT_CRITERIA.activeOnly);
    this.apply();
  }
}
