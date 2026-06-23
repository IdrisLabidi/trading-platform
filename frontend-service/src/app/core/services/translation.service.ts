import { Injectable, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import type { AppLanguage } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly storage = new StorageService();
  private readonly _language = signal<AppLanguage>('fr');
  readonly language = this._language.asReadonly();
  readonly direction = computed<'ltr' | 'rtl'>(() => (this._language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    const stored = this.storage.get<AppLanguage>('app:language');
    if (stored) {
      this._language.set(stored);
    }
  }

  setLanguage(lang: AppLanguage): void {
    this._language.set(lang);
    this.storage.set('app:language', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', this.direction());
  }

  translate(key: string): string {
    return key;
  }
}
