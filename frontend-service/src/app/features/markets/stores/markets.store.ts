import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MarketsStore {
  private readonly _selected = signal<string | null>(null);
  readonly selected = this._selected.asReadonly();

  select(symbol: string): void {
    this._selected.set(symbol);
  }
}
