import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

import type { IAuthService } from './auth.service.interface';
import type { ILoginCredentials } from '../models/login-credentials.model';
import type { ILoginResult } from '../models/login-result.model';
import type { IUser } from '../models/user-type.model';
import { AuthService as CoreAuthService } from '../../../core/services/auth.service';

/**
 * Concrete feature-level authentication service. It re-uses the
 * existing `CoreAuthService` (Keycloak transport) so the public
 * `IAuthService` contract can be implemented without duplicating
 * Keycloak bootstrap logic.
 *
 * HTTP calls and Keycloak business logic live in the core service.
 * This adapter is intentionally thin.
 */
@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private readonly core = inject(CoreAuthService);
  private readonly router = inject(Router);

  // --- Reactive mirrors of the core service ---------------------------

  private readonly _user = signal<IUser | null>(null);
  private readonly _ready = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed<boolean>(() => this._user() !== null);

  // --- IAuthService ---------------------------------------------------

  async init(): Promise<boolean> {
    const ok = await this.core.init();
    const u = this.core.user();
    this._user.set(u);
    this._ready.set(true);
    return ok && u !== null;
  }

  async login(credentials?: ILoginCredentials): Promise<ILoginResult> {
    if (credentials) {
      // TODO: backend authentication - placeholder for the future
      // direct-grant flow. For now we always defer to Keycloak.
      void credentials;
    }
    await this.core.login(credentials);
    const u = this.core.user();
    if (u) {
      this._user.set(u);
    }
    const redirect = (credentials?.redirect ?? '/dashboard') as string;
    const user = u ?? this.placeholderUser();
    return { user, redirect };
  }

  async logout(): Promise<void> {
    this._user.set(null);
    await this.core.logout();
    await this.router.navigate(['/login']);
  }

  async refreshToken(minValidity = 30): Promise<boolean> {
    return this.core.refreshToken(minValidity);
  }

  getAccessToken(): string | null {
    return this.core.getAccessToken();
  }

  // --- Internals -------------------------------------------------------

  private placeholderUser(): IUser {
    return {
      id: '',
      username: '',
      email: '',
      roles: []
    };
  }
}
