import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class NotificationPanelComponent {}
