import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class NotificationItemComponent {}
