import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-open-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class OpenOrdersListComponent {}
