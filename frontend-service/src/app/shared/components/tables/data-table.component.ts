import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class DataTableComponent<T> {
  @Input() columns: readonly string[] = [];
  @Input() rows: readonly T[] = [];
}
