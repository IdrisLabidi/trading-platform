export interface ISortEvent<T = unknown> {
  readonly field: keyof T & string;
  readonly direction: 'asc' | 'desc';
}

export interface IFilter {
  readonly field: string;
  readonly value: string | number | boolean;
  readonly operator?: 'eq' | 'contains' | 'gt' | 'lt';
}
