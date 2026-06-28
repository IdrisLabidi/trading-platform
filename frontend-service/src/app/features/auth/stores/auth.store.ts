import { Injectable, computed, inject, signal } from '@angular/core';

import type { ILoginCredentials } from '../models/login-credentials.model';
import type { ILoginResult } from '../models/login-result.model';
import type { IUser } from '../models/user-type.model';
import { AuthService } from '../services/auth.service';
import type { IAuthService } from '../services/auth.service.interface';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Signal-based facade for the authentication feature.
 *
 * Owns UI-only state on top of the `IAuthService` contract:
 *  - `loading`  : `true` while a login/logout round-trip is in flight
 *  - `error`    : last error message produced by the feature
 *  - `lastResult`: last successful `ILoginResult`, kept for navigation
 *
 * The store delegates every business / network concern to the
 * `AuthService` so this class stays declarative. Errors caught from
 * the service are surfaced through `NotificationService` so the user
 * always sees a toast in addition to the inline form error.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly service: IAuthService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  // --- Reactive state (signals) ---------------------------------------

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastResult = signal<ILoginResult | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastResult = this._lastResult.asReadonly();

  // --- Derived state ----------------------------------------------------

  readonly user = computed<IUser | null>(() => this.service.user());
  readonly isAuthenticated = computed<boolean>(() => this.service.isAuthenticated());
  readonly ready = computed<boolean>(() => this.service.ready());

  // --- Commands ---------------------------------------------------------

  /**
   * Trigger a login round-trip. Resolves with the `ILoginResult`
   * returned by the service so the calling component can navigate
   * to the post-login redirect.
   */
  async login(credentials: ILoginCredentials): Promise<ILoginResult> {
    if (this._loading()) {
      throw new Error('auth.error.busy');
    }
    this._loading.set(true);
    this._error.set(null);
    try {
      const result = await this.service.login(credentials);
      this._lastResult.set(result);
      return result;
    } catch (err: unknown) {
      const message = this.toMessage(err);
      this._error.set(message);
      this.notifications.error('auth.notifications.error.title', message);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Terminate the current session. The actual redirect is owned by
   * Keycloak (via `core.AuthService.logout`) so this method simply
   * clears the local signal state and lets Keycloak navigate.
   */
  async logout(): Promise<void> {
    this._loading.set(true);
    try {
      await this.service.logout();
      this._lastResult.set(null);
      this._error.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  /** Wrap `IAuthService.refreshToken` so the feature store remains the entry point. */
  async refreshToken(minValidity = 30): Promise<boolean> {
    return this.service.refreshToken(minValidity);
  }

  /** Returns the current access token, or `null` when not authenticated. */
  getAccessToken(): string | null {
    return this.service.getAccessToken();
  }

  /** Initialize the underlying transport (Keycloak init). */
  async init(): Promise<boolean> {
    return this.service.init();
  }

  /** Drop the cached last-result / error after a successful navigation. */
  clearLastResult(): void {
    this._lastResult.set(null);
  }

  /** Manually clear the error banner (e.g. on retry). */
  clearError(): void {
    this._error.set(null);
  }

  // --- Internals -------------------------------------------------------

  private toMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    return 'auth.invalidCredentials';
  }
}
