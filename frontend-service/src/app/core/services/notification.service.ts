import { Injectable, computed, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import type { IAppNotification, NotificationLevel } from '../models/notification.model';

/**
 * Application-wide notification service.
 *
 * - Exposes a Signal-based inbox of in-app notifications.
 * - Bridges the PrimeNG `MessageService` (toast) and `ConfirmationService`
 *   (confirm dialog) so feature code can call a single API.
 * - Provides imperative helpers that the HTTP interceptor and global
 *   error handler call directly.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  private readonly _notifications = signal<readonly IAppNotification[]>([]);
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(
    () => this._notifications().filter((n) => !n.read).length
  );

  /** Push a new entry into the in-app inbox. */
  push(level: NotificationLevel, title: string, message: string): void {
    const entry: IAppNotification = {
      id: crypto.randomUUID(),
      level,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    this._notifications.update((list) => [entry, ...list]);
    this.messageService.add({
      severity: this.toastSeverity(level),
      summary: title,
      detail: message,
      life: 4000
    });
  }

  info(title: string, message: string): void {
    this.push('info', title, message);
  }

  success(title: string, message: string): void {
    this.push('success', title, message);
  }

  warn(title: string, message: string): void {
    this.push('warning', title, message);
  }

  error(title: string, message: string): void {
    this.push('error', title, message);
  }

  markAsRead(id: string): void {
    this._notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  markAllAsRead(): void {
    this._notifications.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  clear(): void {
    this._notifications.set([]);
  }

  /**
   * Open a PrimeNG confirm dialog. The returned promise resolves to
   * `true` when the user accepts, `false` when rejected or cancelled.
   */
  confirm(
    title: string,
    message: string,
    options?: { acceptLabel?: string; rejectLabel?: string; icon?: string }
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationService.confirm({
        header: title,
        message,
        icon: options?.icon ?? 'pi pi-exclamation-triangle',
        acceptLabel: options?.acceptLabel ?? 'Confirmer',
        rejectLabel: options?.rejectLabel ?? 'Annuler',
        accept: () => resolve(true),
        reject: () => resolve(false)
      });
    });
  }

  private toastSeverity(level: NotificationLevel): 'info' | 'success' | 'warn' | 'error' {
    switch (level) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warn';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  }
}
