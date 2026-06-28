import { Injectable, computed, signal } from '@angular/core';
import Keycloak, {
  type KeycloakInitOptions,
  type KeycloakInstance,
  type KeycloakTokenParsed
} from 'keycloak-js';
import { environment } from '../../../environments/environment';
import type {
  IAuthToken,
  IKeycloakTokenParsed,
  IUser
} from '../models/user.model';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Application authentication service backed by Keycloak.
 *
 * Responsibilities:
 *   - Bootstrap the Keycloak adapter in `check-sso` mode so a
 *     returning user does not see the login screen if their session
 *     is still valid.
 *   - Expose the current `IUser` and `IAuthToken` as signals so the
 *     feature stores and the HTTP interceptor can read them without
 *     depending on Keycloak internals.
 *   - Provide `login(redirect)` / `logout()` primitives that resolve
 *     a same-origin redirect target.
 *   - Auto-refresh the access token on `onTokenExpired`.
 *
 * Navigation is delegated to the caller (the auth feature) so the
 * core service stays router-agnostic and can be reused by other
 * apps (e.g. the storybook harness).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
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

  /**
   * Trigger the Keycloak login round-trip. The optional `redirect`
   * parameter lets the caller pick the post-login landing page.
   * The caller is responsible for sanitising the value to avoid
   * open-redirect attacks.
   */
  async login(redirect?: string): Promise<string> {
    const target = this.composeRedirect(redirect);
    await this.keycloak.login({ redirectUri: target });
    return target;
  }

  /**
   * Terminate the current Keycloak session and clear the local
   * signal state. The caller is expected to navigate to the login
   * page after the redirect URI is honoured by Keycloak.
   */
  async logout(): Promise<void> {
    const redirectUri = window.location.origin + '/login';
    this._user.set(null);
    this._token.set(null);
    await this.keycloak.logout({ redirectUri });
  }

  /** Force-refresh the underlying access token. */
  async refreshToken(minValidity = 30): Promise<boolean> {
    try {
      const refreshed = await this.keycloak.updateToken(minValidity);
      if (refreshed) {
        this.syncFromKeycloak();
      }
      return refreshed;
    } catch {
      // The refresh failed (session expired). Trigger the login flow
      // so the user can re-authenticate. The Keycloak redirect will
      // bring them back to the post-login landing page.
      await this.keycloak.login({ redirectUri: window.location.origin + '/dashboard' });
      return false;
    }
  }

  /** Returns the current access token, or `null` when not authenticated. */
  getAccessToken(): string | null {
    return this.keycloak.token ?? null;
  }

  /** Returns the underlying Keycloak instance (used by the feature store to compose redirects). */
  get instance(): KeycloakInstance {
    return this.keycloak;
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
      this._user.set(null);
      this._token.set(null);
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

  /**
   * Compose a same-origin redirect URI from the caller-provided
   * value. Returns the dashboard when the input is missing or
   * unsafe (anything that does not start with a single slash).
   */
  private composeRedirect(value: string | undefined): string {
    const fallback = window.location.origin + '/dashboard';
    if (!value || typeof value !== 'string') {
      return fallback;
    }
    if (!value.startsWith('/') || value.startsWith('//')) {
      return fallback;
    }
    return window.location.origin + value;
  }
}
