import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import type { ISettingsSection } from '../models/settings.model';

const SECTIONS: ReadonlyArray<ISettingsSection> = [
  {
    id: 'theme',
    labelKey: 'settings.menu.theme',
    descriptionKey: 'settings.menu.themeDescription',
    icon: 'pi-palette'
  },
  {
    id: 'language',
    labelKey: 'settings.menu.language',
    descriptionKey: 'settings.menu.languageDescription',
    icon: 'pi-globe'
  },
  {
    id: 'profile',
    labelKey: 'settings.menu.profile',
    descriptionKey: 'settings.menu.profileDescription',
    icon: 'pi-user'
  },
  {
    id: 'notifications',
    labelKey: 'settings.menu.notifications',
    descriptionKey: 'settings.menu.notificationsDescription',
    icon: 'pi-bell'
  }
];

/**
 * Master/detail layout for the settings feature. The left column
 * lists every available section; the right column renders the
 * matching child route through `<router-outlet>`. Default redirect
 * is `theme` so the user always lands on a meaningful page.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-cog text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'settings.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'settings.subtitle' | translate }}
            </p>
          </div>
        </div>
      </header>

      <div class="grid flex-1 grid-cols-1 gap-4 overflow-auto px-4 pb-6 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav
          aria-label="settings.navigation"
          class="flex flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
        >
          <ul class="flex flex-col divide-y divide-[var(--app-border)]">
            @for (section of sections; track section.id) {
              <li>
                <a
                  [routerLink]="['/settings', section.id]"
                  routerLinkActive="bg-[var(--app-bg-overlay)] text-[var(--app-fg)]"
                  class="flex items-start gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
                >
                  <i class="pi mt-0.5 text-base text-[var(--app-fg-muted)]" [class]="section.icon" aria-hidden="true"></i>
                  <span class="flex flex-col gap-1">
                    <span class="font-semibold">{{ section.labelKey | translate }}</span>
                    <span class="text-xs text-[var(--app-fg-muted)]">
                      {{ section.descriptionKey | translate }}
                    </span>
                  </span>
                </a>
              </li>
            }
          </ul>
        </nav>

        <section
          class="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-4 shadow-sm sm:p-6"
        >
          <router-outlet />
        </section>
      </div>
    </div>
  `
})
export class SettingsComponent {
  readonly sections: ReadonlyArray<ISettingsSection> = SECTIONS;
}
