import { Product } from './product';

export type CartItem = {
  cartItemId?: number;
  variantId?: number;
  productId: Product['id'];
  name: Product['name'];
  price: Product['price'];
  unit: Product['unit'];
  imageUrl: Product['imageUrl'];
  stock: Product['stock'];
  quantity: number;
  originalPrice?: number;
  discountPercent?: number;
  source?: 'MANUAL' | 'AI' | string;
  aiListCode?: string;
  aiListName?: string | null;
};
