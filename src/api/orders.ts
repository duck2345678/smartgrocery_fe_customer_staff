import apiClient from './client';
import { type Order, type Voucher } from '../types/order';

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

const coerceOrder = (value: unknown): Order | null => {
  if (!value || typeof value !== 'object') return null;
  if ('data' in value && value.data) return value.data as Order;
  return value as Order;
};

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/my-orders');
    return coerceOrders(response.data);
  },

  getAllOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/admin/all');
    return coerceOrders(response.data);
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return coerceOrder(response.data) as Order;
  },

  createOrderFromCart: async (input: {
    addressId: number;
    paymentMethod: 'COD' | 'VNPAY';
    note?: string;
    voucherCode?: string;
  }): Promise<Order> => {
    const response = await apiClient.post('/orders/checkout', {
      addressId: input.addressId,
      paymentMethod: input.paymentMethod,
      customerNote: input.note,
      voucherCode: input.voucherCode,
    });
    return response.data as Order;
  },

  getAvailableVouchers: async (): Promise<Voucher[]> => {
    const response = await apiClient.get('/orders/vouchers/available');
    const value = response.data;
    if (Array.isArray(value)) return value as Voucher[];
    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown }).data)) {
      return (value as { data: Voucher[] }).data;
    }
    return [];
  },

  cancelOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.post(`/orders/${id}/cancel`);
    return coerceOrder(response.data) as Order;
  },
};
