export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface IAppNotification {
  readonly id: string;
  readonly level: NotificationLevel;
  readonly title: string;
  readonly message: string;
  readonly timestamp: string;
  readonly read: boolean;
}
