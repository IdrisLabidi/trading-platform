import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export interface ISelectOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class SelectComponent {
  @Input() options: readonly ISelectOption[] = [];
  @Input() placeholder = '';
}
