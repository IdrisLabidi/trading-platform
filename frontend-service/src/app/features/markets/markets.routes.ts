import { Routes } from '@angular/router';

export const MARKETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/markets-list.component').then((m) => m.MarketsListComponent)
  },
  {
    path: ':symbol',
    loadComponent: () =>
      import('./components/market-details.component').then((m) => m.MarketDetailsComponent)
  }
];
