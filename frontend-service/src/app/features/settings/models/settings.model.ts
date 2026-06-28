import type { ThemeMode, AppLanguage } from '../../../core/models/settings.model';

export type { ThemeMode, AppLanguage, IUserSettings } from '../../../core/models/settings.model';

/**
 * Settings navigation entry surfaced by the master/detail layout
 * used in `SettingsComponent`.
 */
export interface ISettingsSection {
  readonly id: 'theme' | 'language' | 'profile' | 'notifications';
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly icon: string;
}

/**
 * Preferences stored locally (theme, language, notification toggles,
 * density). Persisted via `StorageService` so the user choice
 * survives a page reload.
 */
export interface ILocalPreferences {
  readonly theme: ThemeMode;
  readonly language: AppLanguage;
  readonly notificationsEnabled: boolean;
  readonly orderConfirmations: boolean;
  readonly priceAlerts: boolean;
  readonly compactTables: boolean;
}

export const DEFAULT_PREFERENCES: ILocalPreferences = {
  theme: 'dark',
  language: 'fr',
  notificationsEnabled: true,
  orderConfirmations: true,
  priceAlerts: true,
  compactTables: false
};
