import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScanLine, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import { productApi } from '../../../src/api/products';
import { useStaffProductsStore } from '../../../src/store/staffProductsStore';
import type { Product } from '../../../src/types/product';

const LOW_STOCK_THRESHOLD = 5;

export default function StaffProductsScreen() {
  const router = useRouter();
  const search = useStaffProductsStore((s) => s.search);
  const categoryId = useStaffProductsStore((s) => s.categoryId);
  const setSearch = useStaffProductsStore((s) => s.setSearch);
  const setCategoryId = useStaffProductsStore((s) => s.setCategoryId);

  const categoriesQuery = useQuery({
    queryKey: ['staff-products-categories'],
    queryFn: () => productApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const productsQuery = useQuery({
    queryKey: ['staff-products', { search, categoryId }],
    queryFn: () =>
      productApi.getProducts({
        search: search.trim() ? search.trim() : undefined,
        categoryId: categoryId ?? undefined,
      }),
    staleTime: 30 * 1000,
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const title = useMemo(() => (search.trim() ? `Kết quả cho "${search.trim()}"` : 'Tất cả sản phẩm'), [search]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Decorative background bubbles */}
      <View className="absolute -top-40 left-0 right-0 h-96 bg-background">
        <View className="absolute -top-2 left-[-72px] w-[240px] h-[240px] rounded-full bg-primary/12" />
        <View className="absolute top-10 right-[-96px] w-[320px] h-[320px] rounded-full bg-primary/10" />
        <View className="absolute top-56 left-10 w-[220px] h-[220px] rounded-full bg-primary/8" />
      </View>

      {/* Search bar */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center bg-surface border border-border rounded-3xl pl-4 pr-2 py-2">
          <Search size={18} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên sản phẩm hoặc quét mã vạch…"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            className="flex-1 ml-2 text-base font-inter text-text"
          />
          <Pressable
            testID="products-open-scanner"
            onPress={() => router.push('/(staff)/products/scan' as never)}
            className="w-12 h-12 rounded-2xl bg-primary items-center justify-center"
            hitSlop={8}
          >
            <ScanLine size={22} color="#ffffff" />
          </Pressable>
        </View>

        {/* Category chips */}
        <View className="mt-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
            <Chip active={categoryId == null} label="Tất cả" onPress={() => setCategoryId(null)} />
            {categories.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} label={c.name} onPress={() => setCategoryId(c.id)} />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Product list */}
      <View className="flex-1 px-4 pb-4">
        <Text className="text-[11px] font-inter text-muted mb-1">{title}</Text>

        {productsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-xs font-inter text-muted mt-2">Đang tải danh sách sản phẩm…</Text>
          </View>
        ) : productsQuery.isError ? (
          <Card className="p-4 mt-4">
            <Text className="font-inter-bold text-text">Không tải được danh sách sản phẩm.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Kiểm tra mạng và thử lại.</Text>
            <Pressable onPress={() => void productsQuery.refetch()} className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center">
              <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
            </Pressable>
          </Card>
        ) : products.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm font-inter text-muted">Không có sản phẩm phù hợp.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 18, gap: 10 }} showsVerticalScrollIndicator={false}>
            {products.map((p) => (
              <ProductRow key={p.id} product={p} onPress={() => router.push(`/(staff)/products/${p.id}` as never)} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ── Category chip ─────────────────────────────────────── */
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={active ? 'px-4 py-2 rounded-full bg-primary' : 'px-4 py-2 rounded-full bg-surface border border-border'}
      hitSlop={6}
    >
      <Text className={active ? 'text-xs font-inter-bold text-primary-fg' : 'text-xs font-inter text-text'} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ── Product row (matches reference design) ────────────── */
function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const isLowStock = typeof product.stock === 'number' && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;

  const stockLabel = isOutOfStock
    ? 'Hết hàng'
    : isLowStock
      ? `Low Stock: ${product.stock}`
      : `In Stock: ${product.stock}`;

  const stockColor = isOutOfStock ? '#EF4444' : isLowStock ? '#F59E0B' : '#16A34A';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      <Card className="px-3 py-3">
        <View className="flex-row items-center">
          {/* Product image */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: '#F1F5F9',
              marginRight: 12,
            }}
          >
            <Image
              source={{ uri: product.imageUrl }}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </View>

          {/* Name + category/unit */}
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text className="text-[15px] font-outfit-bold text-text" numberOfLines={1}>
              {product.name}
            </Text>
            <Text className="text-xs font-inter text-muted mt-1" numberOfLines={1}>
              {product.category} • {String(product.unit ?? '').toUpperCase()}
            </Text>
          </View>

          {/* Price + stock */}
          <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
            <Text className="text-[15px] font-outfit-bold text-text">{formatMoney(product.price)}</Text>
            <Text
              className="text-[11px] font-inter-bold mt-1"
              style={{ color: stockColor }}
              numberOfLines={1}
            >
              {stockLabel}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

/* ── Helpers ────────────────────────────────────────────── */
function formatMoney(v: number) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
}
