import { Injectable, signal } from '@angular/core';
import type { IPortfolioSummary } from '../models/portfolio.model';

@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  private readonly _summary = signal<IPortfolioSummary | null>(null);
  readonly summary = this._summary.asReadonly();

  setSummary(summary: IPortfolioSummary): void {
    this._summary.set(summary);
  }
}
