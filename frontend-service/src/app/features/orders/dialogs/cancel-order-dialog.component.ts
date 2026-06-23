import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-cancel-order-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class CancelOrderDialogComponent {}
