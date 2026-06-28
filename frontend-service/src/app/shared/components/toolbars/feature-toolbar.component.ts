import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-feature-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <h1>{{ title }}</h1>
    </div>
  `
})
export class FeatureToolbarComponent {
  @Input() title = '';
}
