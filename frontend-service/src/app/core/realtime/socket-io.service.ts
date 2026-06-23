import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, PLATFORM_ID, inject, signal } from '@angular/core';
import { Subject, type Observable } from 'rxjs';
import { io, type Socket } from 'socket.io-client';

import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import type {
  RealtimeClientMessage,
  RealtimeEventName,
  RealtimeServerEvent
} from './realtime-events';
import { REALTIME_EVENTS } from './realtime-events';

/**
 * Connection status of the Socket.IO transport. Mirrors the
 * `connected` signal exposed to feature code.
 */
export type RealtimeConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface ISocketIoOptions {
  /** Override the URL configured in `environment.socketIoUrl`. */
  readonly url?: string;
  /** Override the namespace path. Defaults to `/`. */
  readonly namespace?: string;
  /** Optional list of topics to subscribe to right after connect. */
  readonly autoSubscribeTopics?: readonly string[];
  /** When `true`, the service silently reconnects on transient errors. */
  readonly autoReconnect?: boolean;
}

/**
 * Thin wrapper around `socket.io-client` providing:
 *  - A single application-wide connection (singleton).
 *  - Lifecycle signals (`status`, `connected`, `lastConnectedAt`).
 *  - Typed, per-event observables fed by an internal `Subject`.
 *  - Topic subscription helpers bound to the connected handshake.
 *
 * The class is environment-agnostic: it uses `AuthService` only to
 * forward the current Keycloak access token to the server when
 * `authenticate()` is called.
 */
@Injectable({ providedIn: 'root' })
export class SocketIoService {
  private readonly zone = inject(NgZone);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private socket: Socket | null = null;
  private currentUrl = '';
  private currentPath = '';
  private currentNamespace = '/';
  private readonly pendingTopics = new Set<string>();
  private readonly activeTopics = new Set<string>();

  private readonly _status = signal<RealtimeConnectionStatus>('disconnected');
  private readonly _connected = signal<boolean>(false);
  private readonly _lastConnectedAt = signal<string | null>(null);
  private readonly _lastError = signal<string | null>(null);
  private readonly events$ = new Subject<RealtimeServerEvent>();

  readonly status = this._status.asReadonly();
  readonly connected = this._connected.asReadonly();
  readonly lastConnectedAt = this._lastConnectedAt.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  /** Stream of every server-to-client event, discriminated by `event`. */
  readonly events: Observable<RealtimeServerEvent> = this.events$.asObservable();

  /**
   * Open a connection. Subsequent calls with different options restart
   * the underlying socket. Safe to call from the bootstrap path or a
   * feature service; the call is idempotent while a connection is open
   * with matching options.
   */
  connect(options: ISocketIoOptions = {}): void {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR/no-browser environments: no real socket, signals stay
      // at their defaults. Feature stores still work in read-only
      // mode because they fall back to their initial value.
      return;
    }
    const url = this.resolveUrl(options.url);
    const path = environment.socketIoPath;
    const namespace = options.namespace ?? '/';
    if (this.socket && this.isSameTarget(url, path, namespace)) {
      // Already wired to the right endpoint: just resubscribe.
      this.flushSubscriptions();
      return;
    }
    this.disconnect();
    this.currentUrl = url;
    this.currentPath = path;
    this.currentNamespace = namespace;
    this._status.set('connecting');
    this._lastError.set(null);

    const target = namespace === '/' ? url : `${url}${namespace}`;
    const socket: Socket = io(target, {
      path,
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: options.autoReconnect ?? true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10_000,
      auth: (cb) => cb(this.buildAuthPayload())
    });
    this.socket = socket;
    this.bindLifecycle(socket);
    this.bindEvents(socket);
    socket.connect();
  }

  /** Close the current connection and reset every signal. */
  disconnect(): void {
    if (!this.socket) {
      this._status.set('disconnected');
      this._connected.set(false);
      return;
    }
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.activeTopics.clear();
    this.pendingTopics.clear();
    this._connected.set(false);
    this._status.set('disconnected');
  }

  /** Returns the subscription observable for a given event name. */
  on(event: RealtimeEventName): Observable<RealtimeServerEvent> {
    return new Observable<RealtimeServerEvent>((subscriber) => {
      const subscription = this.events$.subscribe((payload) => {
        if (payload.event === event) {
          subscriber.next(payload);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Send a typed client message. Returns `false` if the transport is
   * not currently open so the caller can buffer for later delivery.
   */
  send(message: RealtimeClientMessage): boolean {
    if (!this.socket || !this.socket.connected) {
      return false;
    }
    this.socket.emit(message.event, message as unknown as Record<string, unknown>);
    return true;
  }

  /**
   * Subscribe to a list of topics. The call is queued and flushed as
   * soon as the socket transitions to the `connected` state.
   */
  subscribe(topics: readonly string[]): void {
    if (topics.length === 0) {
      return;
    }
    for (const topic of topics) {
      this.pendingTopics.add(topic);
    }
    this.flushSubscriptions();
  }

  /** Remove subscriptions from the gateway. */
  unsubscribe(topics: readonly string[]): void {
    if (topics.length === 0) {
      return;
    }
    const remaining: string[] = [];
    for (const topic of topics) {
      this.pendingTopics.delete(topic);
      if (this.activeTopics.delete(topic)) {
        remaining.push(topic);
      }
    }
    if (remaining.length > 0) {
      this.send({ event: REALTIME_EVENTS.Unsubscribe, topics: remaining });
    }
  }

  /** Forward the current access token to the server. */
  authenticate(token?: string): boolean {
    const accessToken = token ?? this.auth.getAccessToken();
    if (!accessToken) {
      return false;
    }
    return this.send({ event: REALTIME_EVENTS.Authenticate, token: accessToken });
  }

  // --- Internal helpers --------------------------------------------

  private flushSubscriptions(): void {
    if (!this.socket || !this.socket.connected) {
      return;
    }
    const fresh: string[] = [];
    for (const topic of this.pendingTopics) {
      if (!this.activeTopics.has(topic)) {
        fresh.push(topic);
      }
    }
    if (fresh.length === 0) {
      return;
    }
    if (this.send({ event: REALTIME_EVENTS.Subscribe, topics: fresh })) {
      for (const topic of fresh) {
        this.activeTopics.add(topic);
      }
    }
  }

  private bindLifecycle(socket: Socket): void {
    socket.on('connect', () => {
      this.zone.run(() => {
        this._connected.set(true);
        this._status.set('connected');
        this._lastConnectedAt.set(new Date().toISOString());
        this._lastError.set(null);
        this.flushSubscriptions();
      });
    });
    socket.on('disconnect', (reason: string) => {
      this.zone.run(() => {
        this._connected.set(false);
        this._status.set('disconnected');
        this._lastError.set(reason);
        this.activeTopics.clear();
      });
    });
    socket.io.on('reconnect_attempt', () => {
      this.zone.run(() => this._status.set('reconnecting'));
    });
    socket.io.on('reconnect_error', (err: Error) => {
      this.zone.run(() => {
        this._status.set('reconnecting');
        this._lastError.set(err.message);
      });
    });
    socket.on('connect_error', (err: Error) => {
      this.zone.run(() => {
        this._status.set('error');
        this._lastError.set(err.message);
      });
    });
  }

  private bindEvents(socket: Socket): void {
    const eventNames: RealtimeEventName[] = [
      REALTIME_EVENTS.OrderUpdate,
      REALTIME_EVENTS.OrderCreated,
      REALTIME_EVENTS.OrderFilled,
      REALTIME_EVENTS.OrderCancelled,
      REALTIME_EVENTS.OrderBookUpdate,
      REALTIME_EVENTS.PortfolioUpdate,
      REALTIME_EVENTS.PortfolioPosition,
      REALTIME_EVENTS.PriceUpdate,
      REALTIME_EVENTS.Notification
    ];
    for (const name of eventNames) {
      socket.on(name, (payload: unknown) => {
        const enriched = this.toServerEvent(name, payload);
        if (!enriched) {
          return;
        }
        this.zone.run(() => this.events$.next(enriched));
      });
    }
  }

  private toServerEvent(
    name: string,
    payload: unknown
  ): RealtimeServerEvent | null {
    if (
      payload &&
      typeof payload === 'object' &&
      'event' in (payload as Record<string, unknown>)
    ) {
      return payload as RealtimeServerEvent;
    }
    const timestamp = new Date().toISOString();
    return {
      event: name as RealtimeServerEvent['event'],
      data: payload,
      timestamp
    } as RealtimeServerEvent;
  }

  private resolveUrl(override?: string): string {
    if (override && override.length > 0) {
      return override;
    }
    const configured = environment.socketIoUrl;
    if (configured && configured.length > 0) {
      return configured;
    }
    if (isPlatformBrowser(this.platformId)) {
      // Same-origin fallback (production behind the gateway).
      return this.document.location.origin;
    }
    return '';
  }

  private isSameTarget(url: string, path: string, namespace: string): boolean {
    if (!this.socket) {
      return false;
    }
    if (this.currentUrl !== url || this.currentPath !== path) {
      return false;
    }
    return this.currentNamespace === namespace;
  }

  private buildAuthPayload(): Record<string, unknown> {
    const token = this.auth.getAccessToken();
    return token ? { token } : {};
  }
}
