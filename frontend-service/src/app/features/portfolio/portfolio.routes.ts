import { Routes } from '@angular/router';

export const PORTFOLIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/portfolio-overview.component').then((m) => m.PortfolioOverviewComponent)
  }
];
