import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-confirm-order-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class ConfirmOrderDialogComponent {}
