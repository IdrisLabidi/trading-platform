import { inject } from '@angular/core';
import { type CanActivateFn, type CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services';

/**
 * Allows the navigation when the user is authenticated, otherwise
 * redirects to the public landing page (preserving the requested URL).
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/'], {
    queryParams: { redirect: state.url }
  });
};

/**
 * `canMatch` variant used by lazy routes that should not even be
 * downloaded for anonymous users (e.g. dashboard, portfolio).
 */
export const authMatchGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  const target = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/'], {
    queryParams: { redirect: target }
  });
};
