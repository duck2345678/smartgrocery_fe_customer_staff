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
  stock?: number | string | null;
  inventoryStock?: number | string | null;
};

type CategoryDto = { id: number; name: string; categoryName?: string | null };

type ProductDto = {
  id: number;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  category?: CategoryDto | null;
  categoryName?: string | null;
  variants?: ProductVariantDto[] | null;
  productVariants?: ProductVariantDto[] | null;
  soldCount?: number | string | null;
  sold_count?: number | string | null;
  purchaseCount?: number | string | null;
  purchase_count?: number | string | null;
  totalSold?: number | string | null;
  total_sold?: number | string | null;
};

type PageDto<T> = { content?: T[] };

const getFirstVariant = (dto: ProductDto): ProductVariantDto | undefined => {
  const vars = dto.variants ?? dto.productVariants ?? [];
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
    dto.purchaseCount ?? dto.purchase_count ?? dto.soldCount ?? dto.sold_count ?? dto.totalSold ?? dto.total_sold,
  );
  const categoryName = dto.category?.name ?? dto.category?.categoryName ?? dto.categoryName ?? 'Khác';
  return {
    id: dto.id,
    name: dto.name,
    variantId: v?.id,
    price,
    originalPrice: hasDiscount ? compareAtPrice : undefined,
    discountPercent: hasDiscount ? discountPercent : undefined,
    unit: (v?.unit ?? v?.unit_name ?? 'unit') as string,
    stock: toNumber(v?.stock ?? v?.inventoryStock),
    purchaseCount,
    imageUrl: resolveImageUrl(dto.image ?? dto.imageUrl, dto.name) ?? '',
    category: categoryName,
    description: dto.description ?? dto.shortDescription ?? undefined,
  };
};

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

const filterProductDtos = (dtos: ProductDto[], params?: ProductListParams): ProductDto[] => {
  if (!params) return dtos;
  const searchTerm = params.search?.trim().toLowerCase();
  const categoryId = params.categoryId;

  return dtos.filter((dto) => {
    const matchesCategory =
      categoryId == null ||
      (dto.category != null && Number(dto.category.id) === Number(categoryId));
    if (!matchesCategory) return false;

    if (!searchTerm) return true;

    const text = [dto.name, dto.description, dto.shortDescription, dto.category?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return text.includes(searchTerm);
  });
};

export const productApi = {
  getProducts: async (params?: ProductListParams): Promise<Product[]> => {
    const queryParams: Record<string, unknown> = {};
    if (typeof params?.page === 'number') queryParams.page = params.page;
    if (typeof params?.size === 'number') queryParams.size = params.size;

    if (params?.search || params?.categoryId) {
      queryParams.page = params?.page ?? 0;
      queryParams.size = params?.size ?? 100;
    }

    const response = await apiClient.get('/products', { params: queryParams });
    const dtos = coerceProductDtos(response.data);
    const filtered = filterProductDtos(dtos, params);
    const mapped = filtered.map(mapProductDto);
    return mapped.sort((a, b) => b.purchaseCount - a.purchaseCount);
  },
  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    const dto = coerceProductDtos(response.data)[0] ?? (response.data as ProductDto);
    return mapProductDto(dto);
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    const raw = Array.isArray(response.data) ? response.data : [];
    return raw
      .map((c) => ({ id: Number((c as { id?: unknown }).id), name: String((c as { name?: unknown }).name ?? '') }))
      .filter((c) => Number.isFinite(c.id) && c.id > 0 && c.name);
  },
};
