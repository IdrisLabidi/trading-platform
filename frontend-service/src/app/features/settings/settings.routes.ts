import { type Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/settings.component').then((m) => m.SettingsComponent),
    title: 'settings.title',
    children: [
      {
        path: 'theme',
        loadComponent: () =>
          import('./components/theme-settings.component').then((m) => m.ThemeSettingsComponent),
        title: 'settings.theme.title'
      },
      {
        path: 'language',
        loadComponent: () =>
          import('./components/language-settings.component').then((m) => m.LanguageSettingsComponent),
        title: 'settings.language.title'
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./components/profile-settings.component').then((m) => m.ProfileSettingsComponent),
        title: 'settings.profile.title'
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'theme'
      }
    ]
  }
];
