import { Injectable, signal } from '@angular/core';
import type { IWebSocketMessage } from '../models/websocket-message.model';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: WebSocket | null = null;
  private readonly _connected = signal<boolean>(false);
  readonly connected = this._connected.asReadonly();

  connect(url: string): void {
    if (this.socket) {
      return;
    }
    this.socket = new WebSocket(url);
    this.socket.onopen = () => this._connected.set(true);
    this.socket.onclose = () => this._connected.set(false);
    this.socket.onerror = () => this._connected.set(false);
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
    this._connected.set(false);
  }

  send<T>(message: IWebSocketMessage<T>): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
}
