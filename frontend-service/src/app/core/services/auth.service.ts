import { Injectable, inject, signal, computed } from '@angular/core';
import type { IUser, ILoginCredentials, IAuthToken } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<IUser | null>(null);
  private readonly _token = signal<IAuthToken | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  login(credentials: ILoginCredentials): Promise<void> {
    void credentials;
    return Promise.resolve();
  }

  logout(): Promise<void> {
    this._user.set(null);
    this._token.set(null);
    return Promise.resolve();
  }

  refreshToken(): Promise<void> {
    return Promise.resolve();
  }
}

export const AUTH_SERVICE = Symbol.for('AuthService');
export type AuthServiceToken = typeof AUTH_SERVICE;
export const injectAuthService = (): AuthService => inject(AuthService);
