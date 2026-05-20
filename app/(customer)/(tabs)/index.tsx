import { useCallback, useRef, useState } from 'react';
import { Animated, RefreshControl, Text, useWindowDimensions, View, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Ticket } from 'lucide-react-native';
import { FlashSaleTimer } from '../../../src/components/customer/FlashSaleTimer';
import HomeHeader from '../../../src/components/customer/home/HomeHeader';
import SearchBar from '../../../src/components/customer/home/SearchBar';
import BannerCarousel from '../../../src/components/customer/home/BannerCarousel';
import AiNudge from '../../../src/components/customer/home/AiNudge';
import PersonalisedRecs from '../../../src/components/customer/home/PersonalisedRecs';
import DealsRow from '../../../src/components/customer/home/DealsRow';
import Button from '../../../src/components/ui/Button';
import Skeleton from '../../../src/components/ui/Skeleton';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../../src/api/products';
import { type Product } from '../../../src/types/product';

function ProductTile({ item, onPress }: { item: Product; onPress: () => void }) {
  const discountPercent = item.discountPercent ?? 0;
  const hasDiscount = discountPercent > 0;
  const stockRatio = Math.min(item.stock / 50, 1);

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}>
      <View style={{ width: '100%', height: 130, backgroundColor: '#F8FAFC' }}>
        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="disk" transition={200} />
        {hasDiscount ? (
          <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderBottomLeftRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter-Bold' }}>-{discountPercent}%</Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Outfit-Bold', color: '#0F172A' }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: '#64748B', marginTop: 2 }} numberOfLines={1}>
          {item.category}
        </Text>
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontFamily: 'Outfit-Bold', color: '#0F172A' }}>{item.price.toLocaleString('vi-VN')}₫</Text>
          {hasDiscount ? (
            <Text style={{ fontSize: 10, fontFamily: 'Inter-Regular', color: '#94A3B8', textDecorationLine: 'line-through', marginLeft: 6 }}>
              {(item.originalPrice ?? item.price).toLocaleString('vi-VN')}₫
            </Text>
          ) : null}
        </View>
        <View style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: '#334155' }}>Còn {item.stock}</Text>
          <View style={{ width: '100%', height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 4 }}>
            <View style={{ width: `${stockRatio * 100}%`, height: '100%', backgroundColor: '#16A34A', borderRadius: 2 }} />
          </View>
        </View>
        <Pressable 
          onPress={onPress} 
          style={{ marginTop: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#16A34A', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 13, fontFamily: 'Inter-Bold', color: '#16A34A' }}>Xem</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
      queryClient.invalidateQueries({ queryKey: ['home-daily-products'] });
      queryClient.invalidateQueries({ queryKey: ['home-deals'] });
      queryClient.invalidateQueries({ queryKey: ['home-ai-nudge'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      return () => {};
    }, [anim, queryClient])
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
      <PersonalisedRecs />
      <DealsRow />
      
      {/* Vouchers Entry */}
      <Pressable 
        onPress={() => router.push('/(customer)/vouchers' as never)}
        className="mx-6 mb-6 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-row items-center p-4"
      >
        <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center mr-4">
          <Ticket size={24} color="#16A34A" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-outfit-bold text-slate-900">Mã giảm giá & Ưu đãi</Text>
          <Text className="text-xs font-inter text-slate-500">Lưu ngay mã giảm giá đến 50% hôm nay</Text>
        </View>
        <View className="bg-primary/5 px-3 py-1.5 rounded-full">
          <Text className="text-[10px] font-inter-bold text-primary uppercase">Nhận ngay</Text>
        </View>
      </Pressable>

      <View className="px-6 pb-3 flex-row items-center justify-between">
        <Text className="text-base font-outfit-bold text-text">Sản phẩm hằng ngày</Text>
        <View className="px-3 py-1 rounded-full border border-border bg-surface">
          <Text className="text-[11px] font-inter text-muted">{dailyProducts.length} sản phẩm</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 240, backgroundColor: '#EBF5EC', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }} />
      <HomeHeader />
      <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
        <FlashList
          data={dailyProducts}
          numColumns={columns}
          estimatedItemSize={280}
          keyExtractor={(i) => `${columns}-${i.id}`}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}
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
                <ProductTile item={item} onPress={() => router.push(`/(customer)/products/${item.id}` as never)} />
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
                <View className="bg-surface border border-border rounded-3xl p-4">
                  <Text className="text-sm font-inter text-muted">Không tải được sản phẩm.</Text>
                  <View className="mt-3">
                    <Button label="Thử lại" onPress={() => void dailyQuery.refetch()} variant="outline" />
                  </View>
                </View>
              </View>
            ) : (
              <View className="px-6">
                <Text className="text-muted font-inter">Chưa có sản phẩm.</Text>
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
                <Text className="text-xs font-inter text-muted">Bạn đã xem hết sản phẩm.</Text>
              </View>
            )
          }
        />
      </Animated.View>
    </View>
  );
}
