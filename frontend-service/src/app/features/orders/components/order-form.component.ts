import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-order-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class OrderFormComponent {}
