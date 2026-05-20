export type Product = {
  id: number;
  name: string;
  variantId?: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  unit: string;
  imageUrl: string;
  stock: number;
  purchaseCount: number;
  category: string;
  rating?: number;
  description?: string;
  flashSaleEndsAt?: string;
};
