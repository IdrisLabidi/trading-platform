import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { AssetsStore } from '../stores/assets.store';
import { MarketsStore } from '../../markets/stores/markets.store';
import { OrdersStore } from '../../orders/stores/orders.store';
import { WatchlistStore } from '../../watchlist/stores/watchlist.store';
import { NotificationService } from '../../../core/services/notification.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import type { IAsset } from '../models/asset.model';

/**
 * Asset details page (`/assets/:symbol`). Resolves the symbol from
 * the route parameter, fetches the catalog entry through the store
 * and renders the metadata + live price + quick actions (trade,
 * add to watchlist).
 */
@Component({
  selector: 'app-asset-details',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    TagModule,
    CardModule,
    ProgressSpinnerModule,
    CurrencyFormatPipe,
    NumberFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <a
            routerLink="/assets"
            class="grid h-8 w-8 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
            [attr.aria-label]="'common.close' | translate"
          >
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
          </a>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ asset()?.symbol ?? symbol() }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ asset()?.name ?? ('assets.details.assetFallback' | translate) }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <p-button
            size="small"
            [outlined]="true"
            [disabled]="!asset()"
            (onClick)="addToWatchlist()"
          >
            <i class="pi pi-star" pButtonIcon></i>
            <span pButtonLabel>{{ 'assets.details.watchlist' | translate }}</span>
          </p-button>
          <p-button
            size="small"
            [disabled]="!asset()"
            [routerLink]="['/orders', 'new']"
            [queryParams]="{ symbol: asset()?.symbol ?? symbol() }"
          >
            <span pButtonLabel>{{ 'assets.details.trade' | translate }}</span>
          </p-button>
        </div>
      </header>

      @if (loading()) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
        >
          <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
          <span>{{ 'assets.details.loading' | translate }}</span>
        </div>
      } @else if (!asset()) {
        <div
          class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
        >
          <i class="pi pi-question-circle text-2xl" aria-hidden="true"></i>
          <p>{{ 'assets.details.notFound' | translate }}</p>
          <a
            routerLink="/assets"
            class="text-xs font-medium text-[var(--app-accent)] hover:underline"
          >
            {{ 'assets.details.backToList' | translate }}
          </a>
        </div>
      } @else {
        <section class="grid grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'assets.details.price' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="px-4 pb-4 text-2xl font-semibold tabular-nums">
              {{ asset()!.lastPrice | appCurrency: asset()!.currency }}
            </div>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'assets.details.currency' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="px-4 pb-4 text-2xl font-semibold">
              {{ asset()!.currency }}
            </div>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'assets.details.market' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="flex items-center px-4 pb-4">
              <p-tag
                [value]="asset()!.market || '-'"
                severity="info"
                [rounded]="true"
              ></p-tag>
            </div>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ 'assets.details.type' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="flex items-center px-4 pb-4">
              <p-tag
                [value]="asset()!.type"
                severity="secondary"
                [rounded]="true"
              ></p-tag>
            </div>
          </p-card>
        </section>

        <section class="grid grid-cols-1 gap-4 px-4 pb-6 sm:px-6 md:grid-cols-2">
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-sm font-semibold">
                  {{ 'assets.details.identification' | translate }}
                </h2>
              </div>
            </ng-template>
            <dl class="grid grid-cols-1 gap-2 px-4 pb-4 text-sm sm:grid-cols-2">
              <div class="flex flex-col gap-1">
                <dt class="text-xs text-[var(--app-fg-muted)]">
                  {{ 'assets.details.uuid' | translate }}
                </dt>
                <dd class="font-mono text-xs">{{ asset()!.id }}</dd>
              </div>
              <div class="flex flex-col gap-1">
                <dt class="text-xs text-[var(--app-fg-muted)]">
                  {{ 'assets.details.listedAt' | translate }}
                </dt>
                <dd class="font-semibold">{{ asset()!.listedAt | date: 'medium' }}</dd>
              </div>
              <div class="flex flex-col gap-1">
                <dt class="text-xs text-[var(--app-fg-muted)]">
                  {{ 'assets.details.status' | translate }}
                </dt>
                <dd>
                  <p-tag
                    [value]="asset()!.isActive ? ('assets.details.active' | translate) : ('assets.details.inactive' | translate)"
                    [severity]="asset()!.isActive ? 'success' : 'warn'"
                    [rounded]="true"
                  ></p-tag>
                </dd>
              </div>
              <div class="flex flex-col gap-1">
                <dt class="text-xs text-[var(--app-fg-muted)]">
                  {{ 'assets.details.userOrders' | translate }}
                </dt>
                <dd class="font-semibold tabular-nums">{{ userOrdersCount() | appNumber }}</dd>
              </div>
            </dl>
          </p-card>
          <p-card>
            <ng-template pTemplate="header">
              <div class="px-4 pt-4">
                <h2 class="text-sm font-semibold">
                  {{ 'assets.details.description' | translate }}
                </h2>
              </div>
            </ng-template>
            <div class="px-4 pb-4 text-sm text-[var(--app-fg-muted)]">
              @if (asset()!.description) {
                <p>{{ asset()!.description }}</p>
              } @else {
                <p class="italic">{{ 'assets.details.noDescription' | translate }}</p>
              }
            </div>
          </p-card>
        </section>
      }
    </div>
  `
})
export class AssetDetailsComponent implements OnInit {
  readonly store = inject(AssetsStore);
  private readonly marketsStore = inject(MarketsStore);
  private readonly ordersStore = inject(OrdersStore);
  private readonly watchlistStore = inject(WatchlistStore);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  readonly symbol = input<string>('');

  private readonly _loading = signal<boolean>(false);
  private readonly _fallbackSymbol = signal<string>('');

  readonly loading = this._loading.asReadonly();

  readonly asset = computed<IAsset | null>(() => {
    const sym = (this.symbol() || this._fallbackSymbol() || '').toUpperCase();
    if (!sym) {
      return null;
    }
    return this.store.bySymbol(sym);
  });

  readonly userOrdersCount = computed<number>(() => {
    const sym = this.asset()?.symbol;
    if (!sym) {
      return 0;
    }
    return this.ordersStore.history().filter((order) => order.symbol === sym).length;
  });

  ngOnInit(): void {
    const symbol = (this.route.snapshot.paramMap.get('symbol') ?? '').toUpperCase();
    if (symbol) {
      this._fallbackSymbol.set(symbol);
    }
    this._loading.set(true);
    void this.hydrate(symbol).finally(() => this._loading.set(false));
  }

  addToWatchlist(): void {
    const current = this.asset();
    if (!current) {
      return;
    }
    const target = this.watchlistStore.watchlists()[0];
    if (!target) {
      this.notifications.warn(
        'assets.notifications.watchlistMissing.title',
        'assets.notifications.watchlistMissing.message'
      );
      return;
    }
    void this.watchlistStore.addItem(target.id, { symbol: current.symbol }).catch(() => undefined);
  }

  private async hydrate(symbol: string): Promise<void> {
    if (!symbol) {
      return;
    }
    await Promise.all([
      this.store.refresh().catch(() => undefined),
      this.marketsStore.refresh().catch(() => undefined),
      this.ordersStore.refresh().catch(() => undefined),
      this.watchlistStore.refresh().catch(() => undefined),
      this.store.loadBySymbol(symbol).catch(() => undefined)
    ]);
  }
}
