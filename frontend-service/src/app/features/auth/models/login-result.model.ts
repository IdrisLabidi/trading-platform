import type { IUser } from './user-type.model';

/**
 * Result of a successful authentication attempt. Wraps the resolved
 * `IUser` together with the post-login navigation target so feature
 * code does not need to know the URL layout of the rest of the app.
 */
export interface ILoginResult {
  readonly user: IUser;
  /** URL the caller should navigate to once authentication succeeds. */
  readonly redirect: string;
}
