import { Routes } from '@angular/router';

export const HISTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/trade-history.component').then((m) => m.TradeHistoryComponent)
  },
  {
    path: ':tradeId',
    loadComponent: () =>
      import('./components/trade-details.component').then((m) => m.TradeDetailsComponent)
  }
];
