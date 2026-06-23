import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { ShellComponent } from './shell.component';

export const SHELL_ROUTES: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('../../features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
      },
      {
        path: 'markets',
        loadChildren: () =>
          import('../../features/markets/markets.routes').then((m) => m.MARKETS_ROUTES)
      },
      {
        path: 'portfolio',
        loadChildren: () =>
          import('../../features/portfolio/portfolio.routes').then((m) => m.PORTFOLIO_ROUTES)
      },
      {
        path: 'assets',
        loadChildren: () =>
          import('../../features/assets/assets.routes').then((m) => m.ASSETS_ROUTES)
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('../../features/orders/orders.routes').then((m) => m.ORDERS_ROUTES)
      },
      {
        path: 'history',
        loadChildren: () =>
          import('../../features/history/history.routes').then((m) => m.HISTORY_ROUTES)
      },
      {
        path: 'watchlist',
        loadChildren: () =>
          import('../../features/watchlist/watchlist.routes').then((m) => m.WATCHLIST_ROUTES)
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('../../features/notifications/notifications.routes').then(
            (m) => m.NOTIFICATIONS_ROUTES
          )
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('../../features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
