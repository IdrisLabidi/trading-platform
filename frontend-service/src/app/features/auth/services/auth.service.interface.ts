import type { IUser } from '../models/user-type.model';
import type { ILoginCredentials } from '../models/login-credentials.model';
import type { ILoginResult } from '../models/login-result.model';

/**
 * Public surface of the authentication feature. Feature code should
 * depend on this abstraction instead of the concrete `AuthService`
 * implementation so the underlying transport (Keycloak, direct grant,
 * custom backend) can be swapped without touching consumers.
 */
export interface IAuthService {
  /** Initialize the underlying transport (Keycloak init, etc.). */
  init(): Promise<boolean>;

  /**
   * Run a login attempt. When `credentials` is provided, the call
   * falls back to a credentials-based flow (development only). The
   * default behaviour is to trigger a Keycloak redirect.
   */
  login(credentials?: ILoginCredentials): Promise<ILoginResult>;

  /** Terminate the current session and route back to the login page. */
  logout(): Promise<void>;

  /** Force-refresh the underlying access token. */
  refreshToken(minValidity?: number): Promise<boolean>;

  /** Returns the current access token, or `null` when not authenticated. */
  getAccessToken(): string | null;

  /** Current authenticated user, or `null` when not signed in. */
  readonly user: () => IUser | null;

  /** `true` once `init()` has resolved (success or failure). */
  readonly ready: () => boolean;

  /** `true` when a user is currently signed in. */
  readonly isAuthenticated: () => boolean;
}
