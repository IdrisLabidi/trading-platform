import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-information-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class InformationDialogComponent {
  @Input() title = '';
  @Input() content = '';
}
