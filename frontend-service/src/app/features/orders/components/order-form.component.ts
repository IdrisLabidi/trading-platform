import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { OrdersStore } from '../stores/orders.store';
import { MarketsStore } from '../../markets/stores/markets.store';
import { NotificationService } from '../../../core/services/notification.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import type { OrderSide, OrderType } from '../models/order.model';
import type { IAsset } from '../../markets/models/market.model';

interface IOrderFormControls {
  symbol: FormControl<string>;
  side: FormControl<OrderSide>;
  type: FormControl<OrderType>;
  price: FormControl<number | null>;
  quantity: FormControl<number | null>;
}

/**
 * Order submission page. Renders a PrimeNG-driven reactive form,
 * pre-fills the symbol from the `?symbol=...` query parameter when
 * available and delegates the submission to `OrdersStore.submit()`.
 *
 * The page is wired against the `market-service` REST endpoints and
 * the realtime layer: a successful submission pushes the order
 * through the websocket so the open-orders list updates without an
 * extra round trip.
 */
@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    TagModule,
    CardModule,
    MessageModule,
    ProgressSpinnerModule,
    CurrencyFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <header
        class="flex items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:px-6"
      >
        <div class="flex items-center gap-3">
          <a
            routerLink="/orders"
            class="grid h-8 w-8 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
            [attr.aria-label]="'common.close' | translate"
          >
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
          </a>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'orders.form.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'orders.form.subtitle' | translate }}
            </p>
          </div>
        </div>
      </header>

      @if (store.submitting()) {
        <div
          class="flex items-center gap-2 rounded-md border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-2 text-sm text-[var(--app-fg-muted)]"
        >
          <p-progressSpinner styleClass="h-4 w-4" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
          <span>{{ 'orders.form.submitting' | translate }}</span>
        </div>
      }

      @if (store.error(); as error) {
        <p-message severity="error" [text]="error"></p-message>
      }

      <form
        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
        [formGroup]="form"
        (ngSubmit)="submit()"
        novalidate
      >
        <p-card class="sm:col-span-2">
          <ng-template pTemplate="header">
            <div class="px-4 pt-4">
              <h2 class="text-sm font-semibold">
                {{ 'orders.form.section.instrument' | translate }}
              </h2>
            </div>
          </ng-template>

          <div class="flex flex-col gap-3 px-4 pb-4">
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-medium text-[var(--app-fg)]">
                {{ 'orders.form.field.symbol' | translate }}
              </span>
              <p-select
                class="w-full"
                formControlName="symbol"
                [options]="symbolOptions()"
                optionLabel="label"
                optionValue="value"
                [filter]="true"
                filterBy="label,value"
                [placeholder]="'orders.form.field.symbolPlaceholder' | translate"
                [showClear]="true"
                appendTo="body"
                dataKey="value"
              ></p-select>
            </label>

            <label class="flex flex-col gap-1 text-sm">
              <span class="font-medium text-[var(--app-fg)]">
                {{ 'orders.form.field.side' | translate }}
              </span>
              <p-select
                class="w-full"
                formControlName="side"
                [options]="sideOptions"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
              ></p-select>
            </label>

            <label class="flex flex-col gap-1 text-sm">
              <span class="font-medium text-[var(--app-fg)]">
                {{ 'orders.form.field.type' | translate }}
              </span>
              <p-select
                class="w-full"
                formControlName="type"
                [options]="typeOptions"
                optionLabel="label"
                optionValue="value"
                appendTo="body"
              ></p-select>
            </label>
          </div>
        </p-card>

        <p-card class="sm:col-span-2">
          <ng-template pTemplate="header">
            <div class="px-4 pt-4">
              <h2 class="text-sm font-semibold">
                {{ 'orders.form.section.execution' | translate }}
              </h2>
            </div>
          </ng-template>

          <div class="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-medium text-[var(--app-fg)]">
                {{ 'orders.form.field.price' | translate }}
              </span>
              <p-inputNumber
                class="w-full"
                formControlName="price"
                [min]="0"
                [minFractionDigits]="2"
                [maxFractionDigits]="6"
                [disabled]="typeControl.value === 'MARKET'"
                [placeholder]="'orders.form.field.pricePlaceholder' | translate"
              ></p-inputNumber>
              @if (typeControl.value === 'MARKET') {
                <small class="text-[var(--app-fg-muted)]">
                  {{ 'orders.form.field.priceMarketHint' | translate }}
                </small>
              }
            </label>

            <label class="flex flex-col gap-1 text-sm">
              <span class="font-medium text-[var(--app-fg)]">
                {{ 'orders.form.field.quantity' | translate }}
              </span>
              <p-inputNumber
                class="w-full"
                formControlName="quantity"
                [min]="1"
                [showButtons]="true"
                [placeholder]="'orders.form.field.quantityPlaceholder' | translate"
              ></p-inputNumber>
            </label>
          </div>
        </p-card>

        <p-card class="sm:col-span-2">
          <ng-template pTemplate="header">
            <div class="px-4 pt-4">
              <h2 class="text-sm font-semibold">
                {{ 'orders.form.section.summary' | translate }}
              </h2>
            </div>
          </ng-template>

          <div class="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-3">
            <div class="flex flex-col gap-1">
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ 'orders.form.summary.symbol' | translate }}
              </span>
              <span class="text-sm font-semibold">{{ summarySymbol() }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ 'orders.form.summary.estimated' | translate }}
              </span>
              <span class="text-sm font-semibold tabular-nums">
                {{ estimatedTotal() | appCurrency: summaryCurrency() }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ 'orders.form.summary.side' | translate }}
              </span>
              <p-tag
                [value]="sideControl.value"
                [severity]="sideControl.value === 'BUY' ? 'success' : 'danger'"
                [rounded]="true"
              ></p-tag>
            </div>
          </div>
        </p-card>

        <div class="flex items-center justify-end gap-2 sm:col-span-2">
          <p-button
            severity="secondary"
            [outlined]="true"
            type="button"
            [disabled]="store.submitting()"
            (onClick)="reset()"
          >
            <span pButtonLabel>{{ 'orders.form.actions.reset' | translate }}</span>
          </p-button>
          <p-button
            type="submit"
            [severity]="sideControl.value === 'BUY' ? 'success' : 'danger'"
            [disabled]="form.invalid || store.submitting()"
            [loading]="store.submitting()"
          >
            <span pButtonLabel>
              {{ (sideControl.value === 'BUY' ? 'orders.form.actions.submitBuy' : 'orders.form.actions.submitSell') | translate }}
            </span>
          </p-button>
        </div>
      </form>
    </div>
  `
})
export class OrderFormComponent implements OnInit {
  readonly store = inject(OrdersStore);
  private readonly marketsStore = inject(MarketsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  readonly form = this.fb.nonNullable.group<IOrderFormControls>({
    symbol: this.fb.nonNullable.control<string>('', [Validators.required]),
    side: this.fb.nonNullable.control<OrderSide>('BUY', [Validators.required]),
    type: this.fb.nonNullable.control<OrderType>('LIMIT', [Validators.required]),
    price: this.fb.control<number | null>(null, [Validators.min(0)]),
    quantity: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)])
  });

  readonly sideOptions: ReadonlyArray<{ readonly label: string; readonly value: OrderSide }> = [
    { label: 'BUY', value: 'BUY' },
    { label: 'SELL', value: 'SELL' }
  ];

  readonly typeOptions: ReadonlyArray<{ readonly label: string; readonly value: OrderType }> = [
    { label: 'LIMIT', value: 'LIMIT' },
    { label: 'MARKET', value: 'MARKET' }
  ];

  private readonly _preselectedSymbol = signal<string | null>(null);

  readonly symbolOptions = computed<ReadonlyArray<{ readonly label: string; readonly value: string }>>(() => {
    const assets = this.marketsStore.assets();
    return assets
      .map((asset: IAsset) => ({ label: `${asset.symbol} — ${asset.name}`, value: asset.symbol }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly summarySymbol = computed<string>(() => this.symbolControl.value || '-');
  readonly summaryCurrency = computed<string>(() => {
    const sym = this.symbolControl.value;
    if (!sym) {
      return 'USD';
    }
    const asset = this.marketsStore.assets().find((entry) => entry.symbol === sym);
    return asset?.currency ?? 'USD';
  });

  readonly estimatedTotal = computed<number>(() => {
    const price = this.priceControl.value;
    const quantity = this.quantityControl.value;
    if (price === null || quantity === null) {
      return 0;
    }
    return price * quantity;
  });

  get symbolControl(): FormControl<string> {
    return this.form.controls.symbol;
  }

  get sideControl(): FormControl<OrderSide> {
    return this.form.controls.side;
  }

  get typeControl(): FormControl<OrderType> {
    return this.form.controls.type;
  }

  get priceControl(): FormControl<number | null> {
    return this.form.controls.price;
  }

  get quantityControl(): FormControl<number | null> {
    return this.form.controls.quantity;
  }

  ngOnInit(): void {
    void this.marketsStore.refresh();
    const fromQuery = (this.route.snapshot.queryParamMap.get('symbol') ?? '').toUpperCase();
    if (fromQuery) {
      this._preselectedSymbol.set(fromQuery);
      this.symbolControl.setValue(fromQuery);
    }
    this.symbolControl.valueChanges.subscribe((symbol) => {
      if (!symbol) {
        return;
      }
      const asset = this.marketsStore.assets().find((entry) => entry.symbol === symbol);
      if (asset && this.priceControl.value === null) {
        this.priceControl.setValue(asset.lastPrice);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const symbol = this.symbolControl.value;
    const side = this.sideControl.value;
    const type = this.typeControl.value;
    const quantity = this.quantityControl.value;
    const price = this.priceControl.value;
    if (!symbol || quantity === null) {
      return;
    }
    if (type === 'LIMIT' && (price === null || price <= 0)) {
      this.priceControl.setErrors({ required: true });
      this.priceControl.markAsTouched();
      return;
    }
    void this.store
      .submit({
        symbol,
        side,
        type,
        price: type === 'LIMIT' ? price : null,
        quantity
      })
      .then(() => {
        this.notifications.success(
          'orders.notifications.submitted.title',
          'orders.notifications.submitted.message'
        );
        void this.router.navigate(['/orders']);
      })
      .catch(() => undefined);
  }

  reset(): void {
    this.form.reset({
      symbol: this._preselectedSymbol() ?? '',
      side: 'BUY',
      type: 'LIMIT',
      price: null,
      quantity: null
    });
  }
}
