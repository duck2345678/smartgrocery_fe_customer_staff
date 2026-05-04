import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Card from '../../../src/components/ui/Card';
import { staffOrdersApi } from '../../../src/api/staffOrders';

export default function StaffOrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = useMemo(() => {
    const raw = params.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [params.id]);

  const pickListQuery = useQuery({
    queryKey: ['staff-order-pick-list', orderId],
    queryFn: () => staffOrdersApi.getPickList(orderId),
    enabled: orderId > 0,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: `Đơn #${orderId || ''}`, headerShown: true }} />

      {pickListQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-xs font-inter text-muted mt-2">Đang tải…</Text>
        </View>
      ) : pickListQuery.isError || !pickListQuery.data ? (
        <View className="p-4">
          <Card className="p-4">
            <Text className="font-inter-bold text-text">Không tải được chi tiết đơn.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Vui lòng thử lại.</Text>
            <Pressable onPress={() => void pickListQuery.refetch()} className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center">
              <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} className="mt-2 px-4 py-3 rounded-2xl bg-surface border border-border items-center">
              <Text className="font-outfit-bold text-text">Quay lại</Text>
            </Pressable>
          </Card>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}>
          <Card className="p-4">
            <Text className="font-outfit-bold text-text">#{pickListQuery.data.orderNumber || pickListQuery.data.orderId}</Text>
            <Text className="text-xs font-inter text-muted mt-1">Trạng thái: {pickListQuery.data.status}</Text>
          </Card>

          <Card className="p-4">
            <Text className="font-inter-bold text-text">Danh sách mặt hàng</Text>
            <Text className="text-xs font-inter text-muted mt-1">Hiển thị theo thứ tự kệ hàng.</Text>
            <View className="mt-3" style={{ gap: 10 }}>
              {pickListQuery.data.items.map((it) => (
                <View key={it.orderItemId} className="p-3 rounded-2xl bg-surface border border-border">
                  <View className="flex-row items-start justify-between">
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text className="font-inter-bold text-text" numberOfLines={2}>
                        {it.productName}
                      </Text>
                      <Text className="text-xs font-inter text-muted mt-1" numberOfLines={1}>
                        {it.variantName ?? '—'} • SKU {it.sku}
                      </Text>
                      {it.aisleLocation ? (
                        <Text className="text-xs font-inter text-muted mt-1">Kệ: {it.aisleLocation}</Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text className="text-xs font-inter text-muted">Số lượng</Text>
                      <Text className="mt-1 font-outfit-bold text-text">{it.orderedQuantity}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
