import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-feature-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class FeatureToolbarComponent {
  @Input() title = '';
}
