import apiClient from './client';
import { type CartItem } from '../types/cart';
import { type Product } from '../types/product';

type CartResponse = {
  items: CartItem[];
};

const coerceCart = (value: unknown): CartResponse => {
  if (!value) return { items: [] };
  if (Array.isArray(value)) return { items: value as CartItem[] };
  if (typeof value === 'object' && 'items' in value && Array.isArray((value as { items?: unknown }).items)) {
    return { items: (value as { items: CartItem[] }).items };
  }
  return { items: [] };
};

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get('/me/cart');
    return coerceCart(response.data);
  },

  addItem: async (input: { variantId: number; quantity: number } | { product: Product; quantity?: number }): Promise<CartResponse> => {
    if ('variantId' in input) {
      const response = await apiClient.post('/me/cart/items', { variantId: input.variantId, quantity: input.quantity });
      return coerceCart(response.data);
    }

    const response = await apiClient.post('/me/cart/items', { variantId: input.product.id, quantity: input.quantity ?? 1 });
    return coerceCart(response.data);
  },

  updateItemQuantity: async (input: { cartItemId: number; quantity: number } | { productId: number; quantity: number }): Promise<CartResponse> => {
    if ('cartItemId' in input) {
      const response = await apiClient.patch(`/me/cart/items/${input.cartItemId}`, { quantity: input.quantity });
      return coerceCart(response.data);
    }

    const response = await apiClient.patch(`/me/cart/items/${input.productId}`, { quantity: input.quantity });
    return coerceCart(response.data);
  },

  removeItem: async (input: { cartItemId: number } | { productId: number }): Promise<CartResponse> => {
    if ('cartItemId' in input) {
      const response = await apiClient.delete(`/me/cart/items/${input.cartItemId}`);
      return coerceCart(response.data);
    }

    const response = await apiClient.delete(`/me/cart/items/${input.productId}`);
    return coerceCart(response.data);
  },
};
