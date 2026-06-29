import { type Routes } from '@angular/router';
import { authMatchGuard } from './core/guards';

/**
 * Root routes:
 * - `/login` is public and rendered through the dedicated
 *   `AuthLayoutComponent` (full-bleed, no shell chrome).
 * - Everything else goes through the authenticated shell, which in
 *   turn enforces the auth + role guards for each lazy feature.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/auth.layout.component').then(
        (m) => m.AuthLayoutComponent
      ),
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '',
    canMatch: [authMatchGuard],
    loadChildren: () =>
      import('./layout/shell/shell.routes').then((m) => m.SHELL_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
