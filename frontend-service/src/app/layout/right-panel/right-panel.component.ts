import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Optional right-side trading panel placeholder. Visibility is fully
 * driven by the shell via the two-way bound `open` model. The body
 * is projectable via `<ng-content>` so feature code can drop content
 * into it later; when nothing is projected, a neutral placeholder
 * message is shown.
 */
@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="flex h-full w-full flex-col overflow-hidden border-s border-[var(--app-border)] bg-[var(--app-bg-elevated)]"
      [class.hidden]="!open()"
    >
      <header
        class="flex h-14 items-center justify-between border-b border-[var(--app-border)] px-4"
      >
        <h2 class="text-sm font-semibold">{{ 'app.name' | translate }}</h2>
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-md text-[var(--app-fg-muted)] transition-colors hover:bg-[var(--app-bg-overlay)] hover:text-[var(--app-fg)]"
          (click)="open.set(false)"
          [attr.aria-label]="'common.close' | translate"
        >
          <i class="pi pi-times"></i>
        </button>
      </header>
      <div class="flex-1 overflow-y-auto p-4">
        <ng-content>
          <div
            class="flex h-full flex-col items-center justify-center gap-2 text-center"
          >
            <i class="pi pi-chart-bar text-2xl text-[var(--app-fg-muted)]"></i>
            <p class="text-sm text-[var(--app-fg-muted)]">Trading panel placeholder</p>
          </div>
        </ng-content>
      </div>
    </aside>
  `
})
export class RightPanelComponent {
  /** Visibility, two-way bound to the shell. */
  readonly open = model<boolean>(false);
}