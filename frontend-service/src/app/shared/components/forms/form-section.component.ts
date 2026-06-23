import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-form-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class FormSectionComponent {
  @Input() title = '';
  @Input() description?: string;
}
