import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { SettingsService } from '../services/settings.service';
import type { ThemeMode } from '../../../core/models/settings.model';

interface IThemeOption {
  readonly id: ThemeMode;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly previewClass: string;
}

const THEMES: ReadonlyArray<IThemeOption> = [
  {
    id: 'dark',
    titleKey: 'settings.theme.darkTitle',
    descriptionKey: 'settings.theme.darkDescription',
    previewClass: 'bg-slate-900 ring-slate-700'
  },
  {
    id: 'light',
    titleKey: 'settings.theme.lightTitle',
    descriptionKey: 'settings.theme.lightDescription',
    previewClass: 'bg-slate-100 ring-slate-300'
  }
];

/**
 * Theme settings card. Lets the trader pick between dark and light
 * themes; the choice is pushed to `SettingsService` which then
 * forwards it to the core `ThemeService` (and persists it).
 */
@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [TranslatePipe, ButtonModule, CardModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <header class="flex flex-col gap-1">
        <h2 class="text-base font-semibold">
          {{ 'settings.theme.title' | translate }}
        </h2>
        <p class="text-sm text-[var(--app-fg-muted)]">
          {{ 'settings.theme.subtitle' | translate }}
        </p>
      </header>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        @for (option of themes; track option.id) {
          <button
            type="button"
            class="group flex flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 text-start transition-colors hover:border-[var(--app-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
            [class.border-[var(--app-accent)]]="option.id === currentTheme()"
            (click)="select(option.id)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="flex items-center gap-2">
                <span
                  class="inline-block h-8 w-12 rounded-md ring-2"
                  [class]="option.previewClass"
                ></span>
                <span class="text-sm font-semibold">
                  {{ option.titleKey | translate }}
                </span>
              </span>
              @if (option.id === currentTheme()) {
                <p-tag
                  [value]="'settings.theme.active' | translate"
                  severity="success"
                  [rounded]="true"
                ></p-tag>
              }
            </div>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ option.descriptionKey | translate }}
            </p>
          </button>
        }
      </div>

      <p-card>
        <ng-template pTemplate="header">
          <div class="px-4 pt-4">
            <h3 class="text-sm font-semibold">
              {{ 'settings.theme.previewTitle' | translate }}
            </h3>
          </div>
        </ng-template>
        <div class="flex flex-col gap-3 px-4 pb-4 text-sm">
          <div class="flex items-center justify-between rounded-md border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2">
            <span>{{ 'settings.theme.previewSample' | translate }}</span>
            <p-tag
              [value]="currentTheme()"
              [severity]="currentTheme() === 'dark' ? 'info' : 'warn'"
              [rounded]="true"
            ></p-tag>
          </div>
          <p class="text-xs text-[var(--app-fg-muted)]">
            {{ 'settings.theme.previewHelp' | translate }}
          </p>
        </div>
      </p-card>
    </div>
  `
})
export class ThemeSettingsComponent {
  private readonly settings = inject(SettingsService);

  readonly themes: ReadonlyArray<IThemeOption> = THEMES;
  readonly currentTheme = computed<ThemeMode>(() => this.settings.theme());

  select(theme: ThemeMode): void {
    this.settings.setTheme(theme);
  }
}
