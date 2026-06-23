import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-markets-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class MarketsListComponent {}
