import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export interface ITab {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'app-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class TabComponent {
  @Input() tabs: readonly ITab[] = [];
  @Input() activeId = '';
}
