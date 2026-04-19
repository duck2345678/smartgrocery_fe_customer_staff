import { CartItem } from './cart';

export type OrderStatus = 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export type Order = {
  id: number;
  code: string;
  createdAt: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
};

