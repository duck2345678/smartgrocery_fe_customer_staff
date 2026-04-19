import apiClient from './client';
import { Product } from '../types/product';

export type Category = { id: number; name: string };

type ProductListParams = {
  page?: number;
  size?: number;
  categoryId?: number;
  search?: string;
};

type ProductVariantDto = {
  id: number;
  variantName?: string | null;
  unit?: string | null;
  netPrice?: number | string | null;
  stock?: number | null;
};

type CategoryDto = { id: number; name: string };

type ProductDto = {
  id: number;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  image?: string | null;
  category?: CategoryDto | null;
  variants?: ProductVariantDto[] | null;
};

type PageDto<T> = { content?: T[] };

const getFirstVariant = (dto: ProductDto): ProductVariantDto | undefined => {
  const vars = dto.variants ?? [];
  return Array.isArray(vars) ? vars[0] : undefined;
};

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const buildImageUrl = (name: string): string =>
  `https://dummyimage.com/800x600/22c55e/ffffff&text=${encodeURIComponent(name)}`;

const getOrigin = (): string => {
  const base = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1').replace(/\/+$/, '');
  return base.replace(/\/api\/v1$/i, '');
};

const resolveImageUrl = (input: unknown, fallbackName: string): string => {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return buildImageUrl(fallbackName);
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const origin = getOrigin();
  if (raw.startsWith('/')) return `${origin}${raw}`;
  return `${origin}/${raw}`;
};

const mapProductDto = (dto: ProductDto): Product => {
  const v = getFirstVariant(dto);
  return {
    id: dto.id,
    name: dto.name,
    variantId: v?.id,
    price: toNumber(v?.netPrice),
    unit: (v?.unit ?? 'unit') as string,
    stock: typeof v?.stock === 'number' ? v.stock : 0,
    imageUrl: resolveImageUrl(dto.image, dto.name),
    category: dto.category?.name ?? 'Khác',
    description: dto.description ?? dto.shortDescription ?? undefined,
  };
};

const coerceProductDtos = (value: unknown): ProductDto[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as ProductDto[];
  if (typeof value === 'object' && value) {
    if ('items' in value && Array.isArray((value as { items?: unknown }).items)) {
      return (value as { items: ProductDto[] }).items;
    }
    if ('content' in value && Array.isArray((value as PageDto<ProductDto>).content)) {
      return (value as PageDto<ProductDto>).content ?? [];
    }
    if ('data' in value) return coerceProductDtos((value as { data?: unknown }).data);
  }
  return [];
};

export const productApi = {
  getProducts: async (params?: ProductListParams): Promise<Product[]> => {
    const response = await apiClient.get('/products', { params });
    console.log('[productApi.getProducts] raw response.data type:', typeof response.data, 'keys:', response.data ? Object.keys(response.data) : 'null');
    const dtos = coerceProductDtos(response.data);
    console.log('[productApi.getProducts] parsed dtos count:', dtos.length);
    return dtos.map(mapProductDto);
  },
  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return mapProductDto(response.data as ProductDto);
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    const raw = Array.isArray(response.data) ? response.data : [];
    return raw
      .map((c) => ({ id: Number((c as { id?: unknown }).id), name: String((c as { name?: unknown }).name ?? '') }))
      .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name);
  },
};
