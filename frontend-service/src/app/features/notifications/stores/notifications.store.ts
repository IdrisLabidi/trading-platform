import { Injectable, computed, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly service = inject(NotificationService);
  readonly notifications = this.service.notifications;
  readonly unreadCount = computed(() => this.service.notifications().filter((n) => !n.read).length);
}
