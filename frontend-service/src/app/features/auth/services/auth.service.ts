import { Injectable, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
 * This adapter is in charge of:
 *   - keeping the feature signals in sync with the core signals;
 *   - resolving the post-login `redirect` query parameter (set by
 *     `authMatchGuard` when an anonymous user tries to reach a
 *     protected page);
 *   - clearing local state on logout so the UI does not briefly
 *     show a "logged in" view before the Keycloak redirect kicks in.
 */
@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private readonly core = inject(CoreAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Reactive mirrors of the core service ---------------------------

  private readonly _user = signal<IUser | null>(null);
  private readonly _ready = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed<boolean>(() => this._user() !== null);

  // --- IAuthService ---------------------------------------------------

  async init(): Promise<boolean> {
    const ok = await this.core.init();
    this.syncFromCore();
    this._ready.set(true);
    return ok && this._user() !== null;
  }

  /**
   * Trigger the Keycloak login round-trip. The optional `credentials`
   * parameter is reserved for the future direct-grant fallback; for
   * now it is acknowledged but unused.
   *
   * The `redirect` query parameter (set by `authMatchGuard`) is
   * honoured so the user lands back on the page they originally
   * requested. When absent, the default landing page is used.
   */
  async login(credentials?: ILoginCredentials): Promise<ILoginResult> {
    if (credentials) {
      // TODO: backend authentication - placeholder for the future
      // direct-grant flow. For now we always defer to Keycloak.
      void credentials;
    }
    const target = this.resolveRedirect(credentials?.redirect);
    // Refresh the local state in case the user was already
    // authenticated (Keycloak `check-sso` happy path).
    this.syncFromCore();
    const redirect = await this.core.login(target);
    // For the synchronous happy-path we need a placeholder user.
    const user = this._user() ?? this.placeholderUser();
    return { user, redirect };
  }

  /**
   * Terminate the current session. Clears the local signal state
   * so the UI updates immediately, then hands off to Keycloak which
   * performs the actual redirect to the Keycloak end-session
   * endpoint.
   */
  async logout(): Promise<void> {
    this._user.set(null);
    this._ready.set(true);
    await this.core.logout();
  }

  async refreshToken(minValidity = 30): Promise<boolean> {
    const refreshed = await this.core.refreshToken(minValidity);
    this.syncFromCore();
    return refreshed;
  }

  getAccessToken(): string | null {
    return this.core.getAccessToken();
  }

  // --- Internals -------------------------------------------------------

  private syncFromCore(): void {
    const user = this.core.user();
    if (user) {
      this._user.set(user);
    }
    this._ready.set(this.core.ready());
  }

  /**
   * Resolve the post-login redirect URL. The activated route is
   * preferred (it carries the query params that survived the
   * Keycloak round-trip) and falls back to the credentials payload
   * or the dashboard.
   */
  private resolveRedirect(override?: string): string {
    const query = this.route.snapshot.queryParamMap.get('redirect');
    const candidate = override ?? query ?? '/dashboard';
    return this.isSafeRedirect(candidate) ? candidate : '/dashboard';
  }

  /**
   * Reject anything that is not a same-origin relative path to
   * avoid open-redirect attacks through the `redirect` query param.
   */
  private isSafeRedirect(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    if (!value.startsWith('/')) {
      return false;
    }
    if (value.startsWith('//')) {
      return false;
    }
    return true;
  }

  private placeholderUser(): IUser {
    return {
      id: '',
      username: '',
      email: '',
      roles: []
    };
  }
}
