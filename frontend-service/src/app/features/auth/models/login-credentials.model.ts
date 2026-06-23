/**
 * Credentials exchanged with the authentication backend. The same
 * shape is used by the Keycloak login redirect (the password is only
 * required when the backend issues a token directly, e.g. for the
 * development fallback flow).
 */
export interface ILoginCredentials {
  readonly username: string;
  readonly password: string;
  /** Optional `returnTo` URL preserved through the Keycloak round-trip. */
  readonly redirect?: string;
}
