import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-position-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class PositionDetailsComponent {}
