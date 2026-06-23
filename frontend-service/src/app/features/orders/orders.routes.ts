import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/order-history.component').then((m) => m.OrderHistoryComponent)
  },
  {
    path: 'open',
    loadComponent: () =>
      import('./components/open-orders-list.component').then((m) => m.OpenOrdersListComponent)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/order-form.component').then((m) => m.OrderFormComponent)
  }
];
