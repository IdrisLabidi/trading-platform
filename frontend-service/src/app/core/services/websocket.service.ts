import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { IWebSocketMessage } from '../models/websocket-message.model';

/**
 * Centralised WebSocket service used by every feature.
 *
 * - Lazily opens a single connection to `environment.websocketUrl`.
 * - Re-emits the raw incoming messages on the `messages$` stream.
 * - Notifies connection state via the `connected` signal.
 * - Cleans up on `disconnect()` and on Angular destroy.
 */
@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private readonly zone = inject(NgZone);
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly _connected = signal<boolean>(false);
  private readonly messagesSubject = new Subject<IWebSocketMessage<unknown>>();

  readonly connected = this._connected.asReadonly();
  readonly messages$: Observable<IWebSocketMessage<unknown>> = this.messagesSubject.asObservable();

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect(url: string = environment.websocketUrl): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      return;
    }
    this.openSocket(url);
  }

  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
    this._connected.set(false);
  }

  send<T>(message: IWebSocketMessage<T>): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private openSocket(url: string): void {
    try {
      this.socket = new WebSocket(url);
    } catch {
      this._connected.set(false);
      return;
    }
    this.socket.onopen = () => {
      this._connected.set(true);
    };
    this.socket.onclose = () => {
      this._connected.set(false);
      this.scheduleReconnect(url);
    };
    this.socket.onerror = () => {
      this._connected.set(false);
    };
    this.socket.onmessage = (event) => {
      let payload: IWebSocketMessage<unknown>;
      try {
        payload = JSON.parse(event.data) as IWebSocketMessage<unknown>;
      } catch {
        payload = { type: 'raw', payload: event.data, timestamp: new Date().toISOString() };
      }
      this.zone.run(() => this.messagesSubject.next(payload));
    };
  }

  private scheduleReconnect(url: string): void {
    if (this.reconnectTimer !== null) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket(url);
    }, 5000);
  }
}
