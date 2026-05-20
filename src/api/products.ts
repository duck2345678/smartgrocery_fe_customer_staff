import apiClient from './client';
import { Product } from '../types/product';
import { resolveImageUrl } from '../utils/imageUtils';

export type Category = { id: number; name: string };

type ProductListParams = {
  page?: number;
  size?: number;
  categoryId?: number;
  search?: string;
};

import { mapProductDto, ProductDto, ProductVariantDto, PageDto } from '../utils/mappers';

const coerceProductDtos = (value: unknown): ProductDto[] => {
  if (!value) return [];
  const unwrapped = value && typeof value === 'object' && 'data' in value ? (value as { data?: unknown }).data : value;
  if (Array.isArray(unwrapped)) return unwrapped as ProductDto[];
  if (typeof unwrapped === 'object' && unwrapped) {
    if ('items' in unwrapped && Array.isArray((unwrapped as { items?: unknown }).items)) {
      return (unwrapped as { items: ProductDto[] }).items;
    }
    if ('content' in unwrapped && Array.isArray((unwrapped as PageDto<ProductDto>).content)) {
      return (unwrapped as PageDto<ProductDto>).content ?? [];
    }
    if ('data' in unwrapped) return coerceProductDtos((unwrapped as { data?: unknown }).data);
  }
  return [];
};


export const productApi = {
  getProducts: async (params?: ProductListParams): Promise<Product[]> => {
    const queryParams: Record<string, unknown> = {
      page: params?.page ?? 0,
      size: params?.size ?? 20
    };
    if (params?.search) queryParams.search = params.search;
    if (params?.categoryId) queryParams.categoryId = params.categoryId;

    const response = await apiClient.get('/products', { params: queryParams });
    const dtos = coerceProductDtos(response.data);
    const mapped = dtos.map(mapProductDto);
    return mapped;
  },
  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    const dto = coerceProductDtos(response.data)[0] ?? (response.data as ProductDto);
    return mapProductDto(dto);
  },
  getProductDtoById: async (id: number): Promise<ProductDto> => {
    const response = await apiClient.get(`/products/${id}`);
    return coerceProductDtos(response.data)[0] ?? (response.data as ProductDto);
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    const raw = Array.isArray(response.data) ? response.data : [];
    return raw
      .map((c) => ({ id: Number((c as { id?: unknown }).id), name: String((c as { name?: unknown }).name ?? '') }))
      .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name);
  },
};
