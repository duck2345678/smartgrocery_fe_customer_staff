import apiClient from './client';
import { type CompletePickingPayload, type StaffPickOrder } from '../utils/staffPickingUtils';

export type StaffOrderQueueItem = {
  id: number;
  orderNumber: string;
  status: string;
  customerId?: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  addressLine?: string | null;
  totalItems?: number | null;
  totalAmount?: number | null;
  assigneeId?: number | null;
  assigneeName?: string | null;
  leaseExpiresAt?: string | null;
  createdAt?: string | null;
};

export type AssignOrderResponse = {
  orderId: number;
  assigneeId: number | null;
  status: string;
  leaseExpiresAt: string | null;
};

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const mapQueueItem = (x: unknown): StaffOrderQueueItem => {
  const o = x as Record<string, unknown>;
  return {
    id: toNumber(o.id),
    orderNumber: String(o.orderNumber ?? ''),
    status: String(o.status ?? ''),
    customerId: typeof o.customerId === 'number' ? o.customerId : o.customerId != null ? toNumber(o.customerId) : null,
    customerName: typeof o.customerName === 'string' ? o.customerName : null,
    customerPhone: typeof o.customerPhone === 'string' ? o.customerPhone : null,
    addressLine: typeof o.addressLine === 'string' ? o.addressLine : null,
    totalItems: o.totalItems != null ? toNumber(o.totalItems) : null,
    totalAmount: o.totalAmount != null ? toNumber(o.totalAmount) : null,
    assigneeId: o.assigneeId != null ? toNumber(o.assigneeId) : null,
    assigneeName: typeof o.assigneeName === 'string' ? o.assigneeName : null,
    leaseExpiresAt: typeof o.leaseExpiresAt === 'string' ? o.leaseExpiresAt : null,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : null,
  };
};

const mapAssign = (x: unknown): AssignOrderResponse => {
  const o = x as Record<string, unknown>;
  return {
    orderId: toNumber(o.orderId),
    assigneeId: o.assigneeId != null ? toNumber(o.assigneeId) : null,
    status: String(o.status ?? ''),
    leaseExpiresAt: typeof o.leaseExpiresAt === 'string' ? o.leaseExpiresAt : null,
  };
};

const mapPickOrder = (x: unknown): StaffPickOrder => {
  const o = x as Record<string, unknown>;
  const itemsRaw = Array.isArray(o.items) ? o.items : [];
  return {
    orderId: toNumber(o.orderId),
    orderNumber: String(o.orderNumber ?? ''),
    status: String(o.status ?? ''),
    assigneeId: o.assigneeId != null ? toNumber(o.assigneeId) : null,
    leaseExpiresAt: typeof o.leaseExpiresAt === 'string' ? o.leaseExpiresAt : null,
    items: itemsRaw.map((it) => {
      const i = it as Record<string, unknown>;
      return {
        orderItemId: toNumber(i.orderItemId),
        variantId: toNumber(i.variantId),
        sku: String(i.sku ?? ''),
        productName: String(i.productName ?? ''),
        variantName: typeof i.variantName === 'string' ? i.variantName : null,
        aisleLocation: typeof i.aisleLocation === 'string' ? i.aisleLocation : null,
        orderedQuantity: toNumber(i.orderedQuantity),
        pickedQuantity: i.pickedQuantity != null ? toNumber(i.pickedQuantity) : null,
        allowSubstitution: Boolean(i.allowSubstitution),
        unitPrice: toNumber(i.unitPrice),
      };
    }),
  };
};

export const staffOrdersApi = {
  getQueue: async (): Promise<StaffOrderQueueItem[]> => {
    const res = await apiClient.get('/staff/orders/queue');
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(mapQueueItem);
  },

  assign: async (orderId: number): Promise<AssignOrderResponse> => {
    const res = await apiClient.post(`/staff/orders/${orderId}/assign`);
    return mapAssign(res.data);
  },

  heartbeat: async (orderId: number): Promise<AssignOrderResponse> => {
    const res = await apiClient.post(`/staff/orders/${orderId}/heartbeat`);
    return mapAssign(res.data);
  },

  release: async (orderId: number): Promise<AssignOrderResponse> => {
    const res = await apiClient.post(`/staff/orders/${orderId}/release`);
    return mapAssign(res.data);
  },

  getPickList: async (orderId: number): Promise<StaffPickOrder> => {
    const res = await apiClient.get(`/staff/orders/${orderId}/pick-list`);
    return mapPickOrder(res.data);
  },

  getSubstitutions: async (orderId: number, orderItemId: number): Promise<Array<{ variantId: number; name: string; price: number; stock: number; isRecommended: boolean }>> => {
    const res = await apiClient.get(`/staff/orders/${orderId}/substitutions`, { params: { orderItemId } });
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map((x) => {
      const o = x as Record<string, unknown>;
      return {
        variantId: toNumber(o.variantId),
        name: String(o.name ?? ''),
        price: toNumber(o.price),
        stock: toNumber(o.stock),
        isRecommended: Boolean(o.isRecommended),
      };
    });
  },

  completePicking: async (orderId: number, payload: CompletePickingPayload): Promise<StaffPickOrder> => {
    const res = await apiClient.post(`/staff/orders/${orderId}/complete-picking`, payload);
    return mapPickOrder(res.data);
  },
};
