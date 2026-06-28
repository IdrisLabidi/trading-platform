import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

import { OrdersStore } from '../stores/orders.store';
import { MarketsStore } from '../../markets/stores/markets.store';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import type { IOrderBook, IOrderBookLevel } from '../models/order.model';
import type { IAsset } from '../../markets/models/market.model';

interface ISymbolOption {
  readonly label: string;
  readonly value: string;
}

/**
 * Order book component. Combines the REST snapshot
 * (`GET /api/orders/book/{symbol}`) with the live websocket stream
 * pushed by the gateway. The user can switch between symbols from
 * the catalog (sourced from `MarketsStore`).
 */
@Component({
  selector: 'app-order-book',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    SelectModule,
    NumberFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-book text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'orders.book.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'orders.book.subtitle' | translate }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <p-select
            class="w-full sm:w-60"
            [options]="symbolOptions()"
            [ngModel]="selectedSymbol()"
            (ngModelChange)="onSymbolChange($event)"
            optionLabel="label"
            optionValue="value"
            [filter]="true"
            filterBy="label,value"
            appendTo="body"
            [placeholder]="'orders.book.symbolPlaceholder' | translate"
          ></p-select>
          <p-button
            size="small"
            severity="secondary"
            [outlined]="true"
            [loading]="loading()"
            [disabled]="!selectedSymbol()"
            (onClick)="reload()"
          >
            <i class="pi pi-refresh" pButtonIcon></i>
            <span pButtonLabel>{{ 'orders.book.refresh' | translate }}</span>
          </p-button>
          @if (selectedSymbol()) {
            <a
              [routerLink]="['/orders', 'new']"
              [queryParams]="{ symbol: selectedSymbol() }"
              class="text-xs font-medium text-[var(--app-accent)] hover:underline"
            >
              {{ 'orders.book.trade' | translate }}
            </a>
          }
        </div>
      </header>

      <div class="flex-1 overflow-auto px-4 pb-6 sm:px-6">
        @if (!selectedSymbol()) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-search text-2xl" aria-hidden="true"></i>
            <p>{{ 'orders.book.empty' | translate }}</p>
          </div>
        } @else if (loading() && !orderBook()) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
          >
            <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
            <span>{{ 'orders.book.loading' | translate }}</span>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section class="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)]">
              <header class="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
                <div class="flex items-center gap-2">
                  <i class="pi pi-arrow-down text-sm text-[var(--app-success)]" aria-hidden="true"></i>
                  <h2 class="text-sm font-semibold">
                    {{ 'orders.book.bids' | translate }}
                  </h2>
                </div>
                <span class="text-xs text-[var(--app-fg-muted)]">
                  {{ bids().length }}
                </span>
              </header>
              <div class="grid grid-cols-2 px-4 py-2 text-xs uppercase text-[var(--app-fg-muted)]">
                <span>{{ 'orders.book.price' | translate }}</span>
                <span class="text-end">{{ 'orders.book.quantity' | translate }}</span>
              </div>
              <ul class="divide-y divide-[var(--app-border)]">
                @if (bids().length === 0) {
                  <li class="px-4 py-3 text-sm text-[var(--app-fg-muted)]">
                    {{ 'orders.book.emptyBids' | translate }}
                  </li>
                } @else {
                  @for (level of bids(); track level.price) {
                    <li class="flex items-center justify-between px-4 py-2 text-sm tabular-nums">
                      <span class="font-semibold text-[var(--app-success)]">
                        {{ level.price | appNumber }}
                      </span>
                      <span class="text-[var(--app-fg-muted)]">
                        {{ level.totalQuantity | appNumber }}
                      </span>
                    </li>
                  }
                }
              </ul>
            </section>
            <section class="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)]">
              <header class="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
                <div class="flex items-center gap-2">
                  <i class="pi pi-arrow-up text-sm text-[var(--app-danger)]" aria-hidden="true"></i>
                  <h2 class="text-sm font-semibold">
                    {{ 'orders.book.asks' | translate }}
                  </h2>
                </div>
                <span class="text-xs text-[var(--app-fg-muted)]">
                  {{ asks().length }}
                </span>
              </header>
              <div class="grid grid-cols-2 px-4 py-2 text-xs uppercase text-[var(--app-fg-muted)]">
                <span>{{ 'orders.book.price' | translate }}</span>
                <span class="text-end">{{ 'orders.book.quantity' | translate }}</span>
              </div>
              <ul class="divide-y divide-[var(--app-border)]">
                @if (asks().length === 0) {
                  <li class="px-4 py-3 text-sm text-[var(--app-fg-muted)]">
                    {{ 'orders.book.emptyAsks' | translate }}
                  </li>
                } @else {
                  @for (level of asks(); track level.price) {
                    <li class="flex items-center justify-between px-4 py-2 text-sm tabular-nums">
                      <span class="font-semibold text-[var(--app-danger)]">
                        {{ level.price | appNumber }}
                      </span>
                      <span class="text-[var(--app-fg-muted)]">
                        {{ level.totalQuantity | appNumber }}
                      </span>
                    </li>
                  }
                }
              </ul>
            </section>
          </div>
        }
      </div>
    </div>
  `
})
export class OrderBookComponent implements OnInit {
  readonly ordersStore = inject(OrdersStore);
  private readonly marketsStore = inject(MarketsStore);

  private readonly _selected = signal<string>('');
  private readonly _loading = signal<boolean>(false);

  readonly selectedSymbol = this._selected.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly symbolOptions = computed<ISymbolOption[]>(() => {
    const assets = this.marketsStore.assets();
    return assets
      .map((asset: IAsset) => ({ label: `${asset.symbol} — ${asset.name}`, value: asset.symbol }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly orderBook = computed<IOrderBook | null>(() => {
    const book = this.ordersStore.orderBook();
    if (!book) {
      return null;
    }
    const symbol = this._selected();
    if (symbol && book.symbol && book.symbol.toUpperCase() !== symbol) {
      return null;
    }
    return book;
  });

  readonly bids = computed<readonly IOrderBookLevel[]>(() => this.orderBook()?.bids ?? []);
  readonly asks = computed<readonly IOrderBookLevel[]>(() => this.orderBook()?.asks ?? []);

  ngOnInit(): void {
    void this.marketsStore.refresh();
    const initial = this.marketsStore.assets()[0]?.symbol ?? '';
    if (initial && !this._selected()) {
      this._selected.set(initial);
      void this.fetchBook(initial);
    }
  }

  onSymbolChange(symbol: string | null): void {
    const value = (symbol ?? '').toUpperCase();
    this._selected.set(value);
    if (value) {
      void this.fetchBook(value);
    }
  }

  reload(): void {
    const symbol = this._selected();
    if (!symbol) {
      return;
    }
    void this.fetchBook(symbol);
  }

  private async fetchBook(symbol: string): Promise<void> {
    this._loading.set(true);
    try {
      await this.ordersStore.loadBook(symbol);
    } finally {
      this._loading.set(false);
    }
  }
}
