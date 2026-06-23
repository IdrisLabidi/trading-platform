import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

interface INavItem {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class SidebarComponent {
  private readonly theme = inject(ThemeService);

  readonly collapsed = signal<boolean>(false);
  readonly items: readonly INavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Marchés', path: '/markets', icon: 'markets' },
    { label: 'Portefeuille', path: '/portfolio', icon: 'portfolio' },
    { label: 'Actifs', path: '/assets', icon: 'assets' },
    { label: 'Ordres', path: '/orders', icon: 'orders' },
    { label: 'Historique', path: '/history', icon: 'history' },
    { label: 'Watchlist', path: '/watchlist', icon: 'watchlist' },
    { label: 'Notifications', path: '/notifications', icon: 'notifications' },
    { label: 'Paramètres', path: '/settings', icon: 'settings' }
  ];

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  switchTheme(): void {
    this.theme.toggle();
  }
}
