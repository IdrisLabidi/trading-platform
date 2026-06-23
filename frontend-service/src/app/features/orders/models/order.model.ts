export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface IOrder {
  readonly id: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly type: OrderType;
  readonly quantity: number;
  readonly price: number;
  readonly status: OrderStatus;
  readonly createdAt: string;
}

export interface IOrderBook {
  readonly symbol: string;
  readonly bids: readonly { price: number; quantity: number }[];
  readonly asks: readonly { price: number; quantity: number }[];
}

export interface IOpenOrder extends IOrder {
  readonly remainingQuantity: number;
}
