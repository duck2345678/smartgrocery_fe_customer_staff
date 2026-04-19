import apiClient from './client';
import { type CartItem } from '../types/cart';
import { type Product } from '../types/product';

type CartResponse = { items: CartItem[] };

type CartItemDto = {
  id: number;
  productId: number;
  variantId: number;
  variantName: string;
  unit: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  allowSubstitution?: boolean | null;
  subtotal: number;
  imageUrl?: string | null;
  stock?: number | null;
};

type CartDto = {
  id: number;
  userId: number;
  items: CartItemDto[];
  totalAmount: number;
  updatedAt: string;
};

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const getOrigin = (): string => {
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1').replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/i, '');
};

const resolveImageUrl = (input: unknown): string => {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return 'https://dummyimage.com/800x600/22c55e/ffffff&text=SmartGrocery';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const origin = getOrigin();
  if (raw.startsWith('/')) return `${origin}${raw}`;
  return `${origin}/${raw}`;
};

const mapCartDto = (value: unknown): CartResponse => {
  const dto = value as CartDto;
  const items = Array.isArray(dto?.items) ? dto.items : [];
  return {
    items: items.map((i) => ({
      cartItemId: i.id,
      productId: i.productId,
      variantId: i.variantId,
      name: i.productName,
      price: toNumber(i.unitPrice),
      unit: i.unit,
      imageUrl: resolveImageUrl(i.imageUrl),
      stock: typeof i.stock === 'number' ? i.stock : 0,
      quantity: i.quantity,
      allowSubstitution: Boolean(i.allowSubstitution),
    })),
  };
};

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get('/carts/my-cart');
    return mapCartDto(response.data);
  },

  addItem: async (input: { variantId: number; quantity: number } | { product: Product; quantity?: number }): Promise<CartResponse> => {
    if ('variantId' in input) {
      const response = await apiClient.post('/carts/add', { variantId: input.variantId, quantity: input.quantity });
      return mapCartDto(response.data);
    }

    const response = await apiClient.post('/carts/add', {
      variantId: input.product.variantId ?? input.product.id,
      quantity: input.quantity ?? 1,
    });
    return mapCartDto(response.data);
  },

  updateItemQuantity: async (input: { cartItemId: number; quantity: number }): Promise<CartResponse> => {
    const response = await apiClient.patch(`/carts/item/${input.cartItemId}`, { quantity: input.quantity });
    return mapCartDto(response.data);
  },

  updateAllowSubstitution: async (input: { cartItemId: number; allowSubstitution: boolean }): Promise<CartResponse> => {
    const response = await apiClient.patch(`/carts/item/${input.cartItemId}`, { allowSubstitution: input.allowSubstitution });
    return mapCartDto(response.data);
  },

  removeItem: async (input: { cartItemId: number }): Promise<CartResponse> => {
    const response = await apiClient.delete(`/carts/item/${input.cartItemId}`);
    return mapCartDto(response.data);
  },
};
