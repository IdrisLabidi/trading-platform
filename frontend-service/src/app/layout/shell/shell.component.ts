import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { RightPanelComponent } from '../right-panel/right-panel.component';
import { WorkspaceComponent } from '../workspace/workspace.component';

/**
 * Top-level application shell. Hosts the persistent layout (topbar,
 * sidebar, right panel, workspace) and the PrimeNG toast/confirm
 * dialog providers required by the rest of the application.
 *
 * Owns two pieces of pure UI state:
 *  - `sidebarPinned`  : whether the navigation rail is pinned open
 *  - `rightPanelOpen` : whether the optional trading panel is visible
 *
 * Both are surfaced to the topbar via `model()` two-way bindings so
 * the user can toggle them from the chrome.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    SidebarComponent,
    TopbarComponent,
    RightPanelComponent,
    WorkspaceComponent,
    ToastModule,
    ConfirmDialogModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="grid h-screen w-screen overflow-hidden bg-[var(--app-bg)] text-[var(--app-fg)]"
      style="grid-template-rows: auto 1fr; grid-template-columns: auto 1fr minmax(0, 20rem); grid-template-areas: 'topbar topbar topbar' 'sidebar workspace rightpanel';"
    >
      <app-topbar
        style="grid-area: topbar;"
        class="z-20"
        [(sidebarPinned)]="sidebarPinned"
        [(rightPanelOpen)]="rightPanelOpen"
      ></app-topbar>

      <app-sidebar
        style="grid-area: sidebar;"
        class="z-0"
        [(pinned)]="sidebarPinned"
      ></app-sidebar>

      <app-workspace
        style="grid-area: workspace;"
        class="z-0 min-w-0 overflow-hidden"
      ></app-workspace>

      <app-right-panel
        style="grid-area: rightpanel;"
        class="z-0"
        [(open)]="rightPanelOpen"
      ></app-right-panel>
    </div>

    <p-toast position="top-right"></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `
})
export class ShellComponent {
  readonly sidebarPinned = signal<boolean>(false);
  readonly rightPanelOpen = signal<boolean>(false);
}