import { describe, expect, test } from 'vitest';
import { pickAiNudgeProducts, pickCategoryGrid, pickTopDiscounted } from './homeUtils';

describe('homeUtils', () => {
  test('pickTopDiscounted sorts by discount desc and limits', () => {
    const products = Array.from({ length: 20 }).map((_, i) => ({
      id: i + 1,
      name: `P${i + 1}`,
      price: 1,
      originalPrice: i < 12 ? 2 : undefined,
      discountPercent: i < 12 ? 10 + i : undefined,
      unit: 'unit',
      imageUrl: '',
      stock: 1,
      purchaseCount: 0,
      category: 'X',
    }));

    const picked = pickTopDiscounted(products, 10);
    expect(picked).toHaveLength(10);
    for (let i = 1; i < picked.length; i++) {
      expect(picked[i - 1].discountPercent).toBeGreaterThanOrEqual(picked[i].discountPercent);
    }
  });

  test('pickCategoryGrid returns first N categories', () => {
    const cats = Array.from({ length: 12 }).map((_, i) => ({ id: i + 1, name: `C${i + 1}` }));
    expect(pickCategoryGrid(cats, 8)).toHaveLength(8);
    expect(pickCategoryGrid(cats, 0)).toHaveLength(0);
  });

  test('pickAiNudgeProducts prefers eggs/milk when available', () => {
    const products = [
      { id: 1, name: 'Cà rốt', price: 1, unit: 'unit', imageUrl: '', stock: 10, purchaseCount: 0, category: 'Rau' },
      { id: 2, name: 'Trứng gà', price: 1, unit: 'unit', imageUrl: '', stock: 10, purchaseCount: 0, category: 'Sữa & trứng' },
      { id: 3, name: 'Sữa tươi', price: 1, unit: 'unit', imageUrl: '', stock: 10, purchaseCount: 0, category: 'Sữa & trứng' },
      { id: 4, name: 'Gạo ST25', price: 1, unit: 'unit', imageUrl: '', stock: 10, purchaseCount: 0, category: 'Nhu yếu phẩm' },
    ];

    const picked = pickAiNudgeProducts(products, 2);
    expect(picked).toHaveLength(2);
    expect(picked[0].name.toLowerCase()).toContain('trứng');
    expect(picked[1].name.toLowerCase()).toContain('sữa');
  });
});
