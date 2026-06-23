import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class SearchToolbarComponent {
  @Input() placeholder = 'Rechercher...';
}
