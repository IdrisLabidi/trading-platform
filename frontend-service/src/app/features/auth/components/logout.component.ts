import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { AuthStore } from '../stores/auth.store';

/**
 * Logout landing component. Triggers a full session termination on
 * init through the feature `AuthStore` and never renders anything
 * useful (the user is redirected back to `/login` by the store).
 */
@Component({
  selector: 'app-logout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``
})
export class LogoutComponent implements OnInit {
  private readonly auth = inject(AuthStore);

  ngOnInit(): void {
    void this.auth.logout();
  }
}
