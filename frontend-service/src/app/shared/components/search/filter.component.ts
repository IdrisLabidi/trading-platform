import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export interface IFilterOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class FilterComponent {
  @Input() options: readonly IFilterOption[] = [];
}
