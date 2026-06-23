import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class SummaryCardComponent {
  @Input() label = '';
  @Input() value: number | string = '';
}
