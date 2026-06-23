import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly _active = signal<number>(0);
  readonly active = this._active.asReadonly();
  readonly isLoading = (): boolean => this._active() > 0;

  start(): void {
    this._active.update((n) => n + 1);
  }

  stop(): void {
    this._active.update((n) => Math.max(0, n - 1));
  }
}
