import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);

  readonly user = this.auth.user;
  readonly currentTheme = this.theme.theme;

  toggleTheme(): void {
    this.theme.toggle();
  }

  logout(): void {
    void this.auth.logout();
  }
}
