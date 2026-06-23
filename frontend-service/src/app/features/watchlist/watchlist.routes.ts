import { Routes } from '@angular/router';

export const WATCHLIST_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/watchlist-manager.component').then((m) => m.WatchlistManagerComponent)
  }
];
