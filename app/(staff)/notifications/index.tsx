import { Pressable, ScrollView, Text, View, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Bell } from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { staffNotificationsApi, type StaffNotification } from '../../../src/api/staffNotifications';
import { useState } from 'react';

function formatDate(s: string) {
  if (!s) return '';
  return new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

const TYPE_LABELS: Record<string, string> = {
  ORDER_ASSIGNED:   'Đơn mới được giao',
  ORDER_ON_HOLD:    'Đơn bị tạm dừng',
  ISSUE_RESOLVED:   'Vấn đề đã giải quyết',
  SYSTEM:           'Hệ thống',
};

export default function StaffNotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: () => staffNotificationsApi.list(),
    staleTime: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => staffNotificationsApi.markRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['staff-notifications'] }),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await notificationsQuery.refetch();
    setRefreshing(false);
  };

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center mr-3"
        >
          <ChevronLeft size={20} color="#0F172A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text className="text-xl font-outfit-bold text-text">Thông báo</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Cập nhật công việc và hệ thống.'}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: '#fef3c7' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#b45309' }}>{unreadCount}</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-1 px-4 pb-4">
        {notificationsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#22C55E" />
            <Text className="text-xs font-inter text-muted mt-2">Đang tải…</Text>
          </View>
        ) : notificationsQuery.isError ? (
          <Card className="p-4 mt-4">
            <Text className="font-inter-bold text-text">Không tải được thông báo.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Vui lòng thử lại.</Text>
            <Pressable
              onPress={() => void notificationsQuery.refetch()}
              className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Tải lại</Text>
            </Pressable>
          </Card>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-surface border border-border items-center justify-center mb-4">
              <Bell size={28} color="#64748B" />
            </View>
            <Text className="text-sm font-inter-bold text-text">Chưa có thông báo nào</Text>
            <Text className="text-xs font-inter text-muted mt-1 text-center">
              Các cập nhật về đơn hàng và hệ thống sẽ xuất hiện ở đây.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 18, gap: 10 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            {notifications.map((notif: StaffNotification) => (
              <NotificationCard
                key={notif.id}
                notif={notif}
                onMarkRead={() => markReadMutation.mutate(notif.id)}
                isMarking={markReadMutation.isPending && markReadMutation.variables === notif.id}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function NotificationCard({
  notif,
  onMarkRead,
  isMarking,
}: {
  notif: StaffNotification;
  onMarkRead: () => void;
  isMarking: boolean;
}) {
  return (
    <Card
      className="p-4"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: notif.isRead ? '#e2e8f0' : '#22c55e',
        backgroundColor: notif.isRead ? undefined : '#f0fdf4',
      }}
    >
      <View className="flex-row items-start justify-between">
        <View style={{ flex: 1 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Text className="font-inter-bold text-text" numberOfLines={1}>
              {notif.title || TYPE_LABELS[notif.notificationType] || 'Thông báo'}
            </Text>
            {!notif.isRead ? (
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' }} />
            ) : null}
          </View>
          <Text className="text-sm font-inter text-muted mt-1" numberOfLines={3}>
            {notif.message}
          </Text>
          <Text className="text-xs font-inter text-muted mt-2">{formatDate(notif.createdAt)}</Text>
        </View>
      </View>

      {!notif.isRead ? (
        <Pressable
          onPress={onMarkRead}
          disabled={isMarking}
          className="mt-3 px-3 py-2 rounded-xl bg-surface border border-border items-center self-end"
        >
          {isMarking ? (
            <ActivityIndicator size="small" color="#22C55E" />
          ) : (
            <Text className="text-xs font-inter text-muted">Đánh dấu đã đọc</Text>
          )}
        </Pressable>
      ) : null}
    </Card>
  );
}
