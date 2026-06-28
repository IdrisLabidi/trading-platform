import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthStore } from '../stores/auth.store';

/**
 * Logout landing component. Triggered by the `/logout` route so the
 * shell sidebar can deep-link to a dedicated endpoint. Initiates a
 * full session termination through the feature `AuthStore` and
 * shows a small waiting card until the Keycloak end-session redirect
 * is triggered.
 */
@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [TranslatePipe, ProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex min-h-screen w-full items-center justify-center bg-[var(--app-bg)] p-4 text-[var(--app-fg)] sm:p-6"
    >
      <div
        class="flex w-full max-w-md flex-col items-center gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-6 text-center shadow-sm"
      >
        <i class="pi pi-sign-out text-3xl text-[var(--app-fg-muted)]" aria-hidden="true"></i>
        <h2 class="text-base font-semibold">
          {{ 'auth.logout.title' | translate }}
        </h2>
        <p class="text-sm text-[var(--app-fg-muted)]">
          {{ 'auth.logout.subtitle' | translate }}
        </p>
        @if (authStore.loading()) {
          <p-progressSpinner
            styleClass="h-6 w-6"
            strokeWidth="6"
            ariaLabel="loading"
          ></p-progressSpinner>
        }
      </div>
    </div>
  `
})
export class LogoutComponent implements OnInit {
  readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    void this.authStore.logout();
  }
}
