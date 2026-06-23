export type ThemeMode = 'dark' | 'light';
export type AppLanguage = 'fr' | 'en' | 'ar';

export interface IUserSettings {
  readonly theme: ThemeMode;
  readonly language: AppLanguage;
  readonly notificationsEnabled: boolean;
}
