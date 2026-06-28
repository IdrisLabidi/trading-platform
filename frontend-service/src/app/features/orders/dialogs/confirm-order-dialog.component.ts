import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import type { OrderSide, OrderType } from '../models/order.model';

export interface IConfirmOrderDialogData {
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  readonly price: number | null;
  readonly estimatedTotal: number;
  readonly currency: string;
}

/**
 * Pre-submit confirmation dialog. Pure presentation: the parent
 * component controls visibility (e.g. via `<p-dialog [(visible)]>`)
 * and listens to the `confirm` / `cancel` outputs to drive the
 * actual API call.
 */
@Component({
  selector: 'app-confirm-order-dialog',
  standalone: true,
  imports: [
    TranslatePipe,
    ButtonModule,
    CardModule,
    TagModule,
    CurrencyFormatPipe,
    NumberFormatPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="flex items-center justify-between px-4 pt-4">
          <h2 class="text-sm font-semibold">
            {{ 'orders.confirm.title' | translate }}
          </h2>
          <p-tag
            [value]="data?.side ?? ' '"
            [severity]="data?.side === 'BUY' ? 'success' : 'danger'"
            [rounded]="true"
          ></p-tag>
        </div>
      </ng-template>

      <div class="grid grid-cols-2 gap-3 px-4 pb-4 text-sm">
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ 'orders.confirm.symbol' | translate }}</span>
          <span class="font-semibold">{{ data?.symbol }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ 'orders.confirm.type' | translate }}</span>
          <span class="font-semibold">{{ data?.type }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ 'orders.confirm.quantity' | translate }}</span>
          <span class="font-semibold tabular-nums">{{ data?.quantity | appNumber }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ 'orders.confirm.price' | translate }}</span>
          <span class="font-semibold tabular-nums">
            @if (data?.price !== null && data?.price !== undefined) {
              {{ data?.price | appNumber }}
            } @else {
              -
            }
          </span>
        </div>
        <div class="col-span-2 flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ 'orders.confirm.estimated' | translate }}</span>
          <span class="text-lg font-semibold tabular-nums">
            {{ (data?.estimatedTotal ?? 0) | appCurrency: (data?.currency ?? 'USD') }}
          </span>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex items-center justify-end gap-2 px-4 pb-4">
          <p-button
            severity="secondary"
            [outlined]="true"
            type="button"
            [disabled]="busy"
            (onClick)="onCancel()"
          >
            <span pButtonLabel>{{ 'orders.confirm.cancel' | translate }}</span>
          </p-button>
          <p-button
            [severity]="data?.side === 'BUY' ? 'success' : 'danger'"
            type="button"
            [loading]="busy"
            (onClick)="onConfirm()"
          >
            <span pButtonLabel>
              {{ (data?.side === 'BUY' ? 'orders.confirm.submitBuy' : 'orders.confirm.submitSell') | translate }}
            </span>
          </p-button>
        </div>
      </ng-template>
    </p-card>
  `
})
export class ConfirmOrderDialogComponent {
  @Input() data: IConfirmOrderDialogData | null = null;
  @Input() busy = false;

  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
