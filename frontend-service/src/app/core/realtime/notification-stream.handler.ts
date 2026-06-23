import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NotificationService } from '../services/notification.service';
import type { IAppNotification } from '../models/notification.model';
import { RealtimeService } from './realtime.service';

/**
 * Notification stream handler.
 *
 * Subscribes once to the realtime notification stream and forwards
 * every incoming payload into the in-app inbox exposed by
 * `NotificationService`. The handler is intentionally side-effect free
 * otherwise: it does not mutate any feature store and does not render
 * UI on its own.
 *
 * The handler self-registers during construction (root-scoped
 * service) and tears down with the application injector.
 */
@Injectable({ providedIn: 'root' })
export class NotificationStreamHandler {
  private readonly realtime = inject(RealtimeService);
  private readonly inbox = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private attached = false;

  constructor() {
    this.attach();
  }

  /** Idempotent subscription helper used by the constructor. */
  attach(): void {
    if (this.attached) {
      return;
    }
    this.attached = true;
    this.realtime
      .notifications$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => this.forward(notification));
  }

  private forward(notification: IAppNotification): void {
    switch (notification.level) {
      case 'success':
        this.inbox.success(notification.title, notification.message);
        break;
      case 'warning':
        this.inbox.warn(notification.title, notification.message);
        break;
      case 'error':
        this.inbox.error(notification.title, notification.message);
        break;
      case 'info':
      default:
        this.inbox.info(notification.title, notification.message);
        break;
    }
  }
}
