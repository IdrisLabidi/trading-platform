import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { SettingsService } from '../services/settings.service';
import type { AppLanguage } from '../../../core/models/settings.model';

interface ILanguageOption {
  readonly id: AppLanguage;
  readonly labelKey: string;
  readonly nativeLabel: string;
  readonly direction: 'ltr' | 'rtl';
  readonly descriptionKey: string;
  readonly flag: string;
}

const LANGUAGES: ReadonlyArray<ILanguageOption> = [
  {
    id: 'fr',
    labelKey: 'settings.language.french',
    nativeLabel: 'Français',
    direction: 'ltr',
    descriptionKey: 'settings.language.frenchDescription',
    flag: 'FR'
  },
  {
    id: 'en',
    labelKey: 'settings.language.english',
    nativeLabel: 'English',
    direction: 'ltr',
    descriptionKey: 'settings.language.englishDescription',
    flag: 'EN'
  },
  {
    id: 'ar',
    labelKey: 'settings.language.arabic',
    nativeLabel: 'العربية',
    direction: 'rtl',
    descriptionKey: 'settings.language.arabicDescription',
    flag: 'AR'
  }
];

/**
 * Language settings card. Lets the trader pick between the supported
 * languages; the choice is propagated to `TranslationService` (which
 * sets the `lang` / `dir` attributes on the document root).
 */
@Component({
  selector: 'app-language-settings',
  standalone: true,
  imports: [TranslatePipe, ButtonModule, CardModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <header class="flex flex-col gap-1">
        <h2 class="text-base font-semibold">
          {{ 'settings.language.title' | translate }}
        </h2>
        <p class="text-sm text-[var(--app-fg-muted)]">
          {{ 'settings.language.subtitle' | translate }}
        </p>
      </header>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        @for (option of languages; track option.id) {
          <button
            type="button"
            class="group flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 text-start transition-colors hover:border-[var(--app-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]"
            [class.border-[var(--app-accent)]]="option.id === currentLanguage()"
            (click)="select(option.id)"
          >
            <span class="flex items-center gap-2">
              <span class="text-xl" aria-hidden="true">{{ option.flag }}</span>
              <span class="text-sm font-semibold">{{ option.nativeLabel }}</span>
            </span>
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ option.labelKey | translate }}
            </span>
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ option.descriptionKey | translate }}
            </span>
            <div class="flex items-center justify-between">
              <p-tag
                [value]="option.direction"
                severity="secondary"
                [rounded]="true"
              ></p-tag>
              @if (option.id === currentLanguage()) {
                <p-tag
                  [value]="'settings.language.active' | translate"
                  severity="success"
                  [rounded]="true"
                ></p-tag>
              }
            </div>
          </button>
        }
      </div>

      <p-card>
        <ng-template pTemplate="header">
          <div class="px-4 pt-4">
            <h3 class="text-sm font-semibold">
              {{ 'settings.language.previewTitle' | translate }}
            </h3>
          </div>
        </ng-template>
        <div class="flex flex-col gap-2 px-4 pb-4 text-sm">
          <p class="text-base font-semibold">
            {{ 'settings.language.previewHello' | translate }}
          </p>
          <p class="text-xs text-[var(--app-fg-muted)]">
            {{ 'settings.language.previewDirection' | translate }}:
            {{ directionLabel() | translate }}
          </p>
        </div>
      </p-card>
    </div>
  `
})
export class LanguageSettingsComponent {
  private readonly settings = inject(SettingsService);

  readonly languages: ReadonlyArray<ILanguageOption> = LANGUAGES;
  readonly currentLanguage = computed<AppLanguage>(() => this.settings.language());

  readonly directionLabel = computed<string>(() => {
    const lang = this.currentLanguage();
    return lang === 'ar' ? 'settings.language.rtl' : 'settings.language.ltr';
  });

  select(language: AppLanguage): void {
    this.settings.setLanguage(language);
  }
}
