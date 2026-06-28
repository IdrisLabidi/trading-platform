import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MarketsStore } from '../stores/markets.store';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { PercentFormatPipe } from '../../../shared/pipes/percent-format.pipe';
import type { IMarket, IOrderBook } from '../models/market.model';
import type { IOrder } from '../../orders/models/order.model';

/**
 * Market details page. Renders the latest price, the order book
 * snapshot and the user-specific context (positions, open orders)
 * for a single symbol routed as `/markets/:symbol`.
 */
@Component({
  selector: 'app-market-details',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    TagModule,
    TableModule,
    ProgressSpinnerModule,
    CurrencyFormatPipe,
    NumberFormatPipe,
    PercentFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      @if (store.loading() && !market()) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
        >
          <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
          <span>{{ 'markets.details.loading' | translate }}</span>
        </div>
      } @else if (!market()) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
        >
          <i class="pi pi-question-circle text-2xl" aria-hidden="true"></i>
          <p>{{ 'markets.details.notFound' | translate }}</p>
          <a routerLink="/markets" class="text-[var(--app-accent)] hover:underline">
            {{ 'markets.details.backToList' | translate }}
          </a>
        </div>
      } @else {
        <header
          class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div class="flex items-center gap-3">
            <a
              routerLink="/markets"
              class="grid h-8 w-8 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
              [attr.aria-label]="'common.close' | translate"
            >
              <i class="pi pi-arrow-left" aria-hidden="true"></i>
            </a>
            <div>
              <h1 class="text-base font-semibold sm:text-lg">{{ market()!.symbol }}</h1>
              <p class="text-xs text-[var(--app-fg-muted)]">
                {{ market()!.name }}
                <span class="mx-1">·</span>
                {{ market()!.type }}
                <span class="mx-1">·</span>
                {{ market()!.currency }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="text-end">
              <div class="text-2xl font-semibold tabular-nums">
                {{ market()!.price | appCurrency: market()!.currency }}
              </div>
              <div
                class="text-xs tabular-nums"
                [class.text-[var(--app-success)]]="market()!.change >= 0"
                [class.text-[var(--app-danger)]]="market()!.change < 0"
              >
                {{ market()!.change | appNumber }}
                ({{ market()!.changePercent | appPercent }})
              </div>
            </div>
            @if (canTrade()) {
              <p-button
                size="small"
                [routerLink]="['/orders', 'new']"
                [queryParams]="{ symbol: market()!.symbol }"
              >
                <span pButtonLabel>{{ 'markets.details.trade' | translate }}</span>
              </p-button>
            }
          </div>
        </header>

        <div class="grid flex-1 grid-cols-1 gap-4 overflow-auto px-4 pb-6 sm:px-6 lg:grid-cols-3">
          <section
            class="flex h-full flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm lg:col-span-2"
          >
            <header class="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
              <div class="flex items-center gap-2">
                <i class="pi pi-book text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
                <h2 class="text-sm font-semibold">
                  {{ 'markets.details.orderBook' | translate }}
                </h2>
              </div>
              <p-button
                size="small"
                [text]="true"
                severity="secondary"
                [loading]="loadingBook()"
                (onClick)="reloadOrderBook()"
              >
                <i class="pi pi-refresh" pButtonIcon></i>
                <span pButtonLabel>{{ 'markets.details.refreshBook' | translate }}</span>
              </p-button>
            </header>
            <div class="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between text-xs uppercase text-[var(--app-fg-muted)]">
                  <span>{{ 'markets.details.bids' | translate }}</span>
                  <span>{{ 'markets.details.price' | translate }}</span>
                </div>
                @if (bids().length === 0) {
                  <p class="text-sm text-[var(--app-fg-muted)]">
                    {{ 'markets.details.emptyBids' | translate }}
                  </p>
                } @else {
                  <ul class="flex flex-col divide-y divide-[var(--app-border)]">
                    @for (level of bids(); track level.price) {
                      <li
                        class="flex items-center justify-between py-1 text-sm tabular-nums"
                      >
                        <span class="font-semibold text-[var(--app-success)]">
                          {{ level.price | appNumber }}
                        </span>
                        <span class="text-[var(--app-fg-muted)]">
                          {{ level.totalQuantity | appNumber }}
                        </span>
                      </li>
                    }
                  </ul>
                }
              </div>
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between text-xs uppercase text-[var(--app-fg-muted)]">
                  <span>{{ 'markets.details.price' | translate }}</span>
                  <span>{{ 'markets.details.asks' | translate }}</span>
                </div>
                @if (asks().length === 0) {
                  <p class="text-sm text-[var(--app-fg-muted)]">
                    {{ 'markets.details.emptyAsks' | translate }}
                  </p>
                } @else {
                  <ul class="flex flex-col divide-y divide-[var(--app-border)]">
                    @for (level of asks(); track level.price) {
                      <li
                        class="flex items-center justify-between py-1 text-sm tabular-nums"
                      >
                        <span class="font-semibold text-[var(--app-danger)]">
                          {{ level.price | appNumber }}
                        </span>
                        <span class="text-[var(--app-fg-muted)]">
                          {{ level.totalQuantity | appNumber }}
                        </span>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          </section>

          <section
            class="flex h-full flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
          >
            <header class="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
              <div class="flex items-center gap-2">
                <i class="pi pi-shopping-cart text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
                <h2 class="text-sm font-semibold">
                  {{ 'markets.details.myOrders' | translate }}
                </h2>
              </div>
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ userOrders().length }}
              </span>
            </header>
            <div class="flex-1 overflow-auto">
              @if (userOrders().length === 0) {
                <div
                  class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--app-fg-muted)]"
                >
                  <i class="pi pi-inbox text-2xl" aria-hidden="true"></i>
                  <p>{{ 'markets.details.noOrders' | translate }}</p>
                </div>
              } @else {
                <ul class="divide-y divide-[var(--app-border)]">
                  @for (order of userOrders(); track order.id) {
                    <li class="flex flex-col gap-1 px-4 py-3 text-sm">
                      <div class="flex items-center justify-between">
                        <span
                          class="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
                          [class.bg-[var(--app-success)]]="order.side === 'BUY'"
                          [class.bg-[var(--app-danger)]]="order.side === 'SELL'"
                          [class.text-white]="true"
                        >
                          {{ order.side }}
                        </span>
                        <p-tag
                          [value]="order.status"
                          [severity]="statusSeverity(order.status)"
                          [rounded]="true"
                        ></p-tag>
                      </div>
                      <div class="flex items-center justify-between tabular-nums">
                        <span>{{ order.quantity | appNumber }}</span>
                        <span>{{ order.price | appCurrency: market()!.currency }}</span>
                      </div>
                      <div class="text-xs text-[var(--app-fg-muted)]">
                        {{ order.createdAt | date: 'short' }}
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `
})
export class MarketDetailsComponent implements OnInit {
  readonly store = inject(MarketsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  /** Route parameter provided by the router. */
  readonly symbol = input<string>('');

  private readonly _loadingBook = signal<boolean>(false);

  readonly loadingBook = this._loadingBook.asReadonly();

  readonly market = computed<IMarket | null>(() => {
    const sym = (this.symbol() || this.route.snapshot.paramMap.get('symbol') || '').toUpperCase();
    if (!sym) {
      return null;
    }
    return this.store.markets().find((m) => m.symbol.toUpperCase() === sym) ?? null;
  });

  readonly orderBook = computed<IOrderBook | null>(() => {
    const sym = this.market()?.symbol;
    if (!sym) {
      return null;
    }
    return this.store.orderBook(sym);
  });

  readonly bids = computed(() => this.orderBook()?.bids ?? []);
  readonly asks = computed(() => this.orderBook()?.asks ?? []);

  readonly userOrders = computed<readonly IOrder[]>(() => {
    const sym = this.market()?.symbol;
    if (!sym) {
      return [];
    }
    return this.store.userOrders().filter((order) => order.symbol.toUpperCase() === sym.toUpperCase());
  });

  readonly canTrade = computed<boolean>(() => {
    const user = this.auth.user();
    if (!user) {
      return false;
    }
    return user.roles.some((role) => role === 'trader' || role === 'admin');
  });

  ngOnInit(): void {
    void this.store.refresh();
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const symbol = (params.get('symbol') ?? '').toUpperCase();
      if (!symbol) {
        return;
      }
      void this.loadOrderBook(symbol);
    });
    if (!this.store.markets().length) {
      void this.store.refresh();
    }
  }

  reloadOrderBook(): void {
    const sym = this.market()?.symbol;
    if (!sym) {
      return;
    }
    void this.loadOrderBook(sym);
  }

  statusSeverity(status: IOrder['status']): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    switch (status) {
      case 'FILLED':
        return 'success';
      case 'PARTIAL':
        return 'warn';
      case 'CANCELLED':
      case 'REJECTED':
        return 'danger';
      case 'PENDING':
      case 'OPEN':
        return 'info';
      default:
        return 'secondary';
    }
  }

  private async loadOrderBook(symbol: string): Promise<void> {
    this._loadingBook.set(true);
    try {
      await this.store.loadOrderBook(symbol);
    } finally {
      this._loadingBook.set(false);
    }
  }
}
