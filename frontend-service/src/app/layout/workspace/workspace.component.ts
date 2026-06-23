import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from '../../core/services/loading.service';

/**
 * Main content area. Shows an indeterminate PrimeNG progress bar while
 * HTTP requests are in flight, and renders the routed feature view
 * below it.
 */
@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [RouterOutlet, ProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex h-full w-full flex-col">
      @if (loading.isLoading()) {
        <p-progressBar mode="indeterminate"></p-progressBar>
      }
      <div class="flex-1 overflow-auto p-4 sm:p-6">
        <router-outlet />
      </div>
    </section>
  `
})
export class WorkspaceComponent {
  readonly loading = inject(LoadingService);
}