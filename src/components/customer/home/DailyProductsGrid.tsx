import { useMemo } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { productApi } from '../../../api/products';
import { Image } from 'expo-image';
import Skeleton from '../../ui/Skeleton';
import Button from '../../ui/Button';
import { useRouter } from 'expo-router';

const getColumns = (width: number) => {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
};

export default function DailyProductsGrid() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columns = getColumns(width);

  const q = useInfiniteQuery({
    queryKey: ['home-daily-products'],
    queryFn: ({ pageParam }) => productApi.getProducts({ page: pageParam as number, size: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (!lastPage || lastPage.length < 10) return undefined;
      return (lastPageParam as number) + 1;
    },
    staleTime: 60 * 1000,
  });

  const products = useMemo(() => q.data?.pages.flat() ?? [], [q.data?.pages]);

  return (
    <View className="px-6 pb-10">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-outfit-bold text-slate-900">Sản phẩm hàng ngày</Text>
        <Pressable onPress={() => router.push('/(customer)/shop' as never)} hitSlop={8}>
          <Text className="text-sm font-inter-bold text-primary">Mua sắm</Text>
        </Pressable>
      </View>

      {q.isLoading ? (
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {Array.from({ length: columns * 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" style={{ width: `${100 / columns - 3}%` } as never} />
          ))}
        </View>
      ) : q.isError ? (
        <View className="bg-white border border-slate-100 rounded-2xl p-4">
          <Text className="text-sm font-inter text-slate-600">Không tải được sản phẩm.</Text>
          <View className="mt-3">
            <Button label="Thử lại" onPress={() => void q.refetch()} variant="outline" />
          </View>
        </View>
      ) : (
        <>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {products.map((item) => (
              <Pressable
                key={`${columns}-${item.id}`}
                onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
                style={{ width: `${100 / columns - 3}%` }}
              >
                <View className="w-full h-28 bg-slate-100">
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy="disk"
                    transition={200}
                  />
                </View>
                <View className="p-3">
                  <Text className="text-sm font-inter-bold text-slate-900" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-[11px] font-inter text-slate-500 mt-1" numberOfLines={1}>
                    {item.category}
                  </Text>
                  <View className="flex-row items-end justify-between mt-2">
                    <Text className="text-base font-outfit-bold text-slate-900">{item.price.toLocaleString('vi-VN')}₫</Text>
                    <Text className="text-[11px] font-inter-bold text-slate-600">{item.stock > 0 ? `Còn ${item.stock}` : 'Hết'}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {q.isFetchingNextPage ? (
            <View className="mt-4 flex-row flex-wrap" style={{ gap: 12 }}>
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" style={{ width: `${100 / columns - 3}%` } as never} />
              ))}
            </View>
          ) : q.hasNextPage ? (
            <View className="mt-4">
              <Button label="Tải thêm" onPress={() => void q.fetchNextPage()} />
            </View>
          ) : (
            <View className="mt-4 items-center">
              <Text className="text-xs font-inter text-slate-400">Bạn đã xem hết sản phẩm.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}
