import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Logout landing component. Triggers a full Keycloak logout on init
 * and never renders anything.
 */
@Component({
  selector: 'app-logout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``
})
export class LogoutComponent implements OnInit {
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    void this.auth.logout();
  }
}
