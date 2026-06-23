import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() error?: string;
}
