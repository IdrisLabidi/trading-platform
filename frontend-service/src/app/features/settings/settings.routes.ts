import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/settings.component').then((m) => m.SettingsComponent),
    children: [
      {
        path: 'theme',
        loadComponent: () =>
          import('./components/theme-settings.component').then((m) => m.ThemeSettingsComponent)
      },
      {
        path: 'language',
        loadComponent: () =>
          import('./components/language-settings.component').then((m) => m.LanguageSettingsComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile-settings.component').then((m) => m.ProfileSettingsComponent)
      },
      {
        path: '',
        redirectTo: 'theme',
        pathMatch: 'full'
      }
    ]
  }
];
