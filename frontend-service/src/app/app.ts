import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkspaceComponent } from './layout/workspace/workspace.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, WorkspaceComponent],
  template: `
    <app-workspace></app-workspace>
    <router-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
