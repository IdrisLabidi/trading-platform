import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-order-confirmation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class OrderConfirmationDialogComponent {}
