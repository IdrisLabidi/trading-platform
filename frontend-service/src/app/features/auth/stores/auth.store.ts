import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Thin signal-store facade around `AuthService`. Feature code can
 * inject this store to read the current user / authentication state
 * without depending on the lower-level service.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly ready = this.auth.ready;
}
