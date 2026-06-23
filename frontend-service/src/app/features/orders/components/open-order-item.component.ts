import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-open-order-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class OpenOrderItemComponent {}
