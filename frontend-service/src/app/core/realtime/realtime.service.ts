import { DestroyRef, Injectable, Injector, effect, inject } from '@angular/core';
import { map, type Observable, type OperatorFunction } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../services/auth.service';
import type { IOrder, IOrderBook } from '../../features/orders/models/order.model';
import type {
  IPosition,
  IPortfolioSummary
} from '../../features/portfolio/models/portfolio.model';
import type { IPriceUpdate } from '../../features/markets/models/market.model';
import type { IAppNotification } from '../models/notification.model';

import { SocketIoService } from './socket-io.service';
import { REALTIME_EVENTS, REALTIME_TOPICS } from './realtime-events';
import type {
  INotificationEvent,
  IOrderBookUpdateEvent,
  IOrderUpdateEvent,
  IPortfolioPositionEvent,
  IPortfolioUpdateEvent,
  IPriceUpdateEvent
} from './realtime-events';

type ServerEventEnvelope =
  | IOrderUpdateEvent
  | IOrderBookUpdateEvent
  | IPortfolioUpdateEvent
  | IPortfolioPositionEvent
  | IPriceUpdateEvent
  | INotificationEvent;

/**
 * User-facing facade for the realtime layer.
 *
 * - Owns the bootstrap logic (open the socket, authenticate, expose
 *   observable streams).
 * - Re-issues the Keycloak bearer token after every successful refresh
 *   so the server-side session survives silent SSO renewals.
 * - Exposes typed `Observable<T>` streams per business concept so
 *   feature stores only need to subscribe and update their signals.
 *
 * No HTTP call is performed here. No UI is rendered. The class is a
 * pure service-layer bridge.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly socket = inject(SocketIoService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private bootstrapped = false;
  private ordersUserId: string | null = null;
  private portfolioUserId: string | null = null;
  private notificationsUserId: string | null = null;

  // --- Bootstrap ----------------------------------------------------

  /**
   * Idempotent bootstrap. The first caller opens the connection; the
   * subsequent calls only refresh the topic subscriptions (e.g. when
   * the user identity becomes available after a Keycloak refresh).
   */
  bootstrap(options: { userId?: string | null } = {}): void {
    if (!this.bootstrapped) {
      this.bootstrapped = true;
      this.socket.connect({ autoReconnect: true });
      // Re-authenticate whenever a new access token is emitted.
      effect(
        () => {
          const token = this.auth.token()?.accessToken;
          if (token) {
            this.socket.authenticate(token);
          }
        },
        { injector: this.injector }
      );
      // Tear the connection down with the application injector.
      this.destroyRef.onDestroy(() => this.socket.disconnect());
    }
    this.updateUserScopes(options.userId ?? this.auth.user()?.id ?? null);
  }

  /** Replace the user-scoped topic subscriptions. */
  setUserScope(userId: string | null): void {
    this.updateUserScopes(userId);
  }

  /** Tear the connection down (used by tests or explicit teardown). */
  shutdown(): void {
    this.socket.disconnect();
    this.bootstrapped = false;
    this.ordersUserId = null;
    this.portfolioUserId = null;
    this.notificationsUserId = null;
  }

  // --- Streams ------------------------------------------------------

  /** All order lifecycle updates (created, filled, cancelled, etc.). */
  orderUpdates$(): Observable<IOrder> {
    return this.socket
      .on(REALTIME_EVENTS.OrderUpdate)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IOrder>());
  }

  orderCreated$(): Observable<IOrder> {
    return this.socket
      .on(REALTIME_EVENTS.OrderCreated)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IOrder>());
  }

  orderFilled$(): Observable<IOrder> {
    return this.socket
      .on(REALTIME_EVENTS.OrderFilled)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IOrder>());
  }

  orderCancelled$(): Observable<IOrder> {
    return this.socket
      .on(REALTIME_EVENTS.OrderCancelled)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IOrder>());
  }

  orderBook$(): Observable<IOrderBook> {
    return this.socket
      .on(REALTIME_EVENTS.OrderBookUpdate)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IOrderBook>());
  }

  portfolioSummary$(): Observable<IPortfolioSummary> {
    return this.socket
      .on(REALTIME_EVENTS.PortfolioUpdate)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IPortfolioSummary>());
  }

  portfolioPosition$(): Observable<IPosition> {
    return this.socket
      .on(REALTIME_EVENTS.PortfolioPosition)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IPosition>());
  }

  priceUpdate$(): Observable<IPriceUpdate> {
    return this.socket
      .on(REALTIME_EVENTS.PriceUpdate)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IPriceUpdate>());
  }

  notifications$(): Observable<IAppNotification> {
    return this.socket
      .on(REALTIME_EVENTS.Notification)
      .pipe(takeUntilDestroyed(this.destroyRef), unwrapData<IAppNotification>());
  }

  // --- Topics -------------------------------------------------------

  subscribePrices(symbols: readonly string[]): void {
    if (symbols.length === 0) {
      return;
    }
    this.socket.subscribe([REALTIME_TOPICS.Prices(symbols)]);
  }

  unsubscribePrices(symbols: readonly string[]): void {
    if (symbols.length === 0) {
      return;
    }
    this.socket.unsubscribe([REALTIME_TOPICS.Prices(symbols)]);
  }

  // --- Internals ----------------------------------------------------

  private updateUserScopes(userId: string | null): void {
    if (userId) {
      this.subscribeUserScope(
        REALTIME_TOPICS.Orders,
        userId,
        () => (this.ordersUserId = userId)
      );
      this.subscribeUserScope(
        REALTIME_TOPICS.Portfolio,
        userId,
        () => (this.portfolioUserId = userId)
      );
      this.subscribeUserScope(
        REALTIME_TOPICS.Notifications,
        userId,
        () => (this.notificationsUserId = userId)
      );
    } else {
      this.clearUserScope(REALTIME_TOPICS.Orders, this.ordersUserId, (value) => {
        this.ordersUserId = value;
      });
      this.clearUserScope(REALTIME_TOPICS.Portfolio, this.portfolioUserId, (value) => {
        this.portfolioUserId = value;
      });
      this.clearUserScope(
        REALTIME_TOPICS.Notifications,
        this.notificationsUserId,
        (value) => {
          this.notificationsUserId = value;
        }
      );
    }
  }

  private subscribeUserScope(
    builder: (userId: string) => string,
    userId: string,
    commit: () => void
  ): void {
    this.socket.subscribe([builder(userId)]);
    commit();
  }

  private clearUserScope(
    builder: (userId: string) => string,
    previous: string | null,
    commit: (value: string | null) => void
  ): void {
    if (previous) {
      this.socket.unsubscribe([builder(previous)]);
    }
    commit(null);
  }
}

/**
 * Tiny utility operator that unwraps the typed `data` field of a
 * realtime event envelope. Kept local to this module so the
 * implementation stays dependency-free.
 */
function unwrapData<T>(): OperatorFunction<ServerEventEnvelope, T> {
  return (source) => source.pipe(map((event) => event.data as T));
}
