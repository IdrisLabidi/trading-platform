import { Injectable, inject } from '@angular/core';
import { WebSocketService } from '../../../core/services/websocket.service';

@Injectable({ providedIn: 'root' })
export class MarketWebSocketService {
  private readonly ws = inject(WebSocketService);
}
