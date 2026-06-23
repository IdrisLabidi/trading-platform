import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class SearchComponent {
  @Input() placeholder = 'Rechercher...';
}
