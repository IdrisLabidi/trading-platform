import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RealtimeService } from '../../../core/realtime/realtime.service';
import type { IAppNotification } from '../../../core/models/notification.model';

/**
 * Live signal store for in-app notifications streamed by the gateway.
 *
 * - Aggregates every notification envelope into a deduplicated list.
 * - Mirrors the existing `NotificationsStore` shape so the UI layer
 *   keeps a single point of access.
 * - The toast surface is handled by the global `NotificationStreamHandler`
 *   installed during bootstrap.
 */
@Injectable({ providedIn: 'root' })
export class NotificationWebSocketService {
  private readonly realtime = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _stream = signal<readonly IAppNotification[]>([]);

  readonly stream = this._stream.asReadonly();
  readonly unreadCount = computed(
    () => this._stream().filter((n) => !n.read).length
  );

  constructor() {
    this.realtime
      .notifications$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => this.applyNotification(notification));
  }

  /** Mark a notification as read (local UI state). */
  markAsRead(id: string): void {
    this._stream.update((list) =>
      list.map((entry) => (entry.id === id ? { ...entry, read: true } : entry))
    );
  }

  markAllAsRead(): void {
    this._stream.update((list) => list.map((entry) => ({ ...entry, read: true })));
  }

  clear(): void {
    this._stream.set([]);
  }

  private applyNotification(notification: IAppNotification): void {
    this._stream.update((list) => upsertById(list, notification));
  }
}

function upsertById(
  list: readonly IAppNotification[],
  notification: IAppNotification
): IAppNotification[] {
  const filtered = list.filter((entry) => entry.id !== notification.id);
  return [notification, ...filtered];
}
