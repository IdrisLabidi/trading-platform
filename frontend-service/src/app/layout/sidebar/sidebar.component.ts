import { ChangeDetectionStrategy, Component, computed, model, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

interface INavItem {
  readonly labelKey: string;
  readonly path: string;
  readonly icon: string;
}

/**
 * Collapsible navigation rail. Default state is collapsed (icons only).
 * The rail expands on hover OR when the user explicitly pins it open
 * via the bottom toggle. The two states are independent: pinning keeps
 * the rail open after the cursor leaves, and unpinning lets hover take
 * over again.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="flex h-full flex-col overflow-hidden border-e border-[var(--app-border)] bg-[var(--app-bg-elevated)] transition-[width] duration-200 ease-in-out"
      [class.w-64]="expanded()"
      [class.w-16]="!expanded()"
      (mouseenter)="hovered.set(true)"
      (mouseleave)="hovered.set(false)"
      (focusin)="hovered.set(true)"
      (focusout)="hovered.set(false)"
    >
      <div class="flex h-14 items-center gap-3 px-4">
        <i class="pi pi-chart-line text-lg text-[var(--app-accent)]"></i>
        @if (expanded()) {
          <span class="truncate text-sm font-semibold">{{ 'app.name' | translate }}</span>
        }
      </div>

      <nav class="flex-1 overflow-y-auto py-2">
        <ul class="flex flex-col gap-1 px-2">
          @for (item of items; track item.path) {
            <li>
              <a
                class="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
                [routerLink]="item.path"
                routerLinkActive="bg-[var(--app-bg-overlay)] text-[var(--app-fg)]"
                [attr.aria-label]="item.labelKey | translate"
                [attr.title]="item.labelKey | translate"
              >
                <i class="pi text-base" [class]="item.icon"></i>
                @if (expanded()) {
                  <span class="truncate">{{ item.labelKey | translate }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="border-t border-[var(--app-border)] p-2">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
          (click)="togglePinned()"
          [attr.aria-label]="(pinned() ? 'common.close' : 'common.open') | translate"
        >
          <i
            class="pi text-base"
            [class.pi-angle-double-left]="pinned()"
            [class.pi-angle-double-right]="!pinned()"
          ></i>
          @if (expanded()) {
            <span class="truncate">{{ (pinned() ? 'common.close' : 'common.open') | translate }}</span>
          }
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  /** Pinned state, two-way bound to the shell. `false` = collapsed by default. */
  readonly pinned = model<boolean>(false);
  /** Hover state, owned by the sidebar (transient). */
  protected readonly hovered = signal<boolean>(false);
  /** Effective expanded state: pinned open OR currently hovered. */
  readonly expanded = computed(() => this.pinned() || this.hovered());

  readonly items: readonly INavItem[] = [
    { labelKey: 'nav.dashboard', path: '/dashboard', icon: 'pi-th-large' },
    { labelKey: 'nav.markets', path: '/markets', icon: 'pi-globe' },
    { labelKey: 'nav.portfolio', path: '/portfolio', icon: 'pi-wallet' },
    { labelKey: 'nav.assets', path: '/assets', icon: 'pi-box' },
    { labelKey: 'nav.orders', path: '/orders', icon: 'pi-shopping-cart' },
    { labelKey: 'nav.history', path: '/history', icon: 'pi-history' },
    { labelKey: 'nav.watchlist', path: '/watchlist', icon: 'pi-eye' },
    { labelKey: 'nav.notifications', path: '/notifications', icon: 'pi-bell' },
    { labelKey: 'nav.settings', path: '/settings', icon: 'pi-cog' }
  ];

  togglePinned(): void {
    this.pinned.update((v) => !v);
  }
}
