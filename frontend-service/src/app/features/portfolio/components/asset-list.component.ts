import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class AssetListComponent {}
