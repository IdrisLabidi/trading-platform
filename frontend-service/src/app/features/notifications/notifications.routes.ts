import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/notification-panel.component').then((m) => m.NotificationPanelComponent)
  }
];
