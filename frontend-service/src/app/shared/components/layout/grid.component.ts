import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class GridComponent {
  @Input() cols = 1;
  @Input() gap: 'sm' | 'md' | 'lg' = 'md';
}
