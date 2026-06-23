import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from './storage.service';
import type { AppLanguage } from '../models/settings.model';

const STORAGE_KEY = 'app:language';
const DEFAULT_LANG: AppLanguage = 'fr';

/**
 * Bridges the raw ngx-translate service to the application
 * configuration. Sets the current language, manages the `lang` / `dir`
 * attributes on the document root and exposes a simple `instant` API.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly storage = inject(StorageService);
  private readonly translate = inject(TranslateService);
  private readonly _language = signal<AppLanguage>(DEFAULT_LANG);

  readonly language = this._language.asReadonly();
  readonly direction = computed<'ltr' | 'rtl'>(() =>
    this._language() === 'ar' ? 'rtl' : 'ltr'
  );
  readonly available: readonly AppLanguage[] = ['fr', 'en', 'ar'];

  constructor() {
    this.translate.addLangs([...this.available]);

    const stored = this.storage.get<AppLanguage>(STORAGE_KEY);
    const initial: AppLanguage =
      stored && this.available.includes(stored) ? stored : DEFAULT_LANG;
    this.use(initial);
  }

  use(lang: AppLanguage): void {
    if (!this.available.includes(lang)) {
      return;
    }
    this._language.set(lang);
    this.translate.use(lang);
    this.storage.set(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', this.direction());
  }

  instant(key: string, params?: Readonly<Record<string, unknown>>): string {
    return this.translate.instant(key, params);
  }
}
