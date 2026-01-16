import type { ColumnValue } from './index';

export interface JoinedOrder extends Record<string, ColumnValue> {
  order_id: number;
  product: string;
  amount: number;
  customer_name: string | null;
  customer_email: string | null;
}
