import { ErrorHandler, Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

/**
 * Central Angular `ErrorHandler` that funnels every uncaught exception
 * into the notification service. HTTP errors are intercepted earlier
 * (see `errorInterceptor`) so this is mostly used for client-side
 * exceptions (template errors, RxJS failures, etc.).
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notifications = inject(NotificationService);

  handleError(error: unknown): void {
    const message = this.toMessage(error);
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorHandler]', error);
    this.notifications.push('error', 'Erreur', message);
  }

  private toMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unexpected error';
    }
  }
}
