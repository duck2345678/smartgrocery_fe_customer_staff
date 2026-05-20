import apiClient from './client';

export type SmartListVariant = {
  id: number;
  name: string;
  price: number;
  unit: string;
};

export type SmartListItem = {
  id: number;
  variant: SmartListVariant;
  quantity: number;
  note: string | null;
  createdAt: string;
};

export type SmartList = {
  id: number;
  name: string;
  type: 'SHOPPING' | 'MEAL_PLAN';
  note: string | null;
  items: SmartListItem[];
  createdAt: string;
  updatedAt: string;
};

const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));

const mapItem = (x: unknown): SmartListItem => {
  const o = x as Record<string, unknown>;
  const v = (o.variant ?? {}) as Record<string, unknown>;
  return {
    id: toNum(o.id),
    variant: {
      id: toNum(v.id),
      name: String(v.name ?? v.variantName ?? ''),
      price: toNum(v.netPrice ?? v.net_price ?? v.price ?? 0),
      unit: String(v.unit ?? v.unit_name ?? ''),
    },
    quantity: toNum(o.quantity),
    note: typeof o.note === 'string' ? o.note : null,
    createdAt: String(o.createdAt ?? ''),
  };
};

const mapList = (x: unknown): SmartList => {
  const o = x as Record<string, unknown>;
  return {
    id: toNum(o.id),
    name: String(o.name ?? ''),
    type: o.type === 'MEAL_PLAN' ? 'MEAL_PLAN' : 'SHOPPING',
    note: typeof o.note === 'string' ? o.note : null,
    items: Array.isArray(o.items) ? o.items.map(mapItem) : [],
    createdAt: String(o.createdAt ?? ''),
    updatedAt: String(o.updatedAt ?? ''),
  };
};

export const smartListsApi = {
  getUserLists: async (userId: number): Promise<SmartList[]> => {
    const res = await apiClient.get(`/smart-lists/user/${userId}`);
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(mapList);
  },

  createList: async (userId: number, name: string, type: SmartList['type'] = 'SHOPPING'): Promise<SmartList> => {
    const res = await apiClient.post(`/smart-lists/${userId}`, null, { params: { name, type } });
    return mapList(res.data);
  },

  deleteList: async (listId: number): Promise<void> => {
    await apiClient.delete(`/smart-lists/${listId}`);
  },

  addItem: async (listId: number, variantId: number, quantity: number): Promise<SmartListItem> => {
    const res = await apiClient.post(`/smart-lists/${listId}/items`, null, {
      params: { variantId, quantity },
    });
    return mapItem(res.data);
  },

  removeItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/smart-lists/items/${itemId}`);
  },
};
