import type { IOrder, IOrderBook } from '../../features/orders/models/order.model';
import type {
  IPosition,
  IPortfolioSummary
} from '../../features/portfolio/models/portfolio.model';
import type { IPriceUpdate } from '../../features/markets/models/market.model';
import type { IAppNotification } from '../models/notification.model';

/**
 * Strongly typed Socket.IO event names exchanged with the realtime
 * gateway. Keep the wire vocabulary centralised so the producers and
 * the consumers stay in sync.
 */
export const REALTIME_EVENTS = {
  // Server -> client
  OrderUpdate: 'order:update',
  OrderCreated: 'order:created',
  OrderFilled: 'order:filled',
  OrderCancelled: 'order:cancelled',
  OrderBookUpdate: 'orderbook:update',
  PortfolioUpdate: 'portfolio:update',
  PortfolioPosition: 'portfolio:position',
  PriceUpdate: 'price:update',
  Notification: 'notification',
  // Client -> server
  Subscribe: 'subscribe',
  Unsubscribe: 'unsubscribe',
  Authenticate: 'authenticate'
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

/**
 * Event payload envelopes. Each server event carries a typed `data`
 * field; client-to-server events carry the list of topics.
 */
export interface IOrderUpdateEvent {
  readonly event: 'order:update' | 'order:created' | 'order:filled' | 'order:cancelled';
  readonly data: IOrder;
  readonly timestamp: string;
}

export interface IOrderBookUpdateEvent {
  readonly event: 'orderbook:update';
  readonly data: IOrderBook;
  readonly timestamp: string;
}

export interface IPortfolioUpdateEvent {
  readonly event: 'portfolio:update';
  readonly data: IPortfolioSummary;
  readonly timestamp: string;
}

export interface IPortfolioPositionEvent {
  readonly event: 'portfolio:position';
  readonly data: IPosition;
  readonly timestamp: string;
}

export interface IPriceUpdateEvent {
  readonly event: 'price:update';
  readonly data: IPriceUpdate;
  readonly timestamp: string;
}

export interface INotificationEvent {
  readonly event: 'notification';
  readonly data: IAppNotification;
  readonly timestamp: string;
}

/**
 * Discriminated union covering every server-to-client event. The
 * realtime service exposes a typed observable per variant so feature
 * code never has to inspect the discriminator manually.
 */
export type RealtimeServerEvent =
  | IOrderUpdateEvent
  | IOrderBookUpdateEvent
  | IPortfolioUpdateEvent
  | IPortfolioPositionEvent
  | IPriceUpdateEvent
  | INotificationEvent;

export interface ISubscribeMessage {
  readonly event: 'subscribe';
  readonly topics: readonly string[];
}

export interface IUnsubscribeMessage {
  readonly event: 'unsubscribe';
  readonly topics: readonly string[];
}

export interface IAuthenticateMessage {
  readonly event: 'authenticate';
  readonly token: string;
}

export type RealtimeClientMessage =
  | ISubscribeMessage
  | IUnsubscribeMessage
  | IAuthenticateMessage;

/** Standard topic prefixes used by the subscribe/unsubscribe channel. */
export const REALTIME_TOPICS = {
  Orders: (userId?: string) => (userId ? `orders:${userId}` : 'orders'),
  Portfolio: (userId?: string) => (userId ? `portfolio:${userId}` : 'portfolio'),
  Prices: (symbols?: readonly string[]) =>
    symbols && symbols.length > 0 ? `prices:${symbols.join(',')}` : 'prices',
  Notifications: (userId?: string) =>
    userId ? `notifications:${userId}` : 'notifications'
} as const;
