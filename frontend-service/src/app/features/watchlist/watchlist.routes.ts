import { type Routes } from '@angular/router';

export const WATCHLIST_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/watchlist-manager.component').then((m) => m.WatchlistManagerComponent),
    title: 'watchlist.manager.title'
  },
  {
    path: 'manager',
    loadComponent: () =>
      import('./components/watchlist-manager.component').then((m) => m.WatchlistManagerComponent),
    title: 'watchlist.manager.title'
  }
];
