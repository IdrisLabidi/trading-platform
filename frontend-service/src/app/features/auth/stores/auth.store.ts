import { Injectable, computed, inject, signal } from '@angular/core';
import type { ILoginCredentials } from '../models/login-credentials.model';
import type { ILoginResult } from '../models/login-result.model';
import { AuthService } from '../services/auth.service';
import type { IAuthService } from '../services/auth.service.interface';

/**
 * Signal-based facade for the authentication feature.
 *
 * Owns three pieces of UI state on top of the `IAuthService` contract:
 *  - `loading` : true while a login/logout round-trip is in flight
 *  - `error`   : last error message produced by the feature (placeholder)
 *  - `lastResult` : last successful `ILoginResult`, kept for navigation
 *
 * The store deliberately avoids any business logic: the Keycloak
 * transport and HTTP calls live behind `IAuthService`.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly service: IAuthService = inject(AuthService);

  // --- Reactive state (signals) ---------------------------------------

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastResult = signal<ILoginResult | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastResult = this._lastResult.asReadonly();

  // --- Derived state ---------------------------------------------------

  readonly user = this.service.user;
  readonly isAuthenticated = computed<boolean>(() => this.service.isAuthenticated());
  readonly ready = this.service.ready;

  // --- Commands --------------------------------------------------------

  async login(credentials: ILoginCredentials): Promise<ILoginResult> {
    this._loading.set(true);
    this._error.set(null);
    try {
      // Placeholder validation: in the real flow the backend / Keycloak
      // is responsible for credential validation. The store surfaces
      // the contract so future business rules can be plugged in here
      // without touching the consuming component.
      const result = await this.service.login(credentials);
      this._lastResult.set(result);
      return result;
    } catch (err: unknown) {
      this._error.set(this.toMessage(err));
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async logout(): Promise<void> {
    this._loading.set(true);
    try {
      await this.service.logout();
      this._lastResult.set(null);
    } finally {
      this._loading.set(false);
    }
  }

  // --- Internals -------------------------------------------------------

  private toMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    return 'auth.invalidCredentials';
  }
}
