import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import type { IOrder, OrderStatus } from '../models/order.model';

/**
 * Compact row used by `OpenOrdersListComponent`. Renders the order
 * metadata and emits `cancel` when the user clicks the action
 * button. Pure presentation: no HTTP / state side effects.
 */
@Component({
  selector: 'app-open-order-item',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    ButtonModule,
    TagModule,
    CurrencyFormatPipe,
    NumberFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm"
      [attr.data-symbol]="order.symbol"
      [attr.data-order-id]="order.id"
    >
      <header class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span
            class="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
            [class.bg-[var(--app-success)]]="order.side === 'BUY'"
            [class.bg-[var(--app-danger)]]="order.side === 'SELL'"
            [class.text-white]="true"
          >
            {{ order.side }}
          </span>
          <span class="text-sm font-semibold">{{ order.symbol }}</span>
          <span class="text-xs text-[var(--app-fg-muted)]">{{ order.type }}</span>
        </div>
        <p-tag
          [value]="order.status"
          [severity]="severity()"
          [rounded]="true"
        ></p-tag>
      </header>

      <dl class="grid grid-cols-2 gap-2 text-xs">
        <div class="flex flex-col">
          <dt class="text-[var(--app-fg-muted)]">{{ 'orders.item.quantity' | translate }}</dt>
          <dd class="font-semibold tabular-nums">{{ order.quantity | appNumber }}</dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-[var(--app-fg-muted)]">{{ 'orders.item.remaining' | translate }}</dt>
          <dd class="font-semibold tabular-nums">{{ order.remainingQty | appNumber }}</dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-[var(--app-fg-muted)]">{{ 'orders.item.price' | translate }}</dt>
          <dd class="font-semibold tabular-nums">{{ order.price | appNumber }}</dd>
        </div>
        <div class="flex flex-col">
          <dt class="text-[var(--app-fg-muted)]">{{ 'orders.item.createdAt' | translate }}</dt>
          <dd class="font-semibold">{{ order.createdAt | date: 'short' }}</dd>
        </div>
      </dl>

      <footer class="flex items-center justify-end gap-2">
        <p-button
          size="small"
          severity="danger"
          [outlined]="true"
          [disabled]="!cancellable() || cancelling()"
          [loading]="cancelling()"
          (onClick)="onCancel()"
        >
          <i class="pi pi-times" pButtonIcon></i>
          <span pButtonLabel>{{ 'orders.item.cancel' | translate }}</span>
        </p-button>
      </footer>
    </article>
  `
})
export class OpenOrderItemComponent {
  private readonly _order = signal<IOrder | null>(null);
  private readonly _cancelling = signal<boolean>(false);

  @Input({ required: true })
  set order(value: IOrder) {
    this._order.set(value);
  }
  get order(): IOrder {
    const value = this._order();
    if (!value) {
      throw new Error('OpenOrderItemComponent: missing required `order` input');
    }
    return value;
  }

  @Input()
  set cancelling(value: boolean) {
    this._cancelling.set(value);
  }
  get cancelling(): boolean {
    return this._cancelling();
  }

  @Output() readonly cancel = new EventEmitter<IOrder>();

  readonly cancellable = computed<boolean>(() => {
    const order = this._order();
    if (!order) {
      return false;
    }
    return order.status === 'PENDING' || order.status === 'PARTIAL' || order.status === 'OPEN';
  });

  severity(): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    return this.toSeverity(this.order.status);
  }

  onCancel(): void {
    const order = this._order();
    if (!order) {
      return;
    }
    this.cancel.emit(order);
  }

  private toSeverity(status: OrderStatus): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
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
}
