import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NumberFormatPipe } from '../../../shared/pipes/number-format.pipe';
import type { IOrder } from '../models/order.model';

/**
 * Pre-cancel confirmation dialog. Lists the impacted order summary
 * (symbol, side, quantity, status) and emits `confirm` / `cancel`
 * events to drive the actual cancellation.
 */
@Component({
  selector: 'app-cancel-order-dialog',
  standalone: true,
  imports: [TranslatePipe, ButtonModule, CardModule, TagModule, CurrencyFormatPipe, NumberFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-card>
      <ng-template pTemplate="header">
        <div class="flex items-center justify-between px-4 pt-4">
          <h2 class="text-sm font-semibold">
            {{ ''orders.cancel.title'' | translate }}
          </h2>
          <p-tag
            [value]="order?.status ?? '' ''"
            severity="warn"
            [rounded]="true"
          ></p-tag>
        </div>
      </ng-template>

      <div class="grid grid-cols-2 gap-3 px-4 pb-4 text-sm">
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ ''orders.cancel.symbol'' | translate }}</span>
          <span class="font-semibold">{{ order?.symbol }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ ''orders.cancel.side'' | translate }}</span>
          <span
            class="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
            [class.bg-[var(--app-success)]]="order?.side === ''BUY''"
            [class.bg-[var(--app-danger)]]="order?.side === ''SELL''"
            [class.text-white]="true"
          >
            {{ order?.side }}
          </span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ ''orders.cancel.quantity'' | translate }}</span>
          <span class="font-semibold tabular-nums">{{ order?.quantity | appNumber }}</span>
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-[var(--app-fg-muted)]">{{ ''orders.cancel.price'' | translate }}</span>
          <span class="font-semibold tabular-nums">{{ order?.price | appNumber }}</span>
        </div>
      </div>

      <p class="px-4 text-xs text-[var(--app-fg-muted)]">
        {{ ''orders.cancel.warning'' | translate }}
      </p>

      <ng-template pTemplate="footer">
        <div class="flex items-center justify-end gap-2 px-4 pb-4">
          <p-button
            severity="secondary"
            [outlined]="true"
            type="button"
            [disabled]="busy"
            (onClick)="onCancel()"
          >
            <span pButtonLabel>{{ ''orders.cancel.keep'' | translate }}</span>
          </p-button>
          <p-button
            severity="danger"
            type="button"
            [loading]="busy"
            (onClick)="onConfirm()"
          >
            <span pButtonLabel>{{ ''orders.cancel.confirm'' | translate }}</span>
          </p-button>
        </div>
      </ng-template>
    </p-card>
  `
})
export class CancelOrderDialogComponent {
  @Input() order: IOrder | null = null;
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
