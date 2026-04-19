import { useMemo } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../api/products';
import Skeleton from '../../ui/Skeleton';
import { pickCategoryGrid } from '../../../utils/homeUtils';
import { useRouter } from 'expo-router';
import { Apple, Beef, Carrot, Milk, Package, Percent, ShoppingBasket, Wheat } from 'lucide-react-native';

const iconFor = (name: string) => {
  const key = name.toLowerCase();
  if (key.includes('rau')) return Carrot;
  if (key.includes('trái') || key.includes('fruit')) return Apple;
  if (key.includes('sữa') || key.includes('trứng') || key.includes('dairy')) return Milk;
  if (key.includes('thịt') || key.includes('hải') || key.includes('sea')) return Beef;
  if (key.includes('khuyến') || key.includes('sale') || key.includes('giảm')) return Percent;
  if (key.includes('gạo') || key.includes('nhu')) return Wheat;
  return ShoppingBasket;
};

export default function CategoryGrid() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 768 ? 6 : 4;

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const categories = useMemo(() => pickCategoryGrid(categoriesQuery.data ?? [], 8), [categoriesQuery.data]);

  return (
    <View className="px-6 pb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-outfit-bold text-slate-900">Danh mục</Text>
        <Pressable onPress={() => router.push('/(customer)/shop' as never)} hitSlop={8}>
          <Text className="text-sm font-inter-bold text-emerald-700">Xem tất cả</Text>
        </Pressable>
      </View>

      {categoriesQuery.isLoading ? (
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" style={{ width: `${100 / columns - 3}%` } as never} />
          ))}
        </View>
      ) : categoriesQuery.isError ? (
        <View className="bg-white border border-slate-100 rounded-2xl p-4">
          <Text className="text-sm font-inter text-slate-600">Không tải được danh mục.</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {categories.map((c) => {
            const Icon = iconFor(c.name) ?? Package;
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/(customer)/shop', params: { categoryId: String(c.id) } } as never)}
                className="bg-white border border-slate-100 rounded-2xl items-center justify-center px-2"
                style={{ width: `${100 / columns - 3}%`, height: 86 }}
              >
                <View className="w-10 h-10 rounded-2xl bg-emerald-50 items-center justify-center">
                  <Icon size={20} color="#22C55E" />
                </View>
                <Text className="text-xs font-inter-bold text-slate-700 mt-2" numberOfLines={1}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

