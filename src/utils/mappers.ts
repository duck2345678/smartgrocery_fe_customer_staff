import { Product } from '../types/product';
import { resolveImageUrl } from './imageUtils';

export type PageDto<T> = { content?: T[] };

export type ProductVariantDto = {
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
  flashSaleEndsAt?: string | null;
  flash_sale_ends_at?: string | null;
  barcode?: string | null;
  sku?: string | null;
  weightGram?: number | string | null;
  packageSize?: string | null;
  color?: string | null;
  size?: string | null;
};

export type CategoryDto = { id: number; name: string; categoryName?: string | null };

export type ProductDto = {
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
  status?: string | null;
  isFeatured?: boolean | null;
  brand?: string | null;
  productCode?: string | null;
  originCountry?: string | null;
};

export const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export const getFirstVariant = (dto: ProductDto): ProductVariantDto | undefined => {
  const vars = dto.variants ?? dto.productVariants ?? [];
  return Array.isArray(vars) ? vars[0] : undefined;
};

export const mapProductDto = (dto: ProductDto): Product => {
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
    flashSaleEndsAt: (v?.flashSaleEndsAt ?? v?.flash_sale_ends_at) as string | undefined,
  };
};
