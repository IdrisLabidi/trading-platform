import { Injectable, computed, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';
import { NotificationWebSocketService } from '../services/notification-websocket.service';

/**
 * Façade that merges the in-app inbox (toast source) with the live
 * stream produced by the realtime gateway. The existing UI components
 * keep reading a single shape (`notifications`, `unreadCount`) while
 * the underlying pipeline is split between the historical inbox and
 * the live stream.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly inbox = inject(NotificationService);
  private readonly stream = inject(NotificationWebSocketService);

  readonly notifications = computed(() => this.inbox.notifications());
  readonly unreadCount = computed(
    () => this.inbox.unreadCount() + this.stream.unreadCount()
  );

  markAsRead(id: string): void {
    this.inbox.markAsRead(id);
    this.stream.markAsRead(id);
  }

  markAllAsRead(): void {
    this.inbox.markAllAsRead();
    this.stream.markAllAsRead();
  }

  clear(): void {
    this.inbox.clear();
    this.stream.clear();
  }
}
