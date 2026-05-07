import React, { useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Package, Clock, ShoppingBag, RefreshCcw, LayoutGrid, Info, ShieldCheck, ShieldAlert } from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { staffOrdersApi, type StaffOrderQueueItem } from '../../../src/api/staffOrders';
import { getTodayStatus } from '../../../src/api/staffAttendance';

export default function StaffOrdersScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const myActiveQuery = useQuery({
    queryKey: ['staff-order-my-active'],
    queryFn: () => staffOrdersApi.getMyActive(),
    staleTime: 5000,
  });

  const queueQuery = useQuery({
    queryKey: ['staff-order-queue'],
    queryFn: () => staffOrdersApi.getQueue(),
    staleTime: 5000,
  });

  const attendanceQuery = useQuery({
    queryKey: ['staff-attendance-today'],
    queryFn: () => getTodayStatus(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([queueQuery.refetch(), myActiveQuery.refetch(), attendanceQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [queueQuery, myActiveQuery, attendanceQuery]);

  const assignMutation = useMutation({
    mutationFn: (orderId: number) => staffOrdersApi.assign(orderId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['staff-order-queue'] });
      await qc.invalidateQueries({ queryKey: ['staff-order-my-active'] });
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
    },
    onError: (e) => {
      Alert.alert('Không thể thả đơn', e instanceof Error ? e.message : 'Đã có lỗi xảy ra.', [{ text: 'Đóng' }]);
    },
  });

  const isLoading = queueQuery.isLoading || myActiveQuery.isLoading;
  const isError = queueQuery.isError || myActiveQuery.isError;

  const myActive = myActiveQuery.data;
  const queue = queueQuery.data ?? [];

  const isClockedIn = useMemo(() => {
    if (!attendanceQuery.data) return false;
    const activeRecords = attendanceQuery.data.records.filter(r => r.checkInAt && !r.checkOutAt);
    if (activeRecords.length === 0) return false;

    // Check if any active record is still within its shift time
    const now = new Date();
    const currentTimeVal = now.getHours() * 60 + now.getMinutes();

    return activeRecords.some(r => {
      let endTimeVal = 0;
      if (r.shiftType === 'S') endTimeVal = 14 * 60 + 30; // 14:30
      else if (r.shiftType === 'C') endTimeVal = 22 * 60 + 30; // 22:30
      else if (r.shiftType === 'G') {
        if (r.blockNumber === 1) endTimeVal = 10 * 60 + 30;
        else if (r.blockNumber === 2) endTimeVal = 14 * 60 + 30;
        else if (r.blockNumber === 3) endTimeVal = 18 * 60 + 30;
        else if (r.blockNumber === 4) endTimeVal = 22 * 60 + 30;
      }
      return currentTimeVal < endTimeVal;
    });
  }, [attendanceQuery.data]);

  const lastUpdated = useMemo(() => {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }, [isLoading, refreshing]);

  const title = useMemo(() => 'Phân công đơn hàng', []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Đơn hàng', headerShown: false }} />

      <View className="px-4 pt-6 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-outfit-bold text-text">Đơn hàng</Text>
            <View className="flex-row items-center mt-1">
              <Clock size={12} color="#94A3B8" />
              <Text className="text-[11px] font-inter text-muted ml-1">Cập nhật lúc {lastUpdated}</Text>
            </View>
          </View>
          <Pressable 
            onPress={() => onRefresh()} 
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center"
          >
            <RefreshCcw size={18} color="#16A34A" />
          </Pressable>
        </View>

        <View className="mt-6">
          <Card 
            className={cn(
              "p-0 overflow-hidden border-0",
              isClockedIn ? "bg-[#F0FDF4]" : "bg-[#FFF7ED]"
            )}
            style={{
              elevation: 8,
              shadowColor: isClockedIn ? '#16A34A' : '#F97316',
              shadowOpacity: 0.12,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <View className={cn(
              "flex-row items-center px-5 py-5",
              isClockedIn ? "border-l-[5px] border-primary" : "border-l-[5px] border-orange-500"
            )}>
              <View className={cn(
                "w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-sm",
                isClockedIn ? "bg-white" : "bg-white"
              )}>
                {isClockedIn ? (
                  <View className="relative">
                    <ShieldCheck size={28} color="#16A34A" />
                    <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  </View>
                ) : (
                  <ShieldAlert size={28} color="#F97316" />
                )}
              </View>
              
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className={cn(
                    "text-[10px] font-outfit-bold tracking-[1px] uppercase",
                    isClockedIn ? "text-primary" : "text-orange-600"
                  )}>
                    {isClockedIn ? "Đang trực tuyến" : "Đang ngoại tuyến"}
                  </Text>
                  {isClockedIn && (
                    <View className="ml-2 px-1.5 py-0.5 bg-primary/10 rounded-md">
                      <Text className="text-[8px] font-outfit-bold text-primary">LIVE</Text>
                    </View>
                  )}
                </View>
                <Text className="text-[18px] font-outfit-bold text-[#0F172A] mt-0.5">
                  {isClockedIn ? "Sẵn sàng nhận đơn" : "Chưa chấm công"}
                </Text>
                <Text className="text-[12px] font-inter text-[#64748B] mt-0.5">
                  {isClockedIn ? "Bạn sẽ nhận được thông báo khi có đơn mới." : "Hãy vào ca để bắt đầu công việc."}
                </Text>
              </View>

              {!isClockedIn && (
                <Pressable 
                  onPress={() => router.push('/(staff)/attendance' as never)}
                  className="bg-orange-500 px-4 py-3 rounded-2xl shadow-sm shadow-orange-300"
                >
                  <Text className="text-[12px] font-outfit-bold text-white uppercase">Vào ca</Text>
                </Pressable>
              )}
            </View>
          </Card>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}
      >
        {isLoading && !refreshing ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color="#16A34A" />
            <Text className="text-xs font-inter text-muted mt-2">Đang tải danh sách…</Text>
          </View>
        ) : isError ? (
          <Card className="p-6 mt-4 items-center">
            <View className="w-12 h-12 rounded-full bg-red-50 items-center justify-center mb-4">
              <Info size={24} color="#EF4444" />
            </View>
            <Text className="font-outfit-bold text-text text-center">Không tải được dữ liệu</Text>
            <Text className="text-xs font-inter text-muted mt-2 text-center">
              Đã có lỗi xảy ra khi kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.
            </Text>
            <Pressable
              onPress={() => onRefresh()}
              className="mt-6 px-8 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Tải lại trang</Text>
            </Pressable>
          </Card>
        ) : (
          <View style={{ gap: 14 }}>
            {myActive && (
              <QueueOrderCard
                order={myActive}
                isActive
                onOpen={() => router.push(`/(staff)/orders/${myActive.id}` as never)}
                onRelease={() => {
                  Alert.alert('Nhả đơn', 'Bạn muốn nhả đơn này để hệ thống phân công lại?', [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Nhả đơn', style: 'destructive', onPress: () => releaseMutation.mutate(myActive.id) },
                  ]);
                }}
                isSubmitting={releaseMutation.isPending}
              />
            )}

            {queue.length > 0 && (
              <>
                {queue.map((o) => (
                  <QueueOrderCard
                    key={o.id}
                    order={o}
                    onOpen={() => router.push(`/(staff)/orders/${o.id}` as never)}
                    onAssign={() => assignMutation.mutate(o.id)}
                    isSubmitting={assignMutation.isPending || Boolean(myActive)}
                  />
                ))}
              </>
            )}

            {queue.length === 0 && !myActive && (
              <View className="py-20 items-center justify-center">
                <View className="w-20 h-20 rounded-full bg-surface2 items-center justify-center mb-4">
                  <ShoppingBag size={32} color="#94A3B8" strokeWidth={1.5} />
                </View>
                <Text className="text-[15px] font-outfit-bold text-text text-center">Chưa có đơn hàng mới</Text>
                <Text className="text-xs font-inter text-muted mt-1 text-center px-10">
                  Hệ thống sẽ tự động cập nhật khi có đơn hàng được phân công cho bạn.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QueueOrderCard({
  order,
  onAssign,
  onOpen,
  onRelease,
  isActive,
  isSubmitting,
}: {
  order: StaffOrderQueueItem;
  onAssign?: () => void;
  onOpen: () => void;
  onRelease?: () => void;
  isActive?: boolean;
  isSubmitting: boolean;
}) {
  const timeStr = useMemo(() => {
    if (!order.createdAt) return null;
    return timeAgo(new Date(order.createdAt));
  }, [order.createdAt]);

  return (
    <Pressable onPress={onOpen}>
      <Card 
        className="p-5" 
        style={isActive ? { borderColor: '#16A34A', borderWidth: 1.5, shadowColor: '#16A34A', shadowOpacity: 0.1, shadowRadius: 20 } : {}}
      >
        <View className="flex-row items-start justify-between">
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View className="flex-row items-center">
              <Text className="text-[17px] font-outfit-bold text-text">
                #{order.orderNumber || order.id}
              </Text>
              {isActive && (
                <View className="ml-2 px-2 py-0.5 bg-primary rounded-full flex-row items-center">
                  <View className="w-1 h-1 rounded-full bg-white mr-1" />
                  <Text className="text-[9px] font-outfit-bold text-white uppercase tracking-wider">Đang xử lý</Text>
                </View>
              )}
            </View>
            
            <View className="flex-row items-center mt-2">
              <MapPin size={13} color="#94A3B8" />
              <Text className="text-[13px] font-inter text-muted ml-1.5 flex-1" numberOfLines={1}>
                {order.addressLine ?? 'Chưa có địa chỉ'}
              </Text>
            </View>

            <View className="flex-row items-center mt-2.5" style={{ gap: 15 }}>
              <View className="flex-row items-center">
                <Package size={13} color="#94A3B8" />
                <Text className="text-[12px] font-inter-bold text-text ml-1.5">
                  {order.totalItems ?? 0} <Text className="font-inter text-muted">món</Text>
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={13} color="#94A3B8" />
                <Text className="text-[12px] font-inter text-muted ml-1.5">{timeStr || 'Vừa xong'}</Text>
              </View>
            </View>
          </View>

          <View className="flex-col items-end justify-between" style={{ minHeight: 70 }}>
            <Text className="text-[15px] font-outfit-bold text-primary">
              {order.totalAmount != null ? formatMoney(order.totalAmount) : '—'}
            </Text>
            
            <View className="flex-row items-center mt-auto" style={{ gap: 8 }}>
              {isActive ? (
                <>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onRelease?.();
                    }}
                    className="w-9 h-9 rounded-xl bg-surface border border-border items-center justify-center"
                  >
                    <RefreshCcw size={16} color="#64748B" />
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onOpen();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary shadow-sm shadow-primary/20"
                  >
                    <Text className="font-outfit-bold text-primary-fg text-xs">Mở</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onAssign?.();
                  }}
                  disabled={isSubmitting}
                  className={cn(
                    'px-6 py-2.5 rounded-xl shadow-sm',
                    isSubmitting ? 'bg-surface border border-border shadow-none' : 'bg-primary shadow-primary/20'
                  )}
                >
                  <Text className={isSubmitting ? 'font-outfit-bold text-muted text-xs' : 'font-outfit-bold text-primary-fg text-xs'}>
                    Nhận
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' năm';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' tháng';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' ngày';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' giờ';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' phút';
  return Math.floor(seconds) + ' giây';
}

function formatMoney(v: number) {
  if (!Number.isFinite(v)) return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
}
