export interface IUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles: readonly string[];
}

export interface ILoginCredentials {
  readonly username: string;
  readonly password: string;
}

export interface IAuthToken {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: string;
}

export interface IKeycloakTokenParsed {
  readonly sub: string;
  readonly preferred_username?: string;
  readonly email?: string;
  readonly given_name?: string;
  readonly family_name?: string;
  readonly name?: string;
  readonly realm_access?: { roles: readonly string[] };
  readonly exp?: number;
  readonly iat?: number;
  readonly [claim: string]: unknown;
}

export type IJwtPayload = IKeycloakTokenParsed;
