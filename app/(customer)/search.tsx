import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productApi, type Category } from '../../src/api/products';
import { Product } from '../../src/types/product';
import { Search as SearchIcon, X, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { clsx } from 'clsx';
import CartButton from '../../src/components/customer/CartButton';

export default function CustomerSearch() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const inputRef = useRef<TextInput>(null);
  const initialQuery = typeof params.q === 'string' ? params.q : '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);


  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const categories: Category[] = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  );

  const searchQuery = useQuery({
    queryKey: ['products', { search: debouncedQuery || undefined, categoryId: selectedCategory }],
    queryFn: () =>
      productApi.getProducts({
        search: debouncedQuery || undefined,
        categoryId: selectedCategory,
      }),
    enabled: debouncedQuery.length > 0 || selectedCategory !== undefined,
    staleTime: 2 * 60 * 1000,
  });

  const products: Product[] = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);
  const showResults = debouncedQuery.length > 0 || selectedCategory !== undefined;
  const isSearching = searchQuery.isFetching;

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, []);

  const handleCategoryPress = useCallback((catId: number) => {
    setSelectedCategory((prev) => (prev === catId ? undefined : catId));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => {
      const isOut = item.stock <= 0;
      return (
        <Pressable
          onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
          className="mb-3 bg-surface border border-border rounded-2xl overflow-hidden flex-row"
          style={{ height: 120 }}
        >
          <View className="w-28 h-full bg-surface2">
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
            />
          </View>

          <View className="flex-1 p-3 justify-between">
            <View>
              <Text className="text-base font-outfit-bold text-text" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-muted font-inter mt-0.5">{item.category}</Text>
            </View>

            <View className="flex-row items-end justify-between">
              <Text className="text-lg font-outfit-bold text-text">
                {item.price.toLocaleString('vi-VN')}₫
                <Text className="text-xs font-inter text-muted"> / {item.unit}</Text>
              </Text>
              <View
                className={clsx(
                  'px-2 py-0.5 rounded-full border',
                  isOut ? 'bg-slate-100 border-slate-200' : 'bg-emerald-50 border-emerald-200'
                )}
              >
                <Text
                  className={clsx(
                    'text-[10px] font-inter-bold',
                    isOut ? 'text-slate-500' : 'text-emerald-700'
                  )}
                >
                  {isOut ? 'HẾT' : `${item.stock}`}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [router]
  );

  return (
    <View className="flex-1 bg-background">
      {/* Search Header */}
      <View className="px-4 pt-6 pb-3 bg-surface border-b border-border">
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={12} className="p-1">
            <ArrowLeft size={22} color="#475569" />
          </Pressable>

          <View className="flex-1 flex-row items-center bg-surface2 rounded-2xl px-4 py-3">
            <SearchIcon size={18} color="#94A3B8" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm sản phẩm..."
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2 text-base font-inter text-text"
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={handleClearSearch} hitSlop={8}>
                <X size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          <CartButton />
        </View>

        {/* Category Chips */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 12, gap: 8 }}
          >
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
                      : 'bg-surface border-border'
                  )}
                >
                  <Text
                    className={clsx(
                      'text-sm font-inter-bold',
                      active ? 'text-white' : 'text-text'
                    )}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Results Area */}
      <View className="flex-1 px-4 pt-4">
        {!showResults ? (
          /* Empty prompt */
          <View className="flex-1 items-center justify-center">
            <SearchIcon size={48} color="#CBD5E1" />
            <Text className="text-muted font-inter mt-4 text-center">
              Nhập tên sản phẩm hoặc chọn danh mục{'\n'}để bắt đầu tìm kiếm.
            </Text>
          </View>
        ) : isSearching && products.length === 0 ? (
          /* Loading */
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-muted font-inter mt-4">Đang tìm kiếm...</Text>
          </View>
        ) : searchQuery.isError ? (
          /* Error with retry */
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted font-inter mb-4">
              Không tải được kết quả. Vui lòng thử lại.
            </Text>
            <Pressable
              onPress={() => searchQuery.refetch()}
              className="flex-row items-center px-5 py-3 bg-emerald-500 rounded-2xl"
            >
              <RefreshCw size={16} color="#FFF" />
              <Text className="text-white font-inter-bold ml-2">Thử lại</Text>
            </Pressable>
          </View>
        ) : products.length === 0 ? (
          /* No results */
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted font-inter text-center">
              Không tìm thấy sản phẩm{debouncedQuery ? ` cho "${debouncedQuery}"` : ''}.
            </Text>
          </View>
        ) : (
          /* Results list */
          <>
            <Text className="text-sm font-inter text-muted mb-3">
              {products.length} kết quả
              {debouncedQuery ? ` cho "${debouncedQuery}"` : ''}
            </Text>
            <FlashList
              data={products}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.id)}
              estimatedItemSize={120}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </View>
  );
}
