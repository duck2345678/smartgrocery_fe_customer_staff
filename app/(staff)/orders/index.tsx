import React, { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { staffOrdersApi, type StaffOrderQueueItem } from '../../../src/api/staffOrders';
import { useStaffOrdersStore } from '../../../src/store/staffOrdersStore';

export default function StaffOrdersScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const view = useStaffOrdersStore((s) => s.view);
  const setView = useStaffOrdersStore((s) => s.setView);

  const queueQuery = useQuery({
    queryKey: ['staff-order-queue'],
    queryFn: () => staffOrdersApi.getQueue(),
    staleTime: 5000,
    enabled: view === 'QUEUE',
  });

  const myActiveQuery = useQuery({
    queryKey: ['staff-order-my-active'],
    queryFn: () => staffOrdersApi.getMyActive(),
    staleTime: 5000,
    enabled: view === 'MY_ACTIVE',
  });

  const assignMutation = useMutation({
    mutationFn: (orderId: number) => staffOrdersApi.assign(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['staff-order-queue'] });
      await qc.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      setView('MY_ACTIVE');
    },
    onError: (e) => {
      Alert.alert('Không thể nhận đơn', e instanceof Error ? e.message : 'Đã có lỗi xảy ra.', [{ text: 'Đóng' }]);
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (orderId: number) => staffOrdersApi.release(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['staff-order-queue'] });
      await qc.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      setView('QUEUE');
    },
    onError: (e) => {
      Alert.alert('Không thể thả đơn', e instanceof Error ? e.message : 'Đã có lỗi xảy ra.', [{ text: 'Đóng' }]);
    },
  });

  const isLoading = queueQuery.isLoading || myActiveQuery.isLoading;
  const isError = queueQuery.isError || myActiveQuery.isError;

  const queue = queueQuery.data ?? [];
  const myActive = myActiveQuery.data;

  const title = useMemo(() => (view === 'QUEUE' ? 'Hàng chờ' : 'Đơn đang xử lý'), [view]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Đơn hàng', headerShown: false }} />

      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-outfit-bold text-text">Đơn hàng</Text>
        <Text className="text-xs font-inter text-muted mt-1">Nhận đơn mới hoặc tiếp tục đơn đang xử lý.</Text>

        <View className="mt-3 flex-row" style={{ gap: 10 }}>
          <Pressable
            className={view === 'QUEUE' ? 'flex-1 px-4 py-3 rounded-2xl bg-primary' : 'flex-1 px-4 py-3 rounded-2xl bg-surface border border-border'}
            onPress={() => setView('QUEUE')}
          >
            <Text className={view === 'QUEUE' ? 'text-center font-outfit-bold text-primary-fg' : 'text-center font-outfit-bold text-text'}>
              Hàng chờ
            </Text>
          </Pressable>
          <Pressable
            className={view === 'MY_ACTIVE' ? 'flex-1 px-4 py-3 rounded-2xl bg-primary' : 'flex-1 px-4 py-3 rounded-2xl bg-surface border border-border'}
            onPress={() => setView('MY_ACTIVE')}
          >
            <Text className={view === 'MY_ACTIVE' ? 'text-center font-outfit-bold text-primary-fg' : 'text-center font-outfit-bold text-text'}>
              Đang xử lý
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 px-4 pb-4">
        <Text className="text-xs font-inter text-muted mt-2">{title}</Text>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-xs font-inter text-muted mt-2">Đang tải…</Text>
          </View>
        ) : isError ? (
          <Card className="p-4 mt-4">
            <Text className="font-inter-bold text-text">Không tải được dữ liệu đơn hàng.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Kiểm tra mạng và thử lại.</Text>
            <Pressable
              onPress={() => {
                void queueQuery.refetch();
                void myActiveQuery.refetch();
              }}
              className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Tải lại</Text>
            </Pressable>
          </Card>
        ) : view === 'QUEUE' ? (
          queue.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-sm font-inter text-muted">Chưa có đơn trong hàng chờ.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingTop: 10, paddingBottom: 18, gap: 10 }}>
              {queue.map((o) => (
                <QueueOrderCard
                  key={o.id}
                  order={o}
                  onAssign={() => assignMutation.mutate(o.id)}
                  isSubmitting={assignMutation.isPending}
                  onOpen={() => router.push(`/(staff)/orders/${o.id}` as never)}
                />
              ))}
            </ScrollView>
          )
        ) : myActive ? (
          <Card className="p-4 mt-4">
            <Text className="font-outfit-bold text-text" numberOfLines={1}>
              #{myActive.orderNumber || myActive.id}
            </Text>
            <Text className="text-xs font-inter text-muted mt-1" numberOfLines={2}>
              {myActive.addressLine ?? 'Chưa có địa chỉ'}
            </Text>
            <View className="mt-3 flex-row" style={{ gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="Xem chi tiết" onPress={() => router.push(`/(staff)/orders/${myActive.id}` as never)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={releaseMutation.isPending ? 'Đang thả…' : 'Thả đơn'}
                  variant="outline"
                  onPress={() => {
                    Alert.alert('Thả đơn', 'Bạn muốn thả đơn này để quay lại hàng chờ?', [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Thả đơn', style: 'destructive', onPress: () => releaseMutation.mutate(myActive.id) },
                    ]);
                  }}
                  disabled={releaseMutation.isPending}
                />
              </View>
            </View>
          </Card>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-sm font-inter text-muted">Bạn chưa có đơn đang xử lý.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function QueueOrderCard({
  order,
  onAssign,
  onOpen,
  isSubmitting,
}: {
  order: StaffOrderQueueItem;
  onAssign: () => void;
  onOpen: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Pressable onPress={onOpen}>
      <Card className="p-4">
        <View className="flex-row items-start justify-between">
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text className="font-outfit-bold text-text" numberOfLines={1}>
              #{order.orderNumber || order.id}
            </Text>
            <Text className="text-xs font-inter text-muted mt-1" numberOfLines={2}>
              {order.addressLine ?? 'Chưa có địa chỉ'}
            </Text>
            <Text className="text-xs font-inter text-muted mt-1">
              {order.totalItems != null ? `${order.totalItems} món` : '—'} • {order.totalAmount != null ? formatMoney(order.totalAmount) : '—'}
            </Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onAssign();
            }}
            disabled={isSubmitting}
            className={isSubmitting ? 'px-4 py-3 rounded-2xl bg-surface border border-border' : 'px-4 py-3 rounded-2xl bg-primary'}
          >
            <Text className={isSubmitting ? 'font-outfit-bold text-text' : 'font-outfit-bold text-primary-fg'}>Nhận</Text>
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
}

function formatMoney(v: number) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
}
