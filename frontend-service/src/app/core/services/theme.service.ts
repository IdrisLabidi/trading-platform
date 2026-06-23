import { Injectable, effect, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import type { ThemeMode } from '../models/settings.model';

const STORAGE_KEY = 'app:theme';

/**
 * Manages the application theme (dark by default, light optional).
 * Persists the user preference and updates the `data-theme` attribute
 * on the document root so CSS variables swap at runtime.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly _theme = signal<ThemeMode>('dark');
  readonly theme = this._theme.asReadonly();

  constructor() {
    const stored = this.storage.get<ThemeMode>(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      this._theme.set(stored);
    }
    effect(() => {
      const value = this._theme();
      document.documentElement.setAttribute('data-theme', value);
      document.documentElement.style.colorScheme = value;
      this.storage.set(STORAGE_KEY, value);
    });
  }

  setTheme(mode: ThemeMode): void {
    this._theme.set(mode);
  }

  toggle(): void {
    this._theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }
}
