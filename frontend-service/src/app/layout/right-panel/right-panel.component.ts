import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class RightPanelComponent {
  @Input() open = false;
}
