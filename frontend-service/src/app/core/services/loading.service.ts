import { Injectable, computed, signal } from '@angular/core';

/**
 * Counts the number of in-flight HTTP requests so the layout can render
 * a global progress bar / spinner.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _active = signal<number>(0);
  readonly active = this._active.asReadonly();
  readonly isLoading = computed(() => this._active() > 0);

  start(): void {
    this._active.update((n) => n + 1);
  }

  stop(): void {
    this._active.update((n) => Math.max(0, n - 1));
  }

  reset(): void {
    this._active.set(0);
  }
}
