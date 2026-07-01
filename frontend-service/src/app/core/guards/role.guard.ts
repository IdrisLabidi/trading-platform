import { inject } from '@angular/core';
import { type CanActivateFn, type CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services';
import { environment } from '../../../environments/environment';

/**
 * Allows the navigation when the current user owns every role listed
 * in `route.data.roles` (or in `environment.traderRoles` when no
 * override is provided). Unauthenticated users are sent to `/`,
 * authenticated-but-unauthorised users are sent back to `/`.
 */
export const roleGuard: CanActivateFn = (route) => {
  return checkRoles(route.data?.['roles'] as readonly string[] | undefined);
};

/**
 * `canMatch` variant used by lazy feature routes so the chunk is not
 * downloaded when the user lacks the required roles.
 */
export const roleMatchGuard: CanMatchFn = (route) => {
  return checkRoles(route.data?.['roles'] as readonly string[] | undefined);
};

function checkRoles(required: readonly string[] | undefined) {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (!user) {
    return router.createUrlTree(['/']);
  }
  const wanted = required && required.length > 0 ? required : environment.traderRoles;
  const hasRole = wanted.some((r) => user.roles.includes(r));
  return hasRole ? true : router.createUrlTree(['/']);
}
