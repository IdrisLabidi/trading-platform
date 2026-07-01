import { type Routes } from '@angular/router';
import { authMatchGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing').then((m) => m.Landing)
  },
  {
    path: 'oauth/callback',
    loadComponent: () =>
      import('./features/auth/oauth-callback.component').then(
        (m) => m.OauthCallbackComponent
      )
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
