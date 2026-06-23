import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class ConfirmationDialogComponent {
  @Input() title = '';
  @Input() message = '';
}
