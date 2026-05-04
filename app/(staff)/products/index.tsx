import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScanLine, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import { productApi } from '../../../src/api/products';
import { useStaffProductsStore } from '../../../src/store/staffProductsStore';
import type { Product } from '../../../src/types/product';

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

  const title = useMemo(() => (search.trim() ? `Kết quả cho “${search.trim()}”` : 'Tất cả sản phẩm'), [search]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="absolute -top-40 left-0 right-0 h-96 bg-background">
        <View className="absolute -top-2 left-[-72px] w-[240px] h-[240px] rounded-full bg-primary/12" />
        <View className="absolute top-10 right-[-96px] w-[320px] h-[320px] rounded-full bg-primary/10" />
        <View className="absolute top-56 left-10 w-[220px] h-[220px] rounded-full bg-primary/8" />
      </View>

      <View className="px-4 pt-4 pb-3">
        <Text className="text-3xl font-outfit-bold text-text">Sản phẩm</Text>

        <View className="mt-4 flex-row items-center bg-surface border border-border rounded-3xl pl-4 pr-2 py-2">
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

        <View className="mt-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 2 }}>
            <Chip active={categoryId == null} label="Tất cả" onPress={() => setCategoryId(null)} />
            {categories.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} label={c.name} onPress={() => setCategoryId(c.id)} />
            ))}
          </ScrollView>
        </View>
      </View>

      <View className="flex-1 px-4 pb-4">
        <Text className="text-[11px] font-inter text-muted">{title}</Text>

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
        ) : (productsQuery.data ?? []).length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm font-inter text-muted">Không có sản phẩm phù hợp.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 18, gap: 12 }}>
            {(productsQuery.data ?? []).map((p) => (
              <ProductRow key={p.id} product={p} onPress={() => router.push(`/(staff)/products/${p.id}` as never)} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

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

function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card className="px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View style={{ flex: 1, paddingRight: 14 }}>
            <Text className="text-base font-outfit-bold text-text" numberOfLines={1}>
              {product.name}
            </Text>
            <Text className="text-xs font-inter text-muted mt-1" numberOfLines={1}>
              {product.category} • {String(product.unit ?? '').toUpperCase()}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text className="text-base font-outfit-bold text-text">{formatMoney(product.price)}</Text>
            <Text className="text-xs font-inter text-muted mt-1">
              {typeof product.stock === 'number' ? `In Stock: ${product.stock}` : 'In Stock: —'}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function formatMoney(v: number) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
}
