import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

import { SettingsService } from '../services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';

/**
 * Profile + notifications settings card. Surfaces the user identity
 * (read from the Keycloak token) and the notification toggles
 * persisted by `SettingsService`.
 */
@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    TagModule,
    ToggleSwitchModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <header class="flex flex-col gap-1">
        <h2 class="text-base font-semibold">
          {{ 'settings.profile.title' | translate }}
        </h2>
        <p class="text-sm text-[var(--app-fg-muted)]">
          {{ 'settings.profile.subtitle' | translate }}
        </p>
      </header>

      <p-card>
        <ng-template pTemplate="header">
          <div class="px-4 pt-4">
            <h3 class="text-sm font-semibold">
              {{ 'settings.profile.identityTitle' | translate }}
            </h3>
          </div>
        </ng-template>
        <div class="grid grid-cols-1 gap-3 px-4 pb-4 text-sm sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'settings.profile.username' | translate }}
            </span>
            <span class="font-semibold">{{ user()?.username || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'settings.profile.email' | translate }}
            </span>
            <span class="font-semibold">{{ user()?.email || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'settings.profile.fullName' | translate }}
            </span>
            <span class="font-semibold">{{ fullName() }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs text-[var(--app-fg-muted)]">
              {{ 'settings.profile.roles' | translate }}
            </span>
            <span class="flex flex-wrap gap-1">
              @for (role of user()?.roles ?? []; track role) {
                <p-tag [value]="role" severity="info" [rounded]="true"></p-tag>
              } @empty {
                <span class="text-xs text-[var(--app-fg-muted)]">-</span>
              }
            </span>
          </div>
        </div>
      </p-card>

      <p-card>
        <ng-template pTemplate="header">
          <div class="px-4 pt-4">
            <h3 class="text-sm font-semibold">
              {{ 'settings.profile.notificationsTitle' | translate }}
            </h3>
          </div>
        </ng-template>
        <div class="flex flex-col gap-3 px-4 pb-4 text-sm">
          <label class="flex items-center justify-between gap-2 rounded-md border border-[var(--app-border)] bg-[var(--app-bg)] p-3">
            <span class="flex flex-col gap-1">
              <span class="font-medium">
                {{ 'settings.profile.notificationsInbox' | translate }}
              </span>
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ 'settings.profile.notificationsInboxHelp' | translate }}
              </span>
            </span>
            <p-toggleSwitch
              [ngModel]="notificationsEnabled()"
              (ngModelChange)="setNotificationsEnabled($event)"
            ></p-toggleSwitch>
          </label>

          <label class="flex items-center justify-between gap-2 rounded-md border border-[var(--app-border)] bg-[var(--app-bg)] p-3">
            <span class="flex flex-col gap-1">
              <span class="font-medium">
                {{ 'settings.profile.orderConfirmations' | translate }}
              </span>
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ 'settings.profile.orderConfirmationsHelp' | translate }}
              </span>
            </span>
            <p-toggleSwitch
              [ngModel]="orderConfirmations()"
              (ngModelChange)="setOrderConfirmations($event)"
            ></p-toggleSwitch>
          </label>

          <label class="flex items-center justify-between gap-2 rounded-md border border-[var(--app-border)] bg-[var(--app-bg)] p-3">
            <span class="flex flex-col gap-1">
              <span class="font-medium">
                {{ 'settings.profile.priceAlerts' | translate }}
              </span>
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ 'settings.profile.priceAlertsHelp' | translate }}
              </span>
            </span>
            <p-toggleSwitch
              [ngModel]="priceAlerts()"
              (ngModelChange)="setPriceAlerts($event)"
            ></p-toggleSwitch>
          </label>

          <label class="flex items-center justify-between gap-2 rounded-md border border-[var(--app-border)] bg-[var(--app-bg)] p-3">
            <span class="flex flex-col gap-1">
              <span class="font-medium">
                {{ 'settings.profile.compactTables' | translate }}
              </span>
              <span class="text-xs text-[var(--app-fg-muted)]">
                {{ 'settings.profile.compactTablesHelp' | translate }}
              </span>
            </span>
            <p-toggleSwitch
              [ngModel]="compactTables()"
              (ngModelChange)="setCompactTables($event)"
            ></p-toggleSwitch>
          </label>
        </div>
      </p-card>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-col text-xs text-[var(--app-fg-muted)]">
          <span>
            {{ 'settings.profile.sessionTheme' | translate }}: {{ themeName() }}
          </span>
          <span>
            {{ 'settings.profile.sessionLanguage' | translate }}: {{ languageName() }}
          </span>
        </div>
        <p-button
          severity="danger"
          [outlined]="true"
          (onClick)="signOut()"
        >
          <i class="pi pi-sign-out" pButtonIcon></i>
          <span pButtonLabel>{{ 'settings.profile.signOut' | translate }}</span>
        </p-button>
      </div>
    </div>
  `
})
export class ProfileSettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);
  private readonly translation = inject(TranslationService);

  readonly user = this.auth.user;
  readonly notificationsEnabled = computed<boolean>(() => this.settings.notificationsEnabled());
  readonly orderConfirmations = computed<boolean>(() => this.settings.orderConfirmations());
  readonly priceAlerts = computed<boolean>(() => this.settings.priceAlerts());
  readonly compactTables = computed<boolean>(() => this.settings.compactTables());

  readonly fullName = computed<string>(() => {
    const user = this.user();
    if (!user) {
      return '-';
    }
    const first = user.firstName ?? '';
    const last = user.lastName ?? '';
    const composed = `${first} ${last}`.trim();
    return composed.length > 0 ? composed : user.username;
  });

  readonly themeName = computed<string>(() => this.theme.theme());
  readonly languageName = computed<string>(() => this.translation.language());

  setNotificationsEnabled(value: boolean): void {
    this.settings.setNotificationsEnabled(value);
  }

  setOrderConfirmations(value: boolean): void {
    this.settings.setOrderConfirmations(value);
  }

  setPriceAlerts(value: boolean): void {
    this.settings.setPriceAlerts(value);
  }

  setCompactTables(value: boolean): void {
    this.settings.setCompactTables(value);
  }

  signOut(): void {
    void this.auth.logout();
  }
}
