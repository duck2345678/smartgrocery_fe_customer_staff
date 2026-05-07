import { useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../api/products';
import Skeleton from '../../ui/Skeleton';
import { pickCategoryGrid } from '../../../utils/homeUtils';
import { useRouter } from 'expo-router';

export default function CategoryGrid() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = width >= 768 ? 6 : 4;
  const [expanded, setExpanded] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const categories = useMemo(
    () => {
      const allCategories = categoriesQuery.data ?? [];
      return expanded ? allCategories : pickCategoryGrid(allCategories, 8);
    },
    [categoriesQuery.data, expanded]
  );

  return (
    <View className="px-6 pb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-outfit-bold text-text">Danh mục</Text>
        <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={8}>
          <Text className="text-sm font-inter-bold text-primary">{expanded ? 'Ẩn bớt' : 'Xem tất cả'}</Text>
        </Pressable>
      </View>

      {categoriesQuery.isLoading ? (
        <View className="flex-row" style={{ gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-24 rounded-2xl" />
          ))}
        </View>
      ) : categoriesQuery.isError ? (
        <View className="bg-surface border border-border rounded-2xl p-4">
          <Text className="text-sm font-inter text-muted">Không tải được danh mục.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/(customer)/shop', params: { categoryId: String(c.id) } } as never)}
              style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, minWidth: 80, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: '#16A34A', textAlign: 'center' }}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

