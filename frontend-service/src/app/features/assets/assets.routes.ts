import { Routes } from '@angular/router';

export const ASSETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/asset-catalog.component').then((m) => m.AssetCatalogComponent)
  },
  {
    path: ':symbol',
    loadComponent: () =>
      import('./components/asset-details.component').then((m) => m.AssetDetailsComponent)
  }
];
