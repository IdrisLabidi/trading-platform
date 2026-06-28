import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';

import { WatchlistItemComponent } from './watchlist-item.component';
import { WatchlistStore } from '../stores/watchlist.store';
import { NotificationService } from '../../../core/services/notification.service';
import type { IWatchlist } from '../models/watchlist.model';

/**
 * Watchlist detail panel. Renders the items of a single watchlist
 * and exposes the controls to add / rename / remove the list and
 * to add / remove / update items. Pure presentation: every mutation
 * goes through `WatchlistStore`.
 */
@Component({
  selector: 'app-watchlist-items',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TagModule,
    CardModule,
    WatchlistItemComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="flex h-full flex-col gap-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg-elevated)] shadow-sm"
    >
      <header class="flex flex-col gap-2 border-b border-[var(--app-border)] px-4 py-3">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <i class="pi pi-bookmark text-sm text-[var(--app-fg-muted)]" aria-hidden="true"></i>
            <h2 class="text-sm font-semibold">{{ watchlist.name }}</h2>
          </div>
          <div class="flex items-center gap-2">
            <p-tag [value]="countLabel()" severity="info" [rounded]="true"></p-tag>
            <p-button
              size="small"
              [text]="true"
              severity="secondary"
              (onClick)="toggleRename()"
            >
              <i class="pi pi-pencil" pButtonIcon></i>
              <span pButtonLabel>{{ 'watchlist.items.rename' | translate }}</span>
            </p-button>
            <p-button
              size="small"
              [text]="true"
              severity="danger"
              (onClick)="onRemoveList()"
            >
              <i class="pi pi-trash" pButtonIcon></i>
              <span pButtonLabel>{{ 'watchlist.items.remove' | translate }}</span>
            </p-button>
          </div>
        </div>
        @if (renaming()) {
          <form
            class="flex flex-col gap-2 sm:flex-row sm:items-center"
            (submit)="$event.preventDefault(); commitRename()"
          >
            <input
              pInputText
              type="text"
              class="w-full"
              [ngModel]="renameValue()"
              (ngModelChange)="renameValue.set($event)"
              name="rename"
              autocomplete="off"
            />
            <p-button
              type="submit"
              size="small"
              [disabled]="!canRename()"
            >
              <span pButtonLabel>{{ 'watchlist.items.save' | translate }}</span>
            </p-button>
            <p-button
              type="button"
              size="small"
              severity="secondary"
              [outlined]="true"
              (onClick)="cancelRename()"
            >
              <span pButtonLabel>{{ 'common.cancel' | translate }}</span>
            </p-button>
          </form>
        }
      </header>

      <form
        class="grid grid-cols-1 gap-2 px-4 pb-3 sm:grid-cols-3 sm:items-end"
        (submit)="$event.preventDefault(); add()"
      >
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-xs text-[var(--app-fg-muted)]">
            {{ 'watchlist.items.field.symbol' | translate }}
          </span>
          <input
            pInputText
            type="text"
            class="w-full uppercase"
            [ngModel]="newSymbol()"
            (ngModelChange)="newSymbol.set($event)"
            name="symbol"
            placeholder="AAPL"
            autocomplete="off"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="text-xs text-[var(--app-fg-muted)]">
            {{ 'watchlist.items.field.targetPrice' | translate }}
          </span>
          <p-inputNumber
            class="w-full"
            [ngModel]="newTarget()"
            (ngModelChange)="newTarget.set($event)"
            name="target"
            [min]="0"
            [minFractionDigits]="2"
            [maxFractionDigits]="6"
            [placeholder]="'watchlist.items.field.targetPricePlaceholder' | translate"
          ></p-inputNumber>
        </label>
        <p-button
          type="submit"
          [disabled]="!canAdd()"
        >
          <span pButtonLabel>{{ 'watchlist.items.add' | translate }}</span>
        </p-button>
      </form>

      <div class="flex-1 overflow-auto px-4 pb-4">
        @if (watchlist.items.length === 0) {
          <div
            class="flex h-32 flex-col items-center justify-center gap-2 text-center text-sm text-[var(--app-fg-muted)]"
          >
            <i class="pi pi-inbox text-2xl" aria-hidden="true"></i>
            <p>{{ 'watchlist.items.empty' | translate }}</p>
          </div>
        } @else {
          <ul class="flex flex-col gap-2">
            @for (item of watchlist.items; track item.symbol) {
              <li>
                <app-watchlist-item
                  [watchlist]="watchlist"
                  [item]="item"
                  (remove)="onRemoveItem($event)"
                  (targetPriceChange)="onTargetPriceChange($event)"
                />
              </li>
            }
          </ul>
        }
      </div>
    </article>
  `
})
export class WatchlistItemsComponent {
  readonly store = inject(WatchlistStore);
  private readonly notifications = inject(NotificationService);

  private readonly _watchlist = signal<IWatchlist | null>(null);

  private readonly _renaming = signal<boolean>(false);
  private readonly _renameValue = signal<string>('');

  private readonly _newSymbol = signal<string>('');
  private readonly _newTarget = signal<number | null>(null);

  @Input({ required: true })
  set watchlist(value: IWatchlist) {
    this._watchlist.set(value);
    if (value) {
      this._renameValue.set(value.name);
    }
  }

  @Output() readonly remove = new EventEmitter<IWatchlist>();

  readonly renaming = this._renaming.asReadonly();
  readonly renameValue = this._renameValue.asReadonly();
  readonly newSymbol = this._newSymbol.asReadonly();
  readonly newTarget = this._newTarget.asReadonly();

  readonly countLabel = computed<string>(() => `${this._watchlist()?.items.length ?? 0}`);

  get watchlist(): IWatchlist {
    const value = this._watchlist();
    if (!value) {
      throw new Error('WatchlistItemsComponent: missing required `watchlist` input');
    }
    return value;
  }

  readonly canRename = computed<boolean>(() => {
    const current = this._watchlist();
    return this._renameValue().trim().length > 0 && this._renameValue().trim() !== current?.name;
  });

  readonly canAdd = computed<boolean>(() => this._newSymbol().trim().length > 0);

  toggleRename(): void {
    this._renaming.update((value) => !value);
    if (this._watchlist()) {
      this._renameValue.set(this._watchlist()!.name);
    }
  }

  cancelRename(): void {
    this._renaming.set(false);
    if (this._watchlist()) {
      this._renameValue.set(this._watchlist()!.name);
    }
  }

  commitRename(): void {
    if (!this.canRename()) {
      return;
    }
    const id = this._watchlist()?.id;
    if (!id) {
      return;
    }
    const name = this._renameValue().trim();
    this._renaming.set(false);
    void this.store.rename(id, { name }).catch(() => undefined);
  }

  add(): void {
    const watchlist = this._watchlist();
    if (!watchlist || !this.canAdd()) {
      return;
    }
    const symbol = this._newSymbol().trim().toUpperCase();
    const target = this._newTarget();
    this._newSymbol.set('');
    this._newTarget.set(null);
    void this.store
      .addItem(watchlist.id, { symbol, targetPrice: target ?? undefined })
      .catch(() => undefined);
  }

  onRemoveItem(symbol: string): void {
    const watchlist = this._watchlist();
    if (!watchlist) {
      return;
    }
    void this.store.removeItem(watchlist.id, symbol).catch(() => undefined);
  }

  onTargetPriceChange(update: { symbol: string; targetPrice: number | null }): void {
    const watchlist = this._watchlist();
    if (!watchlist) {
      return;
    }
    const target =
      update.targetPrice === null
        ? undefined
        : update.targetPrice;
    void this.store
      .updateItem(watchlist.id, update.symbol, {
        symbol: update.symbol,
        targetPrice: target
      })
      .catch(() => {
        this.notifications.error('watchlist.error.title', 'watchlist.error.itemUpdate');
      });
  }

  onRemoveList(): void {
    const watchlist = this._watchlist();
    if (!watchlist) {
      return;
    }
    this.remove.emit(watchlist);
  }
}
