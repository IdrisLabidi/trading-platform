import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { WatchlistStore } from '../stores/watchlist.store';
import { NotificationService } from '../../../core/services/notification.service';
import { WatchlistItemsComponent } from './watchlist-items.component';
import type { IWatchlist } from '../models/watchlist.model';

/**
 * Watchlist manager page. Lets the trader list, create, rename and
 * delete watchlist groups and renders the selected group through
 * `WatchlistItemsComponent`.
 *
 * The component is purely presentational: every state mutation goes
 * through `WatchlistStore` so the realtime / REST split stays
 * transparent to the UI.
 */
@Component({
  selector: 'app-watchlist-manager',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    WatchlistItemsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-full flex-col gap-4">
      <header
        class="flex flex-col gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-eye text-lg text-[var(--app-fg-muted)]" aria-hidden="true"></i>
          <div>
            <h1 class="text-base font-semibold sm:text-lg">
              {{ 'watchlist.manager.title' | translate }}
            </h1>
            <p class="text-xs text-[var(--app-fg-muted)]">
              {{ 'watchlist.manager.subtitle' | translate }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <p-tag [value]="countLabel()" severity="info" [rounded]="true"></p-tag>
          <p-button
            size="small"
            severity="secondary"
            [outlined]="true"
            [loading]="store.loading()"
            (onClick)="refresh()"
          >
            <i class="pi pi-refresh" pButtonIcon></i>
            <span pButtonLabel>{{ 'watchlist.manager.refresh' | translate }}</span>
          </p-button>
          <p-button
            size="small"
            [disabled]="creating()"
            (onClick)="toggleCreate()"
          >
            <i class="pi pi-plus" pButtonIcon></i>
            <span pButtonLabel>{{ 'watchlist.manager.new' | translate }}</span>
          </p-button>
        </div>
      </header>

      @if (creating()) {
        <form
          class="mx-4 flex flex-col gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-3 sm:mx-6 sm:flex-row sm:items-center"
          (submit)="$event.preventDefault(); create()"
        >
          <span class="flex-1">
            <input
              pInputText
              type="text"
              class="w-full"
              [placeholder]="'watchlist.manager.namePlaceholder' | translate"
              [ngModel]="newName()"
              (ngModelChange)="newName.set($event)"
              name="watchlistName"
              autocomplete="off"
            />
          </span>
          <p-button
            type="submit"
            [disabled]="!canCreate()"
            [loading]="creating()"
          >
            <span pButtonLabel>{{ 'watchlist.manager.create' | translate }}</span>
          </p-button>
          <p-button
            type="button"
            severity="secondary"
            [outlined]="true"
            (onClick)="cancelCreate()"
          >
            <span pButtonLabel>{{ 'common.cancel' | translate }}</span>
          </p-button>
        </form>
      }

      <div class="flex-1 overflow-auto px-4 pb-6 sm:px-6">
        @if (store.loading() && store.watchlists().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-sm text-[var(--app-fg-muted)]"
          >
            <p-progressSpinner styleClass="h-6 w-6" strokeWidth="6" ariaLabel="loading"></p-progressSpinner>
            <span>{{ 'watchlist.manager.loading' | translate }}</span>
          </div>
        } @else if (store.error() && store.watchlists().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-danger)]"
            role="alert"
          >
            <i class="pi pi-exclamation-triangle text-2xl" aria-hidden="true"></i>
            <p>{{ store.error() }}</p>
          </div>
        } @else if (store.watchlists().length === 0) {
          <div
            class="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-bookmark text-2xl" aria-hidden="true"></i>
            <p>{{ 'watchlist.manager.empty' | translate }}</p>
            <p-button size="small" (onClick)="toggleCreate()">
              <span pButtonLabel>{{ 'watchlist.manager.emptyAction' | translate }}</span>
            </p-button>
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <aside
              class="flex h-full flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
            >
              <header class="border-b border-[var(--app-border)] px-4 py-3">
                <h2 class="text-sm font-semibold">
                  {{ 'watchlist.manager.groups' | translate }}
                </h2>
              </header>
              <ul class="flex-1 divide-y divide-[var(--app-border)] overflow-auto">
                @for (watchlist of store.watchlists(); track watchlist.id) {
                  <li>
                    <button
                      type="button"
                      class="flex w-full flex-col gap-1 px-4 py-3 text-start transition-colors hover:bg-[var(--app-bg-overlay)]"
                      [class.bg-[var(--app-bg-overlay)]]="watchlist.id === store.selectedId()"
                      (click)="store.select(watchlist.id)"
                    >
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm font-semibold">{{ watchlist.name }}</span>
                        <span class="text-xs text-[var(--app-fg-muted)]">
                          {{ watchlist.items.length }}
                        </span>
                      </div>
                      <span class="text-xs text-[var(--app-fg-muted)]">
                        {{ 'watchlist.manager.updated' | translate }}:
                        {{ (watchlist.updatedAt ?? watchlist.createdAt) | date: 'short' }}
                      </span>
                    </button>
                  </li>
                }
              </ul>
            </aside>
            <section class="lg:col-span-2">
              @if (selected(); as watchlist) {
                <app-watchlist-items [watchlist]="watchlist" />
              } @else {
                <div
                  class="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-6 text-center text-sm text-[var(--app-fg-muted)]"
                >
                  <i class="pi pi-arrow-left text-2xl" aria-hidden="true"></i>
                  <p>{{ 'watchlist.manager.selectPrompt' | translate }}</p>
                </div>
              }
            </section>
          </div>
        }
      </div>
    </div>
  `
})
export class WatchlistManagerComponent implements OnInit {
  readonly store = inject(WatchlistStore);
  private readonly notifications = inject(NotificationService);

  private readonly _creating = signal<boolean>(false);
  private readonly _newName = signal<string>('');

  readonly creating = this._creating.asReadonly();
  readonly newName = this._newName;

  readonly selected = computed<IWatchlist | null>(() => this.store.selectedWatchlist());

  readonly countLabel = computed<string>(() => {
    const lists = this.store.watchlists().length;
    const items = this.store.totalItems();
    return `${lists} � ${items}`;
  });

  readonly canCreate = computed<boolean>(() => this._newName().trim().length > 0);

  ngOnInit(): void {
    void this.store.refresh();
  }

  refresh(): void {
    void this.store.refresh();
  }

  toggleCreate(): void {
    this._creating.update((value) => !value);
    if (!this._creating()) {
      this._newName.set('');
    }
  }

  cancelCreate(): void {
    this._creating.set(false);
    this._newName.set('');
  }

  create(): void {
    const name = this._newName().trim();
    if (!name) {
      return;
    }
    this._creating.set(false);
    void this.store
      .create({ name })
      .then(() => {
        this._newName.set('');
      })
      .catch(() => {
        this.notifications.error('watchlist.error.title', 'watchlist.error.create');
      });
  }
}
