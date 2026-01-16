export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface Order {
  id: number;
  customerId: number;
  product: string;
  amount: number;
}
