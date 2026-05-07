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

type ProductVariantDto = {
  id: number;
  variantName?: string | null;
  variant_name?: string | null;
  unit?: string | null;
  unit_name?: string | null;
  netPrice?: number | string | null;
  net_price?: number | string | null;
  compareAtPrice?: number | string | null;
  compare_at_price?: number | string | null;
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
  soldCount?: number | string | null;
  sold_count?: number | string | null;
  purchaseCount?: number | string | null;
  purchase_count?: number | string | null;
  totalSold?: number | string | null;
  total_sold?: number | string | null;
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



const mapProductDto = (dto: ProductDto): Product => {
  const v = getFirstVariant(dto);
  const price = toNumber(v?.netPrice ?? v?.net_price);
  const compareAtPrice = toNumber(v?.compareAtPrice ?? v?.compare_at_price);
  const hasDiscount = compareAtPrice > price && price > 0;
  const discountPercent = hasDiscount ? Math.round((1 - price / compareAtPrice) * 100) : undefined;
  const purchaseCount = toNumber(
    dto.purchaseCount ?? dto.purchase_count ?? dto.soldCount ?? dto.sold_count ?? dto.totalSold ?? dto.total_sold
  );
  return {
    id: dto.id,
    name: dto.name,
    variantId: v?.id,
    price,
    originalPrice: hasDiscount ? compareAtPrice : undefined,
    discountPercent: hasDiscount ? discountPercent : undefined,
    unit: (v?.unit ?? v?.unit_name ?? 'unit') as string,
    stock: typeof v?.stock === 'number' ? v.stock : 0,
    purchaseCount,
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
    const dtos = coerceProductDtos(response.data);
    const mapped = dtos.map(mapProductDto);
    return mapped.sort((a, b) => b.purchaseCount - a.purchaseCount);
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
