import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { RightPanelComponent } from '../right-panel/right-panel.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, RightPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <app-topbar></app-topbar>
      <app-sidebar></app-sidebar>
      <main>
        <router-outlet></router-outlet>
      </main>
      <app-right-panel></app-right-panel>
    </div>
  `
})
export class ShellComponent {}
