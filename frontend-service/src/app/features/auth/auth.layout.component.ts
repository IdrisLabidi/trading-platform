import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Minimal layout used by the `/login` feature route. Renders nothing
 * but a centered `<router-outlet />` so the login page (and any future
 * public auth page, e.g. forgot-password) is presented full-bleed
 * without the authenticated shell.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="auth-layout flex min-h-screen w-screen items-center justify-center bg-[var(--app-bg)] text-[var(--app-fg)]"
    >
      <router-outlet />
    </main>
  `
})
export class AuthLayoutComponent {}
