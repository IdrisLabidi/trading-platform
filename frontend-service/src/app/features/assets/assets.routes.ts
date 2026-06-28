import { type Routes } from '@angular/router';

export const ASSETS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./components/asset-catalog.component').then((m) => m.AssetCatalogComponent),
    title: 'assets.catalog.title'
  },
  {
    path: 'catalog',
    loadComponent: () =>
      import('./components/asset-catalog.component').then((m) => m.AssetCatalogComponent),
    title: 'assets.catalog.title'
  },
  {
    path: ':symbol',
    loadComponent: () =>
      import('./components/asset-details.component').then((m) => m.AssetDetailsComponent),
    title: 'assets.details.title'
  }
];
