import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { DashboardStore } from '../stores/dashboard.store';

/**
 * Dashboard toolbar. Hosts the page title, a `last refreshed` label
 * and a refresh action. The toolbar is intentionally thin: the only
 * emitted event is the `refresh` command and it never mutates the
 * store directly. A future revision will add a date range selector
 * and a timeframe switcher.
 */
@Component({
  selector: 'app-dashboard-toolbar',
  standalone: true,
  imports: [DatePipe, TranslatePipe, ButtonModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex flex-col gap-3 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-th-large text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
        <div>
          <h1 class="text-base font-semibold sm:text-lg">
            {{ 'dashboard.toolbar.title' | translate }}
          </h1>
          <p class="text-xs text-[var(--app-fg-muted)]">
            {{ 'dashboard.toolbar.subtitle' | translate }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <p-tag
          [value]="statusLabel() | translate"
          [severity]="statusSeverity()"
          [rounded]="true"
        ></p-tag>
        <span class="hidden text-xs text-[var(--app-fg-muted)] sm:inline">
          {{ 'dashboard.toolbar.lastRefreshed' | translate }}:
          {{ lastLoadedAt() | date: 'short' }}
        </span>
        <p-button
          size="small"
          severity="secondary"
          [outlined]="true"
          [loading]="loading()"
          (onClick)="refresh()"
          [attr.aria-label]="'dashboard.toolbar.refresh' | translate"
        >
          <i class="pi pi-refresh" pButtonIcon></i>
          <span pButtonLabel>{{ 'dashboard.toolbar.refresh' | translate }}</span>
        </p-button>
      </div>
    </header>
  `
})
export class DashboardToolbarComponent {
  private readonly store = inject(DashboardStore);

  readonly loading = this.store.loading;
  readonly lastLoadedAt = computed<string>(() => this.store.lastLoadedAt() ?? '');

  readonly statusLabel = computed<string>(() =>
    this.store.hasError()
      ? 'dashboard.status.error'
      : this.store.isReady()
        ? 'dashboard.status.ready'
        : 'dashboard.status.idle'
  );

  readonly statusSeverity = computed<'success' | 'danger' | 'secondary'>(() =>
    this.store.hasError()
      ? 'danger'
      : this.store.isReady()
        ? 'success'
        : 'secondary'
  );

  refresh(): void {
    void this.store.refresh();
  }
}
