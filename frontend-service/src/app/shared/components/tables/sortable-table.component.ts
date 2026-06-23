import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

export interface ISortableTableColumn<T> {
  readonly field: keyof T & string;
  readonly header: string;
  readonly sortable?: boolean;
}

@Component({
  selector: 'app-sortable-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class SortableTableComponent<T> {
  @Input() columns: readonly ISortableTableColumn<T>[] = [];
  @Input() rows: readonly T[] = [];
}
