import { ChangeDetectionStrategy, Component, inject, model } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { TranslationService } from '../../core/services/translation.service';
import type { AppLanguage } from '../../core/models/settings.model';

/**
 * Top bar of the application shell. Hosts the sidebar hamburger,
 * global search input, language switcher, theme toggle, notification
 * indicator and user logout. Two layout toggles are exposed back to
 * the shell via `model()` signals.
 */
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [TranslatePipe, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex h-14 items-center gap-4 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 sm:px-4"
    >
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
          (click)="sidebarPinned.update((v) => !v)"
          [attr.aria-label]="'common.open' | translate"
        >
          <i class="pi pi-bars"></i>
        </button>
      </div>

      <div class="flex flex-1 justify-center">
        <div class="relative w-full max-w-md">
          <i
            class="pi pi-search pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-sm text-[var(--app-fg-muted)]"
          ></i>
          <input
            type="search"
            class="h-9 w-full rounded-md border border-[var(--app-border)] bg-[var(--app-bg)] pe-3 ps-9 text-sm text-[var(--app-fg)] outline-none transition-colors focus:border-[var(--app-accent)]"
            [placeholder]="'common.search' | translate"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div
          class="hidden items-center gap-0.5 rounded-md border border-[var(--app-border)] p-0.5 sm:flex"
        >
          @for (lang of languages; track lang) {
            <button
              type="button"
              class="h-7 rounded px-2 text-xs font-medium transition-colors"
              [class]="
                currentLanguage() === lang
                  ? 'bg-[var(--app-accent)] text-[var(--app-accent-fg)]'
                  : 'text-[var(--app-fg-muted)] hover:text-[var(--app-fg)]'
              "
              (click)="setLanguage(lang)"
            >
              {{ lang | uppercase }}
            </button>
          }
        </div>

        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
          (click)="themeService.toggle()"
          [attr.aria-label]="'common.open' | translate"
        >
          <i
            class="pi"
            [class.pi-sun]="themeService.theme() === 'dark'"
            [class.pi-moon]="themeService.theme() === 'light'"
          ></i>
        </button>

        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
          (click)="rightPanelOpen.update((v) => !v)"
          [attr.aria-label]="'common.open' | translate"
        >
          <i class="pi pi-window-maximize"></i>
        </button>

        <div class="relative">
          <button
            type="button"
            class="relative grid h-9 w-9 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
            [attr.aria-label]="'nav.notifications' | translate"
          >
            <i class="pi pi-bell"></i>
            @if (unreadCount() > 0) {
              <span
                class="absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--app-danger)] px-1 text-[10px] font-semibold leading-none text-white"
              >
                {{ unreadCount() }}
              </span>
            }
          </button>
        </div>

        <div class="ms-1 flex items-center gap-2 sm:ms-2">
          <div class="hidden text-end sm:block">
            <div class="text-xs font-medium leading-tight">{{ user()?.username }}</div>
            <div class="text-[10px] leading-tight text-[var(--app-fg-muted)]">
              {{ user()?.email }}
            </div>
          </div>
          <button
            type="button"
            class="grid h-9 w-9 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
            (click)="logout()"
            [attr.aria-label]="'auth.logout' | translate"
          >
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </div>
    </header>
  `
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly notifications = inject(NotificationService);
  private readonly translation = inject(TranslationService);

  /** Two-way bound to the shell; toggles the sidebar pin state. */
  readonly sidebarPinned = model<boolean>(false);
  /** Two-way bound to the shell; toggles the right panel visibility. */
  readonly rightPanelOpen = model<boolean>(false);

  readonly user = this.auth.user;
  readonly currentLanguage = this.translation.language;
  readonly unreadCount = this.notifications.unreadCount;
  readonly languages: readonly AppLanguage[] = ['fr', 'en', 'ar'];

  setLanguage(lang: AppLanguage): void {
    this.translation.use(lang);
  }

  logout(): void {
    void this.auth.logout();
  }
}