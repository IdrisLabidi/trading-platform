import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required = (route.data?.['roles'] as readonly string[] | undefined) ?? [];
  const user = auth.user();
  if (!user) {
    return router.createUrlTree(['/login']);
  }
  const hasRole = required.every((r) => user.roles.includes(r));
  return hasRole ? true : router.createUrlTree(['/']);
};
