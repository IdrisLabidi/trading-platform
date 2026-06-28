import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';

import { OrdersStore } from '../stores/orders.store';
import { NotificationService } from '../../../core/services/notification.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import { OpenOrderItemComponent } from './open-order-item.component';
import type { IOrder, OrderStatus } from '../models/order.model';

interface IStatusFilter {
  readonly label: string;
  readonly value: OrderStatus | 'ALL';
}

/**
 * Order history page. Loads the caller''s order history through the
 * REST endpoint, augments it with realtime events and lets the user
 * filter by status. Open orders are surfaced as actionable cards
 * (cancel button) while terminal orders are rendered as a static
 * table.
 */
@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    SelectModule,
    CurrencyFormatPipe,
    NumberFormatPipe,
    OpenOrderItemComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-history text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ ''orders.history.title'' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ ''orders.history.subtitle'' | translate }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <p-tag
            [value]="ordersCountLabel()"
            severity="info"
            [rounded]="true"
          ></p-tag>
          <p-button
            size="small"
            severity="secondary"
            [outlined]="true"
            [loading]="store.loading()"
            (onClick)="refresh()"
          >
            <i class="pi pi-refresh" pButtonIcon></i>
            <span pButtonLabel>{{ ''orders.history.refresh'' | translate }}</span>
          </p-button>
          <p-button
            size="small"
            [routerLink]="[''/orders'', ''open'']"
          >
            <span pButtonLabel>{{ ''orders.history.open'' | translate }}</span>
          </p-button>
        </div>
      </header>

      <div class="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p-select
          class="w-full sm:w-60"
          [options]="statusOptions"
          [ngModel]="statusFilter()"
          (ngModelChange)="onStatusChange($event)"
          optionLabel="label"
          optionValue="value"
          appendTo="body"
          [placeholder]="''orders.history.filter'' | translate"
        ></p-select>
        <p-button
          size="small"
          [routerLink]="[''/orders'', ''new'']"
        >
          <i class="pi pi-plus" pButtonIcon></i>
          <span pButtonLabel>{{ ''orders.history.new'' | translate }}</span>
        </p-button>
      </div>

      <div class="flex-1 overflow-auto px-4 pb-6 sm:px-6">
        @if (store.loading() && store.history().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
          >
            <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
            <span>{{ ''orders.history.loading'' | translate }}</span>
          </div>
        } @else if (store.error() && store.history().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-danger)]"
            role="alert"
          >
            <i class="pi pi-exclamation-triangle text-2xl" aria-hidden="true"></i>
            <p>{{ store.error() }}</p>
          </div>
        } @else if (filteredOrders().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-search text-2xl" aria-hidden="true"></i>
            <p>{{ ''orders.history.empty'' | translate }}</p>
          </div>
        } @else {
          <div class="flex flex-col gap-4">
            @if (openFiltered().length > 0) {
              <section class="flex flex-col gap-2">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ ''orders.history.openSection'' | translate }}
                </h2>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  @for (order of openFiltered(); track order.id) {
                    <app-open-order-item
                      [order]="order"
                      [cancelling]="isCancelling(order.id)"
                      (cancel)="onCancel($event)"
                    />
                  }
                </div>
              </section>
            }
            @if (terminalFiltered().length > 0) {
              <section class="flex flex-col gap-2">
                <h2 class="text-xs font-semibold uppercase text-[var(--app-fg-muted)]">
                  {{ ''orders.history.terminalSection'' | translate }}
                </h2>
                <div class="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)]">
                  <table class="w-full text-sm">
                    <thead class="bg-[var(--app-bg-overlay)] text-xs uppercase text-[var(--app-fg-muted)]">
                      <tr>
                        <th class="px-3 py-2 text-start font-medium">{{ ''orders.history.col.symbol'' | translate }}</th>
                        <th class="px-3 py-2 text-start font-medium">{{ ''orders.history.col.side'' | translate }}</th>
                        <th class="px-3 py-2 text-start font-medium">{{ ''orders.history.col.type'' | translate }}</th>
                        <th class="px-3 py-2 text-end font-medium">{{ ''orders.history.col.quantity'' | translate }}</th>
                        <th class="px-3 py-2 text-end font-medium">{{ ''orders.history.col.price'' | translate }}</th>
                        <th class="px-3 py-2 text-start font-medium">{{ ''orders.history.col.status'' | translate }}</th>
                        <th class="px-3 py-2 text-start font-medium">{{ ''orders.history.col.createdAt'' | translate }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (order of terminalFiltered(); track order.id) {
                        <tr class="border-t border-[var(--app-border)]">
                          <td class="px-3 py-2 font-medium">{{ order.symbol }}</td>
                          <td class="px-3 py-2">
                            <span
                              class="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
                              [class.bg-[var(--app-success)]]="order.side === ''BUY''"
                              [class.bg-[var(--app-danger)]]="order.side === ''SELL''"
                              [class.text-white]="true"
                            >
                              {{ order.side }}
                            </span>
                          </td>
                          <td class="px-3 py-2">{{ order.type }}</td>
                          <td class="px-3 py-2 text-end tabular-nums">{{ order.quantity | appNumber }}</td>
                          <td class="px-3 py-2 text-end tabular-nums">{{ order.price | appNumber }}</td>
                          <td class="px-3 py-2">
                            <p-tag
                              [value]="order.status"
                              [severity]="severity(order.status)"
                              [rounded]="true"
                            ></p-tag>
                          </td>
                          <td class="px-3 py-2">{{ order.createdAt | date: ''short'' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class OrderHistoryComponent implements OnInit {
  readonly store = inject(OrdersStore);
  private readonly notifications = inject(NotificationService);

  private readonly _statusFilter = signal<OrderStatus | 'ALL'>('ALL');
  private readonly _cancelling = signal<ReadonlySet<string>>(new Set());

  readonly statusOptions: ReadonlyArray<IStatusFilter> = [
    { label: 'All', value: 'ALL' },
    { label: 'PENDING', value: 'PENDING' },
    { label: 'PARTIAL', value: 'PARTIAL' },
    { label: 'FILLED', value: 'FILLED' },
    { label: 'CANCELLED', value: 'CANCELLED' }
  ];

  readonly filteredOrders = computed<readonly IOrder[]>(() => {
    const status = this._statusFilter();
    const all = this.store.history();
    if (status === 'ALL') {
      return all;
    }
    return all.filter((order) => order.status === status);
  });

  readonly openFiltered = computed<readonly IOrder[]>(() =>
    this.filteredOrders().filter((order) => isOpenStatus(order.status))
  );

  readonly terminalFiltered = computed<readonly IOrder[]>(() =>
    this.filteredOrders().filter((order) => !isOpenStatus(order.status))
  );

  readonly ordersCountLabel = computed<string>(() => `${this.filteredOrders().length}`);

  readonly statusFilter = this._statusFilter.asReadonly();

  ngOnInit(): void {
    void this.store.refresh();
  }

  refresh(): void {
    void this.store.refresh();
  }

  onStatusChange(value: OrderStatus | 'ALL' | null): void {
    this._statusFilter.set(value ?? 'ALL');
  }

  severity(status: OrderStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
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
      default:
        return 'info';
    }
  }

  onCancel(order: IOrder): void {
    if (!order.id) {
      return;
    }
    this._cancelling.update((set) => {
      const next = new Set(set);
      next.add(order.id);
      return next;
    });
    void this.store
      .cancel(order.id)
      .then(() => {
        this.notifications.success(
          'orders.notifications.cancelled.title',
          'orders.notifications.cancelled.message'
        );
      })
      .catch(() => undefined)
      .finally(() => {
        this._cancelling.update((set) => {
          const next = new Set(set);
          next.delete(order.id);
          return next;
        });
      });
  }

  isCancelling(orderId: string): boolean {
    return this._cancelling().has(orderId);
  }
}

function isOpenStatus(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'PARTIAL' || status === 'OPEN';
}
