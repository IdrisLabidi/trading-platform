import { Injectable } from '@angular/core';

/**
 * Thin wrapper around `localStorage` that performs safe JSON serialization
 * and avoids throwing on quota / parse errors.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota / serialization errors
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  }
}
