import { type Category } from '../api/products';
import { type Product } from '../types/product';

export type PromoBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
};

export const defaultBanners: PromoBanner[] = [
  {
    id: 'b1',
    title: 'Flash Sale cuối tuần',
    subtitle: 'Giảm đến 40% cho hàng tươi sống',
    imageUrl: 'https://dummyimage.com/1200x600/22c55e/ffffff&text=Flash+Sale',
  },
  {
    id: 'b2',
    title: 'Miễn phí vận chuyển',
    subtitle: 'Đơn từ 199k',
    imageUrl: 'https://dummyimage.com/1200x600/14b8a6/ffffff&text=Free+Ship',
  },
  {
    id: 'b3',
    title: 'Mua nhiều tiết kiệm',
    subtitle: 'Combo gia đình 3–4 người',
    imageUrl: 'https://dummyimage.com/1200x600/0ea5e9/ffffff&text=Combo+Deal',
  },
];

export const computePseudoDiscountPercent = (productId: number): number => {
  const base = Math.abs(productId * 37) % 45;
  return Math.max(5, base);
};

export const pickTopDiscounted = (products: Product[], maxCount: number): Array<Product & { discountPercent: number }> => {
  const ranked = products.map((p) => ({ ...p, discountPercent: computePseudoDiscountPercent(p.id) }));
  ranked.sort((a, b) => b.discountPercent - a.discountPercent);
  return ranked.slice(0, Math.max(0, maxCount));
};

export const pickCategoryGrid = (categories: Category[], maxCount: number): Category[] =>
  categories.slice(0, Math.max(0, maxCount));

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const pickAiNudgeProducts = (products: Product[], maxCount: number): Product[] => {
  const hay = products.filter((p) => p.stock > 0);
  const score = (p: Product) => {
    const n = normalize(p.name);
    if (n.includes('trung')) return 100;
    if (n.includes('sua')) return 95;
    if (n.includes('gao')) return 70;
    if (n.includes('rau') || n.includes('ca rot') || n.includes('ca chua')) return 60;
    return 10;
  };

  const ranked = [...hay].sort((a, b) => score(b) - score(a));
  return ranked.slice(0, Math.max(0, maxCount));
};
