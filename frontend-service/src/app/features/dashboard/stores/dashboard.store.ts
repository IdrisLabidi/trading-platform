import { Injectable, signal } from '@angular/core';
import type { IDashboardSummary } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly _summary = signal<IDashboardSummary | null>(null);
  readonly summary = this._summary.asReadonly();

  setSummary(summary: IDashboardSummary): void {
    this._summary.set(summary);
  }
}
