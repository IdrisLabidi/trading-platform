import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-status-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class StatusIndicatorComponent {
  @Input() status: 'online' | 'offline' | 'busy' | 'idle' = 'offline';
}
