import { Injectable, signal, effect } from '@angular/core';
import { StorageService } from './storage.service';
import type { ThemeMode } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storage = new StorageService();
  private readonly _theme = signal<ThemeMode>('dark');
  readonly theme = this._theme.asReadonly();

  constructor() {
    const stored = this.storage.get<ThemeMode>('app:theme');
    if (stored) {
      this._theme.set(stored);
    }
    effect(() => {
      document.documentElement.setAttribute('data-theme', this._theme());
      this.storage.set('app:theme', this._theme());
    });
  }

  setTheme(mode: ThemeMode): void {
    this._theme.set(mode);
  }

  toggle(): void {
    this._theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
