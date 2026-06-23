import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-count-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class CountBadgeComponent {
  @Input() count = 0;
}
