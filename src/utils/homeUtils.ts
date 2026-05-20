import { type Category } from '../api/products';
import { type Product } from '../types/product';
import bannerFlashSale from '../assets/banners/banner-flash-sale.png';
import bannerComboDeal from '../assets/banners/banner-combo-deal.png';
import bannerFreeship from '../assets/banners/banner-freeship.png';

export type PromoBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageSource?: number;
};

export const defaultBanners: PromoBanner[] = [
  {
    id: 'b1',
    title: 'Flash Sale',
    subtitle: 'Giảm giá giờ vàng, lên đến 50%',
    imageSource: bannerFlashSale,
  },
  {
    id: 'b2',
    title: 'Siêu Combo Deal',
    subtitle: 'Tiết kiệm đến 30% cho combo thịt bò cao cấp',
    imageSource: bannerComboDeal,
  },
  {
    id: 'b3',
    title: 'Freeship toàn quốc',
    subtitle: 'Miễn phí giao hàng cho đơn từ 200.000đ',
    imageSource: bannerFreeship,
  },
];

export const pickTopDiscounted = (products: Product[], maxCount: number): Array<Product & { discountPercent: number }> => {
  const ranked = products
    .filter((p): p is Product & { discountPercent: number } => typeof p.discountPercent === 'number' && p.discountPercent > 0)
    .map((p) => ({ ...p, discountPercent: p.discountPercent }));
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
