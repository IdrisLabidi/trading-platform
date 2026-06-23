import { type HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import type { IApiError } from '../models/api-error.model';

/**
 * Centralises HTTP error handling.
 *
 * - Converts `HttpErrorResponse` into the serialisable `IApiError` shape.
 * - Surfaces a toast through `NotificationService` (skipping 401 which
 *   is handled by the authentication flow).
 * - Triggers a redirect to `/login` on 401 when the user was already
 *   authenticated, so an expired session does not leave the user on a
 *   broken page.
 * - Re-throws the normalised error so callers can react if needed.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const auth = inject(AuthService);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiError: IApiError = {
        status: err.status,
        code: err.statusText || err.error?.code || 'UNKNOWN_ERROR',
        message:
          typeof err.error?.message === 'string'
            ? err.error.message
            : err.message || 'Unexpected error',
        details: err.error?.details,
        timestamp: new Date().toISOString()
      };
      if (apiError.status === 401) {
        if (auth.isAuthenticated()) {
          void auth.logout();
          void router.navigate(['/login']);
        }
      } else if (apiError.status >= 500) {
        notifications.push('error', 'Erreur serveur', apiError.message);
      } else if (apiError.status !== 0) {
        notifications.push('error', 'Erreur', apiError.message);
      }
      return throwError(() => apiError);
    })
  );
};
