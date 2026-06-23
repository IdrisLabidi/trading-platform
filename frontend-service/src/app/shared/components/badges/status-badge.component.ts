import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class StatusBadgeComponent {
  @Input() status: BadgeStatus = 'neutral';
  @Input() label = '';
}
