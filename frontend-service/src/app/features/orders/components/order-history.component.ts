import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-order-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class OrderHistoryComponent {}
