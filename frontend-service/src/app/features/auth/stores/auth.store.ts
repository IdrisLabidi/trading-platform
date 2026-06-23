import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);
  readonly user = this.auth.user;
  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
}
