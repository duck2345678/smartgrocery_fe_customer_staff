import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { productApi, type Category } from '../../../src/api/products';
import { type Product } from '../../../src/types/product';
import { Search, RefreshCw, X, Plus } from 'lucide-react-native';
import { useRef, useEffect } from 'react';
import { useDebounce } from '../../../src/hooks/useDebounce';
import { useCart } from '../../../src/hooks/useCart';

const PRODUCT_PAGE_SIZE = 30;

export default function CustomerShop() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string, focusSearch?: string }>();
  const categoryFromParams = useMemo(() => {
    const raw = params.categoryId;
    const n = typeof raw === 'string' ? Number(raw) : undefined;
    return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
  }, [params.categoryId]);

  const [categoryOverride, setCategoryOverride] = useState<number | null | undefined>(undefined);
  const selectedCategory = categoryOverride === undefined ? categoryFromParams : categoryOverride ?? undefined;
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 400);
  const searchInputRef = useRef<TextInput>(null);
  
  const { addProduct } = useCart();
  const [addingId, setAddingId] = useState<number | null>(null);

  // Auto-focus if coming from Home search
  useEffect(() => {
    if (params.focusSearch === 'true') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [params.focusSearch]);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const categories: Category[] = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const productsQuery = useInfiniteQuery({
    queryKey: ['products', { categoryId: selectedCategory, search: debouncedSearch, size: PRODUCT_PAGE_SIZE }],
    queryFn: ({ pageParam }) => productApi.getProducts({
      page: pageParam as number,
      size: PRODUCT_PAGE_SIZE,
      categoryId: selectedCategory,
      search: debouncedSearch || undefined,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) => {
      if (!lastPage || lastPage.length < PRODUCT_PAGE_SIZE) return undefined;
      return (lastPageParam as number) + 1;
    },
  });

  const products = useMemo(() => productsQuery.data?.pages.flat() ?? [], [productsQuery.data?.pages]);

  const handleCategoryPress = useCallback((catId: number) => {
    setCategoryOverride((prev) => (prev === catId ? null : catId));
  }, []);

  const renderItem = ({ item }: { item: Product }) => {
    const isOut = item.stock <= 0;
    const isAdding = addingId === item.id;

    return (
      <View className="mb-4 bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        <Pressable
          onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
          className="flex-row p-3"
        >
          <View className="w-28 h-28 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
            />
            {isOut && (
              <View className="absolute inset-0 bg-white/60 items-center justify-center">
                <Text className="text-[10px] font-outfit-bold text-slate-400 rotate-[-15deg]">HẾT HÀNG</Text>
              </View>
            )}
          </View>

          <View className="flex-1 ml-4 justify-between py-1">
            <View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10px] font-inter-bold text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-md">
                  {item.category}
                </Text>
                <Text className="text-[10px] font-inter-bold text-slate-400">
                  KHO: {item.stock}
                </Text>
              </View>
              <Text className="text-base font-outfit-bold text-slate-900 mt-1" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs font-inter text-slate-400 mt-0.5">
                {item.unit}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center">
                  <Text className="text-lg font-outfit-bold text-slate-900">
                    {item.price.toLocaleString('vi-VN')}₫
                  </Text>
                  {item.originalPrice && (
                    <Text className="text-[11px] font-inter text-slate-400 line-through ml-2">
                      {item.originalPrice.toLocaleString('vi-VN')}₫
                    </Text>
                  )}
                </View>
                {item.discountPercent && (
                  <View className="bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 self-start mt-0.5">
                    <Text className="text-[9px] font-outfit-bold text-red-600">-{item.discountPercent}%</Text>
                  </View>
                )}
              </View>
              
              <Pressable
                onPress={async () => {
                  if (isOut || isAdding) return;
                  setAddingId(item.id);
                  try {
                    await addProduct({ product: item, quantity: 1 });
                  } finally {
                    setAddingId(null);
                  }
                }}
                disabled={isOut}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={[
                    { backgroundColor: isOut ? '#F1F5F9' : '#16A34A' },
                    !isOut ? { shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 } : {}
                ]}
              >
                {isAdding ? (
                   <RefreshCw size={18} color="#FFF" className="animate-spin" />
                ) : (
                  <Plus size={20} color="#FFF" />
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View 
        className="px-6 pb-2"
        style={{ paddingTop: Math.max(insets.top + 8, 24) }}
      >
        <Text className="text-xs font-inter-bold text-muted uppercase">Mua sắm</Text>
        <Text className="text-2xl font-outfit-bold text-text">Danh mục & Sản phẩm</Text>
      </View>

      <View className="mx-6 mb-3 flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-100">
        <Search size={18} color="#94A3B8" />
        <TextInput
          ref={searchInputRef}
          className="flex-1 ml-2 text-base font-inter text-text h-12"
          placeholder="Tìm sản phẩm..."
          placeholderTextColor="#94A3B8"
          style={{ paddingVertical: 0 }}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} className="p-1">
            <X size={16} color="#94A3B8" />
          </Pressable>
        )}
      </View>

      {categories.length > 0 && (
        <View className="px-6 mb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable
              onPress={() => setCategoryOverride(null)}
              className="px-4 py-2 rounded-full border"
              style={{ 
                  backgroundColor: selectedCategory === undefined ? '#16A34A' : '#FFF',
                  borderColor: selectedCategory === undefined ? '#16A34A' : '#E2E8F0'
              }}
            >
              <Text 
                className="text-sm font-inter-bold"
                style={{ color: selectedCategory === undefined ? '#FFF' : '#0F172A' }}
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
                  className="px-4 py-2 rounded-full border"
                  style={{ 
                      backgroundColor: active ? '#16A34A' : '#FFF',
                      borderColor: active ? '#16A34A' : '#E2E8F0'
                  }}
                >
                  <Text 
                    className="text-sm font-inter-bold"
                    style={{ color: active ? '#FFF' : '#0F172A' }}
                  >{cat.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View className="flex-1 px-6">
        <FlashList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={140}
          onRefresh={productsQuery.refetch}
          refreshing={productsQuery.isFetching && !productsQuery.isFetchingNextPage}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
              void productsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              {productsQuery.isError ? (
                <View className="items-center">
                  <Text className="text-muted font-inter mb-4">Không tải được sản phẩm.</Text>
                  <Pressable onPress={() => productsQuery.refetch()} className="flex-row items-center px-5 py-3 bg-primary rounded-2xl">
                    <RefreshCw size={16} color="#FFF" />
                    <Text className="text-white font-inter-bold ml-2">Thử lại</Text>
                  </Pressable>
                </View>
              ) : productsQuery.isLoading ? (
                <Text className="text-muted font-inter">Dang tai san pham...</Text>
              ) : (
                <Text className="text-muted font-inter">Chưa có sản phẩm.</Text>
              )}
            </View>
          }
          ListFooterComponent={
            products.length === 0 ? null : productsQuery.isFetchingNextPage ? (
              <View className="py-4 items-center">
                <RefreshCw size={18} color="#16A34A" />
                <Text className="mt-2 text-xs font-inter text-muted">Dang tai them...</Text>
              </View>
            ) : productsQuery.hasNextPage ? (
              <Pressable
                onPress={() => void productsQuery.fetchNextPage()}
                className="mb-6 mt-1 py-3 rounded-2xl bg-primary items-center"
              >
                <Text className="text-white font-inter-bold">Tai them san pham</Text>
              </Pressable>
            ) : (
              <View className="pb-6 pt-2 items-center">
                <Text className="text-xs font-inter text-muted">Ban da xem het san pham.</Text>
              </View>
            )
          }
        />
      </View>
    </View>
  );
}
