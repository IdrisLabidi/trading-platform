import { type Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/login.component').then((m) => m.LoginComponent),
    title: 'auth.login'
  },
  {
    path: 'logout',
    loadComponent: () =>
      import('./components/logout.component').then((m) => m.LogoutComponent),
    title: 'auth.logout'
  }
];
