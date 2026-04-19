import { useCallback, useRef, useState } from 'react';
import { Animated, RefreshControl, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import HomeHeader from '../../src/components/customer/home/HomeHeader';
import SearchBar from '../../src/components/customer/home/SearchBar';
import BannerCarousel from '../../src/components/customer/home/BannerCarousel';
import AiNudge from '../../src/components/customer/home/AiNudge';
import CategoryGrid from '../../src/components/customer/home/CategoryGrid';
import DealsRow from '../../src/components/customer/home/DealsRow';
import Button from '../../src/components/ui/Button';
import Skeleton from '../../src/components/ui/Skeleton';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../src/api/products';
import { useRouter } from 'expo-router';
import { type Product } from '../../src/types/product';

export default function CustomerHome() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const anim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 768 ? 3 : 2;
  const gap = 12;
  const paddingX = 24;
  const itemWidth = Math.floor((width - paddingX * 2 - gap * (columns - 1)) / columns);

  useFocusEffect(
    useCallback(() => {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      return () => {};
    }, [anim])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['home-deals'] }),
        queryClient.invalidateQueries({ queryKey: ['home-daily-products'] }),
        queryClient.invalidateQueries({ queryKey: ['home-ai-nudge'] }),
        queryClient.invalidateQueries({ queryKey: ['cart'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const dailyQuery = useInfiniteQuery({
    queryKey: ['home-daily-products'],
    queryFn: ({ pageParam }) => productApi.getProducts({ page: pageParam as number, size: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (!lastPage || lastPage.length < 10) return undefined;
      return (lastPageParam as number) + 1;
    },
    staleTime: 60 * 1000,
  });

  const dailyProducts = dailyQuery.data?.pages.flat() ?? [];

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const opacity = anim;

  const header = (
    <View>
      <SearchBar />
      <BannerCarousel />
      <AiNudge />
      <CategoryGrid />
      <DealsRow />
      <View className="px-6 pb-3">
        <Text className="text-base font-outfit-bold text-slate-900">Sản phẩm hàng ngày</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <HomeHeader />
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <FlashList
          data={dailyProducts}
          numColumns={columns}
          estimatedItemSize={280}
          keyExtractor={(i) => `${columns}-${i.id}`}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
          onEndReached={() => {
            if (dailyQuery.hasNextPage && !dailyQuery.isFetchingNextPage) void dailyQuery.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }: { item: Product; index: number }) => {
            const col = index % columns;
            const marginLeft = col === 0 ? paddingX : 0;
            const marginRight = col === columns - 1 ? paddingX : gap;
            return (
              <View style={{ width: itemWidth, marginLeft, marginRight, marginBottom: gap }}>
                <View
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden"
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
                      <Text className="text-base font-outfit-bold text-slate-900">
                        {item.price.toLocaleString('vi-VN')}₫
                      </Text>
                      <Text className="text-[11px] font-inter-bold text-slate-600">
                        {item.stock > 0 ? `Còn ${item.stock}` : 'Hết'}
                      </Text>
                    </View>
                    <View className="mt-2">
                      <Button
                        label="Xem"
                        variant="outline"
                        onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
                      />
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            dailyQuery.isLoading ? (
              <View className="px-6">
                <View className="flex-row flex-wrap" style={{ gap }}>
                  {Array.from({ length: columns * 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-2xl" style={{ width: itemWidth } as never} />
                  ))}
                </View>
              </View>
            ) : dailyQuery.isError ? (
              <View className="px-6">
                <View className="bg-white border border-slate-100 rounded-2xl p-4">
                  <Text className="text-sm font-inter text-slate-600">Không tải được sản phẩm.</Text>
                  <View className="mt-3">
                    <Button label="Thử lại" onPress={() => void dailyQuery.refetch()} variant="outline" />
                  </View>
                </View>
              </View>
            ) : (
              <View className="px-6">
                <Text className="text-slate-400 font-inter">Chưa có sản phẩm.</Text>
              </View>
            )
          }
          ListFooterComponent={
            dailyQuery.isFetchingNextPage ? (
              <View className="px-6 mt-2">
                <View className="flex-row flex-wrap" style={{ gap }}>
                  {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-56 rounded-2xl" style={{ width: itemWidth } as never} />
                  ))}
                </View>
              </View>
            ) : dailyQuery.hasNextPage ? (
              <View className="px-6 mt-2">
                <Button label="Tải thêm" onPress={() => void dailyQuery.fetchNextPage()} />
              </View>
            ) : (
              <View className="px-6 mt-2 pb-6 items-center">
                <Text className="text-xs font-inter text-slate-400">Bạn đã xem hết sản phẩm.</Text>
              </View>
            )
          }
        />
      </Animated.View>
    </View>
  );
}
