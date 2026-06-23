import { Injectable, signal } from '@angular/core';
import type { IAppNotification, NotificationLevel } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications = signal<readonly IAppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();

  push(level: NotificationLevel, title: string, message: string): void {
    const n: IAppNotification = {
      id: crypto.randomUUID(),
      level,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    this._notifications.update((list) => [n, ...list]);
  }

  markAsRead(id: string): void {
    this._notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  clear(): void {
    this._notifications.set([]);
  }
}
