import { Injectable, computed, inject, signal } from '@angular/core';

import { StorageService } from '../../../core/services/storage.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { ILocalPreferences } from '../models/settings.model';
import { DEFAULT_PREFERENCES } from '../models/settings.model';

const STORAGE_KEY = 'app:preferences';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isPreferences(value: unknown): value is ILocalPreferences {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ILocalPreferences>;
  return (
    (candidate.theme === 'dark' || candidate.theme === 'light') &&
    (candidate.language === 'fr' || candidate.language === 'en' || candidate.language === 'ar')
  );
}

/**
 * Settings feature service. Acts as a facade in front of the
 * `ThemeService`, `TranslationService` and `NotificationService`
 * singletons, and persists the user preferences (theme, language,
 * notification toggles) so the choice survives a page reload.
 *
 * All preferences are kept in a single signal so the views render a
 * consistent picture at any time. Mutations are written through the
 * matching core service so the underlying side-effects (CSS
 * variables, `lang` / `dir` attributes, toast configuration) are
 * honoured.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(StorageService);
  private readonly themeService = inject(ThemeService);
  private readonly translationService = inject(TranslationService);
  private readonly notificationService = inject(NotificationService);

  private readonly _preferences = signal<ILocalPreferences>(this.load());

  readonly preferences = this._preferences.asReadonly();
  readonly theme = computed(() => this._preferences().theme);
  readonly language = computed(() => this._preferences().language);
  readonly notificationsEnabled = computed(() => this._preferences().notificationsEnabled);
  readonly orderConfirmations = computed(() => this._preferences().orderConfirmations);
  readonly priceAlerts = computed(() => this._preferences().priceAlerts);
  readonly compactTables = computed(() => this._preferences().compactTables);

  readonly availableLanguages = this.translationService.available;
  readonly availableThemes: ReadonlyArray<'dark' | 'light'> = ['dark', 'light'];

  /** Switch the active theme (dark / light). */
  setTheme(theme: ILocalPreferences['theme']): void {
    if (this.themeService.theme() === theme) {
      return;
    }
    this.themeService.setTheme(theme);
    this.update({ theme });
  }

  /** Switch the active language. */
  setLanguage(language: ILocalPreferences['language']): void {
    if (this.translationService.language() === language) {
      return;
    }
    this.translationService.use(language);
    this.update({ language });
  }

  /** Toggle the in-app notification inbox. */
  setNotificationsEnabled(enabled: boolean): void {
    this.update({ notificationsEnabled: enabled });
  }

  /** Toggle the post-submit order confirmation toast. */
  setOrderConfirmations(enabled: boolean): void {
    this.update({ orderConfirmations: enabled });
  }

  /** Toggle the price-alert subscription (used by future alert service). */
  setPriceAlerts(enabled: boolean): void {
    this.update({ priceAlerts: enabled });
  }

  /** Toggle the compact tables density used across the app. */
  setCompactTables(enabled: boolean): void {
    this.update({ compactTables: enabled });
    document.documentElement.setAttribute('data-density', enabled ? 'compact' : 'comfortable');
  }

  /** Reset every preference to the default value. */
  reset(): void {
    this.themeService.setTheme(DEFAULT_PREFERENCES.theme);
    this.translationService.use(DEFAULT_PREFERENCES.language);
    this.update(clone(DEFAULT_PREFERENCES));
    document.documentElement.setAttribute('data-density', DEFAULT_PREFERENCES.compactTables ? 'compact' : 'comfortable');
    this.notificationService.success(
      'settings.notifications.reset.title',
      'settings.notifications.reset.message'
    );
  }

  // --- Internals ----------------------------------------------------

  private load(): ILocalPreferences {
    const raw = this.storage.get<unknown>(STORAGE_KEY);
    if (isPreferences(raw)) {
      // Merge with defaults so newly added toggles get a sensible value.
      return { ...clone(DEFAULT_PREFERENCES), ...raw };
    }
    return clone(DEFAULT_PREFERENCES);
  }

  private update(patch: Partial<ILocalPreferences>): void {
    const next: ILocalPreferences = { ...this._preferences(), ...patch };
    this._preferences.set(next);
    this.storage.set(STORAGE_KEY, next);
  }
}
