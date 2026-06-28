import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { OrdersStore } from '../stores/orders.store';
import { NotificationService } from '../../../core/services/notification.service';
import { OpenOrderItemComponent } from './open-order-item.component';
import type { IOrder } from '../models/order.model';

/**
 * Open orders list. Hydrates from `OrdersStore.refresh()` (REST
 * `/api/orders/users/{id}/book`) and keeps the list in sync with
 * the websocket stream. Cancelling an order dispatches the action
 * through the store so the backend + websocket agree on the
 * resulting state.
 */
@Component({
  selector: 'app-open-orders-list',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    OpenOrderItemComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-shopping-cart text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'orders.open.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'orders.open.subtitle' | translate }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <p-tag
            [value]="countLabel()"
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
            <span pButtonLabel>{{ 'orders.open.refresh' | translate }}</span>
          </p-button>
          <p-button
            size="small"
            [routerLink]="['/orders', 'new']"
          >
            <i class="pi pi-plus" pButtonIcon></i>
            <span pButtonLabel>{{ 'orders.open.new' | translate }}</span>
          </p-button>
        </div>
      </header>

      <div class="flex-1 overflow-auto px-4 pb-6 sm:px-6">
        @if (store.loading() && store.openOrders().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
          >
            <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
            <span>{{ 'orders.open.loading' | translate }}</span>
          </div>
        } @else if (store.error() && store.openOrders().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-danger)]"
            role="alert"
          >
            <i class="pi pi-exclamation-triangle text-2xl" aria-hidden="true"></i>
            <p>{{ store.error() }}</p>
          </div>
        } @else if (store.openOrders().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-inbox text-2xl" aria-hidden="true"></i>
            <p>{{ 'orders.open.empty' | translate }}</p>
            <a
              [routerLink]="['/orders', 'new']"
              class="text-xs font-medium text-[var(--app-accent)] hover:underline"
            >
              {{ 'orders.open.emptyAction' | translate }}
            </a>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            @for (order of store.openOrders(); track order.id) {
              <app-open-order-item
                [order]="order"
                [cancelling]="isCancelling(order.id)"
                (cancel)="onCancel($event)"
              />
            }
          </div>
        }
      </div>
    </div>
  `
})
export class OpenOrdersListComponent implements OnInit {
  readonly store = inject(OrdersStore);
  private readonly notifications = inject(NotificationService);

  private readonly _cancelling = signal<ReadonlySet<string>>(new Set());

  readonly countLabel = computed<string>(() => {
    const count = this.store.openOrders().length;
    return `${count}`;
  });

  ngOnInit(): void {
    void this.store.refresh();
  }

  refresh(): void {
    void this.store.refresh();
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
