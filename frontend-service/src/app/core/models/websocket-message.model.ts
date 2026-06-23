export interface IWebSocketMessage<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: string;
}
