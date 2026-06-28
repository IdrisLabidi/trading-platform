import { type Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/order-history.component').then((m) => m.OrderHistoryComponent),
    title: 'orders.history.title'
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./components/order-history.component').then((m) => m.OrderHistoryComponent),
    title: 'orders.history.title'
  },
  {
    path: 'open',
    loadComponent: () =>
      import('./components/open-orders-list.component').then((m) => m.OpenOrdersListComponent),
    title: 'orders.open.title'
  },
  {
    path: 'book',
    loadComponent: () =>
      import('./components/order-book.component').then((m) => m.OrderBookComponent),
    title: 'orders.book.title'
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/order-form.component').then((m) => m.OrderFormComponent),
    title: 'orders.form.title'
  }
];
