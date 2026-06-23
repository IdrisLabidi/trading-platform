import { type Routes } from '@angular/router';
import { authMatchGuard } from '../../core/guards/auth.guard';
import { roleMatchGuard } from '../../core/guards/role.guard';
import { ShellComponent } from './shell.component';

/**
 * Top-level authenticated routes. Every lazy feature is wrapped with
 * `authMatchGuard` so anonymous users are redirected to `/login`
 * before the chunk is even downloaded.
 *
 * Trader-only features (orders, portfolio) additionally require
 * `roleMatchGuard` which checks the user roles against
 * `environment.traderRoles`.
 */
export const SHELL_ROUTES: Routes = [
  {
    path: '',
    component: ShellComponent,
    canMatch: [authMatchGuard],
    children: [
      {
        path: 'dashboard',
        canMatch: [authMatchGuard],
        loadChildren: () =>
          import('../../features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
      },
      {
        path: 'markets',
        canMatch: [authMatchGuard],
        loadChildren: () =>
          import('../../features/markets/markets.routes').then((m) => m.MARKETS_ROUTES)
      },
      {
        path: 'portfolio',
        canMatch: [authMatchGuard, roleMatchGuard],
        data: { roles: ['trader'] },
        loadChildren: () =>
          import('../../features/portfolio/portfolio.routes').then((m) => m.PORTFOLIO_ROUTES)
      },
      {
        path: 'assets',
        canMatch: [authMatchGuard],
        loadChildren: () =>
          import('../../features/assets/assets.routes').then((m) => m.ASSETS_ROUTES)
      },
      {
        path: 'orders',
        canMatch: [authMatchGuard, roleMatchGuard],
        data: { roles: ['trader'] },
        loadChildren: () =>
          import('../../features/orders/orders.routes').then((m) => m.ORDERS_ROUTES)
      },
      {
        path: 'history',
        canMatch: [authMatchGuard],
        loadChildren: () =>
          import('../../features/history/history.routes').then((m) => m.HISTORY_ROUTES)
      },
      {
        path: 'watchlist',
        canMatch: [authMatchGuard],
        loadChildren: () =>
          import('../../features/watchlist/watchlist.routes').then((m) => m.WATCHLIST_ROUTES)
      },
      {
        path: 'notifications',
        canMatch: [authMatchGuard],
        loadChildren: () =>
          import('../../features/notifications/notifications.routes').then(
            (m) => m.NOTIFICATIONS_ROUTES
          )
      },
      {
        path: 'settings',
        canMatch: [authMatchGuard],
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
