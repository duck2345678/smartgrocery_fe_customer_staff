import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Card from '../../../src/components/ui/Card';
import { productApi } from '../../../src/api/products';

export default function StaffProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const productId = useMemo(() => {
    const raw = params.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [params.id]);

  const productQuery = useQuery({
    queryKey: ['staff-product', productId],
    queryFn: () => productApi.getProductById(productId),
    enabled: productId > 0,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Chi tiết sản phẩm', headerShown: true }} />

      {productQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-xs font-inter text-muted mt-2">Đang tải…</Text>
        </View>
      ) : productQuery.isError || !productQuery.data ? (
        <View className="p-4">
          <Card className="p-4">
            <Text className="font-inter-bold text-text">Không tải được sản phẩm.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Vui lòng thử lại.</Text>
            <Pressable onPress={() => void productQuery.refetch()} className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center">
              <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} className="mt-2 px-4 py-3 rounded-2xl bg-surface border border-border items-center">
              <Text className="font-outfit-bold text-text">Quay lại</Text>
            </Pressable>
          </Card>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <Card className="p-4">
            <Text className="text-xl font-outfit-bold text-text">{productQuery.data.name}</Text>
            <Text className="text-xs font-inter text-muted mt-1">{productQuery.data.category}</Text>
            <View className="mt-4 flex-row justify-between">
              <View>
                <Text className="text-xs font-inter text-muted">Giá</Text>
                <Text className="mt-1 font-outfit-bold text-text">{formatMoney(productQuery.data.price)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text className="text-xs font-inter text-muted">Tồn kho</Text>
                <Text className="mt-1 font-outfit-bold text-text">{productQuery.data.stock}</Text>
              </View>
            </View>
          </Card>

          {productQuery.data.description ? (
            <Card className="p-4 mt-3">
              <Text className="font-inter-bold text-text">Mô tả</Text>
              <Text className="text-sm font-inter text-muted mt-2">{productQuery.data.description}</Text>
            </Card>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function formatMoney(v: number) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
}
