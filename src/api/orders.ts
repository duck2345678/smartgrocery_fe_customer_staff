import apiClient from './client';
import { type Order, type Voucher } from '../types/order';

const coerceOrders = (value: unknown): Order[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as Order[];
  if (typeof value === 'object' && 'content' in value && Array.isArray((value as { content?: unknown }).content)) {
    return (value as { content: Order[] }).content;
  }
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

const toNumberOrNull = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const n = toNumberOrNull(value);
  return n == null ? fallback : n;
};

const toStringOrNull = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim() ? value : null;
};

const normalizeVoucher = (value: unknown): Voucher | null => {
  const raw = value && typeof value === 'object' && 'data' in value
    ? (value as { data?: unknown }).data
    : value;
  if (!raw || typeof raw !== 'object') return null;

  const o = raw as Record<string, unknown>;
  const id = toNumberOrNull(o.id ?? o.voucherId);
  if (id == null) return null;

  return {
    id,
    voucherCode: String(o.voucherCode ?? o.code ?? ''),
    description: toStringOrNull(o.description),
    discountType: String(o.discountType ?? 'FIXED_AMOUNT'),
    discountValue: toNumber(o.discountValue),
    minOrderAmount: toNumberOrNull(o.minOrderAmount),
    maxDiscountAmount: toNumberOrNull(o.maxDiscountAmount),
    validUntil: toStringOrNull(o.validUntil),
    hidden: Boolean(o.hidden),
    revealTrigger: toStringOrNull(o.revealTrigger) ?? 'PUBLIC',
    assignedUserId: toNumberOrNull(o.assignedUserId),
    unlockedByOrderId: toNumberOrNull(o.unlockedByOrderId),
    usageLimitPerVoucher: toNumberOrNull(o.usageLimitPerVoucher),
    claimCount: toNumberOrNull(o.claimCount),
    minAge: toNumberOrNull(o.minAge),
    maxAge: toNumberOrNull(o.maxAge),
    usedCount: toNumberOrNull(o.usedCount),
    status: toStringOrNull(o.status),
    claimedAt: toStringOrNull(o.claimedAt),
    claimed: Boolean(o.claimed),
    used: Boolean(o.used),
    usedAt: toStringOrNull(o.usedAt),
    claimStatus: toStringOrNull(o.claimStatus),
    claimExpiresAt: toStringOrNull(o.claimExpiresAt),
  };
};

const coerceVouchers = (value: unknown): Voucher[] => {
  const raw = value && typeof value === 'object' && 'data' in value
    ? (value as { data?: unknown }).data
    : value;
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeVoucher).filter((voucher): voucher is Voucher => voucher !== null);
};

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/orders/my-orders');
    return coerceOrders(response.data);
  },

  getAllOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get('/admin/orders', { params: { page: 0, size: 100 } });
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
    items?: { variantId: number; quantity: number }[];
  }): Promise<Order> => {
    const response = await apiClient.post('/orders/checkout', {
      addressId: input.addressId,
      paymentMethod: input.paymentMethod,
      customerNote: input.note,
      voucherCode: input.voucherCode,
      items: input.items,
    });
    return response.data as Order;
  },

  getClaimableVouchers: async (): Promise<Voucher[]> => {
    const response = await apiClient.get('/orders/vouchers/available');
    return coerceVouchers(response.data);
  },

  getClaimedVouchers: async (): Promise<Voucher[]> => {
    const response = await apiClient.get('/orders/vouchers/claimed');
    return coerceVouchers(response.data);
  },

  claimVoucher: async (voucherId: number): Promise<Voucher> => {
    const response = await apiClient.post(`/orders/vouchers/${voucherId}/claim`);
    const voucher = normalizeVoucher(response.data);
    if (!voucher) throw new Error('Không đọc được thông tin voucher vừa lưu.');
    return voucher;
  },

  cancelOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.post(`/orders/${id}/cancel`);
    return coerceOrder(response.data) as Order;
  },
};
