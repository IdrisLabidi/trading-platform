import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class RecentActivityComponent {}
