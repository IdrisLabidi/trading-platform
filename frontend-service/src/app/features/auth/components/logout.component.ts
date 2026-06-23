import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
    </div>
  `
})
export class LogoutComponent {
  private readonly auth = inject(AuthService);

  constructor() {
    void this.auth.logout();
  }
}
