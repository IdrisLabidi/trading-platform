import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-data-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class DataCardComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
