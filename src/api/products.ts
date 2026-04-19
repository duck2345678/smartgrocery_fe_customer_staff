import apiClient from './client';
import { Product } from '../types/product';

export type Category = { id: number; name: string };

type ProductListParams = {
  page?: number;
  size?: number;
  categoryId?: number;
  search?: string;
};

const coerceProducts = (value: unknown): Product[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as Product[];
  if (typeof value === 'object' && 'items' in value && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: Product[] }).items;
  }
  return [];
};

export const productApi = {
  getProducts: async (params?: ProductListParams): Promise<Product[]> => {
    const response = await apiClient.get('/products', { params });
    return coerceProducts(response.data);
  },
  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data as Product;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return (Array.isArray(response.data) ? response.data : []) as Category[];
  },
};
