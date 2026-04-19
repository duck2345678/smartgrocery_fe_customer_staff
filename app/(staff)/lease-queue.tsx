import React, { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
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
  const [refreshing, setRefreshing] = useState(false);
  const outbox = useStaffPickingStore((s) => s.outbox);
  const dropOutboxItem = useStaffPickingStore((s) => s.dropOutboxItem);

  const queueQuery = useQuery({
    queryKey: ['staff-order-queue'],
    queryFn: () => staffOrdersApi.getQueue(),
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const assignMutation = useMutation({
    mutationFn: (orderId: number) => staffOrdersApi.assign(orderId),
    onSuccess: async (res) => {
      await queueQuery.refetch();
      router.push(`/(staff)/lease-orders/${res.orderId}` as never);
    },
    onError: (e) => {
      const err = e as Error & { status?: number };
      if (err.status === 409) {
        Alert.alert('Không thể nhận đơn', 'Đơn đã có người nhận. Danh sách sẽ tự làm mới.');
        void queueQuery.refetch();
        return;
      }
      Alert.alert('Lỗi', err.message);
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
      await queueQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [queueQuery]);

  const sortedQueue = useMemo(() => {
    const list = queueQuery.data ?? [];
    return [...list].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
  }, [queueQuery.data]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Order Queue (Lease)', headerShown: true }} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        {outbox.length > 0 ? (
          <Card className="p-4 border border-amber-200 bg-amber-50">
            <Text className="font-outfit-bold text-slate-900">Đang chờ đồng bộ</Text>
            <Text className="text-xs font-inter text-slate-600 mt-1">
              Có {outbox.length} payload complete-picking đang nằm trong outbox.
            </Text>
            <View className="mt-3 gap-y-2">
              {outbox.slice(0, 3).map((o) => (
                <View key={o.createdAt} className="flex-row items-center justify-between">
                  <Text className="text-xs font-inter text-slate-700">Order #{o.orderId}</Text>
                  <Button
                    label={syncOne.isPending ? 'Đang sync...' : 'Sync'}
                    variant="outline"
                    onPress={() => syncOne.mutate({ orderId: o.orderId, createdAt: o.createdAt, payload: o.payload })}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-outfit-bold text-slate-900">Đơn chờ nhận</Text>
            <Text className="text-xs font-inter text-slate-500">{sortedQueue.length} đơn</Text>
          </View>
        </Card>

        {queueQuery.isLoading ? (
          <>
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </>
        ) : queueQuery.isError ? (
          <Card className="p-4 border border-slate-100 bg-white">
            <Text className="text-sm font-inter text-slate-700">Không tải được danh sách đơn.</Text>
            <View className="mt-3">
              <Button label="Thử lại" onPress={() => void queueQuery.refetch()} />
            </View>
          </Card>
        ) : sortedQueue.length === 0 ? (
          <Card className="p-4 border border-slate-100 bg-white">
            <Text className="text-sm font-inter text-slate-700">Không có đơn PENDING.</Text>
          </Card>
        ) : (
          sortedQueue.map((o: StaffOrderQueueItem) => (
            <Card key={o.id} className="p-4 border border-slate-100 bg-white">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-outfit-bold text-slate-900">#{o.orderNumber || o.id}</Text>
                  <Text className="text-xs font-inter text-slate-500 mt-1" numberOfLines={2}>
                    {o.addressLine || '—'}
                  </Text>
                  <View className="flex-row mt-2">
                    <Text className="text-xs font-inter text-slate-600">
                      {o.totalItems ?? 0} món • {formatMoney(o.totalAmount)}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-inter-bold text-slate-500">{o.status}</Text>
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

