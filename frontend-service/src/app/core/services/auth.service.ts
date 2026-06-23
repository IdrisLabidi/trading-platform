import { Injectable, computed, inject, signal } from '@angular/core';
import Keycloak, {
  type KeycloakInitOptions,
  type KeycloakInstance,
  type KeycloakTokenParsed
} from 'keycloak-js';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type {
  IAuthToken,
  IKeycloakTokenParsed,
  ILoginCredentials,
  IUser
} from '../models/user.model';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Application authentication service backed by Keycloak.
 *
 * - Initializes the Keycloak adapter in `check-sso` mode by default.
 * - Exposes the current `IUser` and `IAuthToken` as signals.
 * - Provides login, logout, and token refresh primitives.
 *
 * Unknown backend methods are left as TODOs on purpose: there is no
 * dedicated user-info endpoint agreed yet.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly keycloak: KeycloakInstance = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId
  });

  private readonly _user = signal<IUser | null>(null);
  private readonly _token = signal<IAuthToken | null>(null);
  private readonly _ready = signal<boolean>(false);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  private initialized = false;

  async init(): Promise<boolean> {
    if (this.initialized) {
      return this.keycloak.authenticated ?? false;
    }
    const initOptions: KeycloakInitOptions = {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
      checkLoginIframe: false
    };
    const authenticated = await this.keycloak.init(initOptions);
    this.initialized = true;
    this._ready.set(true);
    this.bindCallbacks();
    if (authenticated) {
      this.syncFromKeycloak();
    }
    return authenticated;
  }

  async login(credentials?: ILoginCredentials): Promise<void> {
    if (credentials) {
      // TODO: backend authentication
      void credentials;
    }
    await this.keycloak.login({ redirectUri: window.location.origin + '/dashboard' });
  }

  async logout(): Promise<void> {
    this._user.set(null);
    this._token.set(null);
    await this.keycloak.logout({ redirectUri: window.location.origin + '/login' });
    await this.router.navigate(['/login']);
  }

  async refreshToken(minValidity = 30): Promise<boolean> {
    try {
      const refreshed = await this.keycloak.updateToken(minValidity);
      if (refreshed) {
        this.syncFromKeycloak();
      }
      return refreshed;
    } catch {
      await this.login();
      return false;
    }
  }

  getAccessToken(): string | null {
    return this.keycloak.token ?? null;
  }

  private bindCallbacks(): void {
    this.keycloak.onAuthSuccess = () => this.syncFromKeycloak();
    this.keycloak.onAuthRefreshSuccess = () => this.syncFromKeycloak();
    this.keycloak.onAuthLogout = () => {
      this._user.set(null);
      this._token.set(null);
    };
    this.keycloak.onTokenExpired = () => {
      void this.refreshToken();
    };
  }

  private syncFromKeycloak(): void {
    const parsed = this.keycloak.tokenParsed as KeycloakTokenParsed | undefined;
    if (!parsed) {
      return;
    }
    const payload = parsed as unknown as IKeycloakTokenParsed;
    this._user.set(this.mapUser(payload));
    this._token.set({
      accessToken: this.keycloak.token ?? '',
      refreshToken: this.keycloak.refreshToken ?? '',
      expiresIn: typeof parsed.exp === 'number' ? parsed.exp - Math.floor(Date.now() / 1000) : 0,
      tokenType: 'Bearer'
    });
  }

  private mapUser(parsed: IKeycloakTokenParsed): IUser {
    const id = parsed.sub ?? '';
    const username = parsed.preferred_username ?? readString(parsed['email']) ?? id;
    const roles = parsed.realm_access?.roles ?? [];
    return {
      id,
      username,
      email: readString(parsed['email']) ?? '',
      firstName: readString(parsed['given_name']),
      lastName: readString(parsed['family_name']),
      roles
    };
  }
}
