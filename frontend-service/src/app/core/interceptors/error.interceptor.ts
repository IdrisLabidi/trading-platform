import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import type { IApiError } from '../models/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const apiError: IApiError = {
        status: err.status,
        code: err.statusText || 'UNKNOWN_ERROR',
        message: err.message,
        timestamp: new Date().toISOString()
      };
      notifications.push('error', 'Erreur', apiError.message);
      return throwError(() => apiError);
    })
  );
};
