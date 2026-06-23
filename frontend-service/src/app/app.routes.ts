import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '',
    loadChildren: () =>
      import('./layout/shell/shell.routes').then((m) => m.SHELL_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
