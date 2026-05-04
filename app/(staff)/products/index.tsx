import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
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
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-outfit-bold text-text">Sản phẩm</Text>
        <Text className="text-xs font-inter text-muted mt-1">Tra cứu nhanh theo danh mục hoặc từ khoá.</Text>

        <View className="mt-3">
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tên sản phẩm…"
            icon={<Search size={18} color="#64748B" />}
            returnKeyType="search"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip active={categoryId == null} label="Tất cả" onPress={() => setCategoryId(null)} />
          {categories.map((c) => (
            <Chip key={c.id} active={categoryId === c.id} label={c.name} onPress={() => setCategoryId(c.id)} />
          ))}
        </ScrollView>
      </View>

      <View className="flex-1 px-4 pb-4">
        <Text className="text-xs font-inter text-muted mt-2">{title}</Text>

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
          <ScrollView contentContainerStyle={{ paddingTop: 10, paddingBottom: 18, gap: 10 }}>
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
      className={active ? 'px-3 py-2 rounded-full bg-primary' : 'px-3 py-2 rounded-full bg-surface border border-border'}
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
      <Card className="p-4">
        <View className="flex-row items-start justify-between">
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text className="font-outfit-bold text-text" numberOfLines={2}>
              {product.name}
            </Text>
            <Text className="text-xs font-inter text-muted mt-1" numberOfLines={1}>
              {product.category} • {product.unit}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text className="font-outfit-bold text-text">{formatMoney(product.price)}</Text>
            <Text className="text-xs font-inter text-muted mt-1">{typeof product.stock === 'number' ? `Tồn: ${product.stock}` : '—'}</Text>
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
