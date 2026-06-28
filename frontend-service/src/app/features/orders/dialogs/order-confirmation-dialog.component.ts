import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import type { IOrderResponse } from '../models/order.model';

/**
 * Post-submit confirmation dialog. Shows the order id + status
 * returned by the backend and lets the user close the modal or
 * jump to the open-orders list.
 */
@Component({
  selector: 'app-order-confirmation-dialog',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    ButtonModule,
    CardModule,
    TagModule,
    MessageModule,
    CurrencyFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="flex items-center justify-between px-4 pt-4">
          <h2 class="text-sm font-semibold">
            {{ 'orders.confirmation.title' | translate }}
          </h2>
          @if (response) {
            <p-tag
              [value]="response.status"
              [severity]="severity()"
              [rounded]="true"
            ></p-tag>
          }
        </div>
      </ng-template>

      <div class="flex flex-col gap-3 px-4 pb-4 text-sm">
        <p-message severity="success" [text]="'orders.confirmation.submitted' | translate"></p-message>

        <dl class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex flex-col">
            <dt class="text-[var(--app-fg-muted)]">{{ 'orders.confirmation.id' | translate }}</dt>
            <dd class="font-mono text-sm">{{ response?.id }}</dd>
          </div>
          <div class="flex flex-col">
            <dt class="text-[var(--app-fg-muted)]">{{ 'orders.confirmation.createdAt' | translate }}</dt>
            <dd class="font-semibold">{{ response?.createdAt | date: 'short' }}</dd>
          </div>
          @if (estimatedTotal !== null) {
            <div class="col-span-2 flex flex-col">
              <dt class="text-[var(--app-fg-muted)]">{{ 'orders.confirmation.estimated' | translate }}</dt>
              <dd class="text-base font-semibold tabular-nums">
                {{ estimatedTotal | appCurrency: currency }}
              </dd>
            </div>
          }
        </dl>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex items-center justify-end gap-2 px-4 pb-4">
          <p-button
            severity="secondary"
            [outlined]="true"
            type="button"
            (onClick)="onClose()"
          >
            <span pButtonLabel>{{ 'orders.confirmation.close' | translate }}</span>
          </p-button>
          <p-button
            type="button"
            (onClick)="onViewOrders()"
          >
            <span pButtonLabel>{{ 'orders.confirmation.viewOrders' | translate }}</span>
          </p-button>
        </div>
      </ng-template>
    </p-card>
  `
})
export class OrderConfirmationDialogComponent {
  private readonly _response = signal<IOrderResponse | null>(null);

  @Input()
  set response(value: IOrderResponse | null) {
    this._response.set(value);
  }
  get response(): IOrderResponse | null {
    return this._response();
  }

  @Input() estimatedTotal: number | null = null;
  @Input() currency = 'USD';

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly viewOrders = new EventEmitter<void>();

  readonly severity = computed<'success' | 'warn' | 'danger' | 'info' | 'secondary'>(() => {
    const response = this._response();
    if (!response) {
      return 'secondary';
    }
    switch (response.status) {
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
  });

  onClose(): void {
    this.close.emit();
  }

  onViewOrders(): void {
    this.viewOrders.emit();
  }
}
