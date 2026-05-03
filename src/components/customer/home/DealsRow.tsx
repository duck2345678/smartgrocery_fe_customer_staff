import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../api/products';
import Skeleton from '../../ui/Skeleton';
import { pickTopDiscounted } from '../../../utils/homeUtils';
import { useRouter } from 'expo-router';

export default function DealsRow() {
  const router = useRouter();
  const productsQuery = useQuery({
    queryKey: ['home-deals'],
    queryFn: () => productApi.getProducts({ page: 0, size: 50 }),
    staleTime: 2 * 60 * 1000,
  });

  const deals = useMemo(() => {
    return pickTopDiscounted(productsQuery.data ?? [], 10);
  }, [productsQuery.data]);

  return (
    <View className="pb-4">
      <View className="px-6 flex-row items-center justify-between mb-3">
        <Text className="text-base font-outfit-bold text-slate-900">Giảm giá hot</Text>
        <Pressable onPress={() => router.push('/(customer)/shop' as never)} hitSlop={8}>
          <Text className="text-sm font-inter-bold text-emerald-700">Xem thêm</Text>
        </Pressable>
      </View>

      {productsQuery.isLoading ? (
        <View className="px-6 flex-row" style={{ gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-40 rounded-2xl" />
          ))}
        </View>
      ) : productsQuery.isError ? (
        <View className="px-6">
          <View className="bg-white border border-slate-100 rounded-2xl p-4">
            <Text className="text-sm font-inter text-slate-600">Không tải được sản phẩm giảm giá.</Text>
          </View>
        </View>
      ) : deals.length === 0 ? (
        <View className="px-6">
          <View className="bg-white border border-slate-100 rounded-2xl p-4">
            <Text className="text-sm font-inter text-slate-600">Hiện chưa có sản phẩm giảm giá.</Text>
          </View>
        </View>
      ) : (
        <View style={{ height: 196 }}>
          <FlashList
            data={deals}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            estimatedItemSize={170}
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
                className="w-40 bg-white border border-slate-100 rounded-2xl overflow-hidden"
              >
                <View className="w-full h-28 bg-slate-100">
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy="disk"
                    transition={200}
                  />
                  <View className="absolute top-2 left-2 px-2 py-1 rounded-full bg-red-500">
                    <Text className="text-white text-[10px] font-inter-bold">-{item.discountPercent}%</Text>
                  </View>
                </View>
                <View className="p-3">
                  <Text className="text-sm font-inter-bold text-slate-900" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-[11px] font-inter text-slate-500 mt-1" numberOfLines={1}>
                    {item.category}
                  </Text>
                  <View className="mt-2">
                    <Text className="text-base font-outfit-bold text-red-600">
                      {item.price.toLocaleString('vi-VN')}₫
                    </Text>
                    {typeof item.originalPrice === 'number' ? (
                      <Text className="text-[11px] font-inter text-slate-400 line-through">
                        {item.originalPrice.toLocaleString('vi-VN')}₫
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

