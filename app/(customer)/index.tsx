import { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productApi, type Category } from '../../src/api/products';
import { Product } from '../../src/types/product';
import { clsx } from 'clsx';
import CartButton from '../../src/components/customer/CartButton';
import { Search, RefreshCw } from 'lucide-react-native';

export default function CustomerHome() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const categories: Category[] = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { categoryId: selectedCategory }],
    queryFn: () => productApi.getProducts({ categoryId: selectedCategory }),
  });

  const products = useMemo(() => data ?? [], [data]);

  const handleCategoryPress = useCallback((catId: number) => {
    setSelectedCategory((prev) => (prev === catId ? undefined : catId));
  }, []);

  const renderItem = ({ item }: { item: Product }) => {
    const isOut = item.stock <= 0;
    return (
      <Pressable
        onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
        className="mb-4 bg-white border border-slate-100 rounded-2xl overflow-hidden"
      >
        <View className="w-full h-44 bg-slate-100">
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="disk"
          />
        </View>

        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-outfit-bold text-slate-900" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-slate-500 font-inter mt-1">{item.category}</Text>
            </View>
            <View className={clsx('px-2.5 py-1 rounded-full border', isOut ? 'bg-slate-100 border-slate-200' : 'bg-emerald-50 border-emerald-200')}>
              <Text className={clsx('text-[10px] font-inter-bold', isOut ? 'text-slate-500' : 'text-emerald-700')}>
                {isOut ? 'HẾT HÀNG' : `CÒN ${item.stock}`}
              </Text>
            </View>
          </View>

          <View className="flex-row items-end justify-between mt-3">
            <Text className="text-lg font-outfit-bold text-slate-900">
              {item.price.toLocaleString('vi-VN')}₫
              <Text className="text-xs font-inter text-slate-500"> / {item.unit}</Text>
            </Text>
            {typeof item.rating === 'number' ? (
              <Text className="text-xs font-inter-bold text-slate-600">★ {item.rating.toFixed(1)}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xs font-inter-bold text-slate-400 uppercase">SmartGrocery</Text>
          <Text className="text-2xl font-outfit-bold text-slate-900">Hôm nay bạn cần gì?</Text>
        </View>
        <CartButton />
      </View>

      {/* Search Bar (navigates to search screen) */}
      <Pressable
        onPress={() => router.push('/(customer)/search' as never)}
        className="mx-6 mb-3 flex-row items-center bg-slate-100 rounded-2xl px-4 py-3"
      >
        <Search size={18} color="#94A3B8" />
        <Text className="flex-1 ml-2 text-base font-inter text-slate-400">Tìm sản phẩm...</Text>
      </Pressable>

      {/* Category Chips */}
      {categories.length > 0 && (
        <View className="px-6 mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <Pressable
              onPress={() => setSelectedCategory(undefined)}
              className={clsx(
                'px-4 py-2 rounded-full border',
                selectedCategory === undefined
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-slate-200'
              )}
            >
              <Text
                className={clsx(
                  'text-sm font-inter-bold',
                  selectedCategory === undefined ? 'text-white' : 'text-slate-700'
                )}
              >
                Tất cả
              </Text>
            </Pressable>
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategoryPress(cat.id)}
                  className={clsx(
                    'px-4 py-2 rounded-full border',
                    active
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'bg-white border-slate-200'
                  )}
                >
                  <Text
                    className={clsx(
                      'text-sm font-inter-bold',
                      active ? 'text-white' : 'text-slate-700'
                    )}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Product List */}
      <View className="flex-1 px-6">
        <FlashList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={280}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              {isError ? (
                <View className="items-center">
                  <Text className="text-slate-500 font-inter mb-4">
                    Không tải được sản phẩm.
                  </Text>
                  <Pressable
                    onPress={() => refetch()}
                    className="flex-row items-center px-5 py-3 bg-emerald-500 rounded-2xl"
                  >
                    <RefreshCw size={16} color="#FFF" />
                    <Text className="text-white font-inter-bold ml-2">Thử lại</Text>
                  </Pressable>
                </View>
              ) : (
                <Text className="text-slate-400 font-inter">
                  Chưa có sản phẩm.
                </Text>
              )}
            </View>
          }
        />
      </View>
    </View>
  );
}
