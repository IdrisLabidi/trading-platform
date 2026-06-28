import { type Routes } from '@angular/router';

export const PORTFOLIO_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/portfolio-overview.component').then((m) => m.PortfolioOverviewComponent),
    title: 'portfolio.overview.title'
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./components/portfolio-overview.component').then((m) => m.PortfolioOverviewComponent),
    title: 'portfolio.overview.title'
  },
  {
    path: 'positions/:symbol',
    loadComponent: () =>
      import('./components/position-details.component').then((m) => m.PositionDetailsComponent),
    title: 'portfolio.details.title'
  }
];
