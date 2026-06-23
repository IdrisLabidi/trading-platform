import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class PanelComponent {
  @Input() title = '';
  @Input() collapsible = false;
}
