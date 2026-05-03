import React, { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Skeleton from '../../src/components/ui/Skeleton';
import { staffOrdersApi, type StaffOrderQueueItem } from '../../src/api/staffOrders';
import { useStaffPickingStore } from '../../src/store/staffPickingStore';

const formatMoney = (v: number | null | undefined) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '';
  return `${Math.round(v).toLocaleString('vi-VN')}₫`;
};

export default function StaffLeaseQueueScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [refreshing, setRefreshing] = useState(false);
  const outbox = useStaffPickingStore((s) => s.outbox);
  const dropOutboxItem = useStaffPickingStore((s) => s.dropOutboxItem);

  const queueQuery = useQuery({
    queryKey: ['staff-order-queue'],
    queryFn: () => staffOrdersApi.getQueue(),
    refetchInterval: isFocused ? 15000 : false,
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });

  const myActiveQuery = useQuery({
    queryKey: ['staff-my-active-order'],
    queryFn: () => staffOrdersApi.getMyActive(),
    refetchInterval: isFocused ? 15000 : false,
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });

  const assignMutation = useMutation({
    mutationFn: (orderId: number) => staffOrdersApi.assign(orderId),
    onSuccess: async (res) => {
      router.replace(`/(staff)/lease-orders/${res.orderId}` as never);
    },
    onError: (e) => {
      const err = e as Error & { status?: number };
      if (err.status === 409) {
        Alert.alert('Không thể nhận đơn', 'Đơn đã có người nhận. Danh sách sẽ tự làm mới.', [{ text: 'Đóng' }]);
        void queueQuery.refetch();
        return;
      }
      Alert.alert('Lỗi', err.message, [{ text: 'Đóng' }]);
    },
  });

  const syncOne = useMutation({
    mutationFn: async (input: { orderId: number; createdAt: number; payload: unknown }) => {
      await staffOrdersApi.completePicking(input.orderId, input.payload as never);
      return input.createdAt;
    },
    onSuccess: (createdAt) => dropOutboxItem(createdAt),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([queueQuery.refetch(), myActiveQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [myActiveQuery, queueQuery]);

  const sortedQueue = useMemo(() => {
    const list = queueQuery.data ?? [];
    return [...list].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
  }, [queueQuery.data]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Hàng chờ nhận đơn', headerShown: true }} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        {outbox.length > 0 ? (
          <Card className="p-4 border border-amber-200 bg-amber-50">
            <Text className="font-outfit-bold text-text">Đang chờ đồng bộ</Text>
            <Text className="text-xs font-inter text-muted mt-1">
              Có {outbox.length} bản ghi hoàn tất nhặt hàng đang chờ đồng bộ.
            </Text>
            <View className="mt-3 gap-y-2">
              {outbox.slice(0, 3).map((o) => (
                <View key={o.createdAt} className="flex-row items-center justify-between">
                  <Text className="text-xs font-inter text-text">ID nội bộ #{o.orderId}</Text>
                  <Button
                    label={syncOne.isPending ? 'Đang đồng bộ…' : 'Đồng bộ'}
                    variant="outline"
                    onPress={() => syncOne.mutate({ orderId: o.orderId, createdAt: o.createdAt, payload: o.payload })}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {myActiveQuery.data ? (
          <Card className="p-4 border border-blue-200 bg-blue-50">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-outfit-bold text-text">Đơn đang được giao cho bạn</Text>
                <Text className="text-xs font-inter text-muted mt-1">
                  {myActiveQuery.data.orderNumber || `ID nội bộ #${myActiveQuery.data.id}`} • {myActiveQuery.data.status}
                </Text>
              </View>
              <Button
                label="Vào xử lý"
                onPress={() => router.replace(`/(staff)/lease-orders/${myActiveQuery.data!.id}` as never)}
              />
            </View>
          </Card>
        ) : null}

        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-outfit-bold text-text">Đơn chờ nhận</Text>
            <Text className="text-xs font-inter text-muted">{sortedQueue.length} đơn</Text>
          </View>
        </Card>

        {queueQuery.isLoading ? (
          <>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </>
        ) : queueQuery.isError ? (
          <Card className="p-4 border border-border bg-surface">
            <Text className="text-sm font-inter text-muted">Không tải được danh sách đơn.</Text>
            <View className="mt-3">
              <Button label="Thử lại" onPress={() => void queueQuery.refetch()} />
            </View>
          </Card>
        ) : sortedQueue.length === 0 ? (
          <Card className="p-4 border border-border bg-surface">
            <Text className="text-sm font-inter text-muted">Không có đơn PENDING.</Text>
          </Card>
        ) : (
          sortedQueue.map((o: StaffOrderQueueItem) => (
            <Card key={o.id} className="p-4 border border-border bg-surface">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-outfit-bold text-text">{o.orderNumber || `ID nội bộ #${o.id}`}</Text>
                  <Text className="text-xs font-inter text-muted mt-1" numberOfLines={2}>
                    {o.addressLine || '—'}
                  </Text>
                  <View className="flex-row mt-2">
                    <Text className="text-xs font-inter text-muted">
                      {o.totalItems ?? 0} món • {formatMoney(o.totalAmount)}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-inter-bold text-muted">{o.status}</Text>
                  <View className="mt-2">
                    <Button
                      label={assignMutation.isPending ? 'Đang nhận...' : 'Nhận đơn'}
                      onPress={() => assignMutation.mutate(o.id)}
                    />
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
