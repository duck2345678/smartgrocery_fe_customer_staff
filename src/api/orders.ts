import apiClient from './client';
import { type Order } from '../types/order';

const coerceOrders = (value: unknown): Order[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as Order[];
  if (typeof value === 'object' && 'items' in value && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: Order[] }).items;
  }
  if (typeof value === 'object' && 'data' in value && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: Order[] }).data;
  }
  return [];
};

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/my-orders');
    return coerceOrders(response.data);
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data as Order;
  },

  createOrderFromCart: async (input: {
    addressId: number;
    paymentMethod: 'COD' | 'VNPAY';
    note?: string;
    items: Array<{ variantId: number; quantity: number; allowSubstitution: boolean }>;
  }): Promise<Order> => {
    const response = await apiClient.post('/orders/checkout', {
      addressId: input.addressId,
      paymentMethod: input.paymentMethod,
      customerNote: input.note,
      items: input.items,
    });
    return response.data as Order;
  },
};
