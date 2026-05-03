import React, { useCallback } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import Skeleton from '../../src/components/ui/Skeleton';
import { staffNotificationsApi, type StaffNotification } from '../../src/api/staffNotifications';

const formatTime = (iso: string) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  return new Date(t).toLocaleString('vi-VN');
};

export default function StaffNotificationsScreen() {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: () => staffNotificationsApi.list(),
    staleTime: 5000,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => staffNotificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
    onError: (e) => Alert.alert('Lỗi', (e as Error).message, [{ text: 'Đóng' }]),
  });

  const onPressItem = useCallback(
    (n: StaffNotification) => {
      if (n.isRead) return;
      markRead.mutate(n.id);
    },
    [markRead]
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Thông báo', headerShown: true }} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-outfit-bold text-text">Hộp thư</Text>
            <Button label="Làm mới" variant="outline" onPress={() => void listQuery.refetch()} />
          </View>
          <Text className="text-xs font-inter text-muted mt-1">
            Nhấn vào item chưa đọc để đánh dấu đã đọc.
          </Text>
        </Card>

        {listQuery.isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </>
        ) : listQuery.isError ? (
          <Card className="p-4">
            <Text className="text-sm font-inter text-muted">Không tải được thông báo.</Text>
            <View className="mt-3">
              <Button label="Thử lại" onPress={() => void listQuery.refetch()} />
            </View>
          </Card>
        ) : (listQuery.data ?? []).length === 0 ? (
          <Card className="p-4">
            <Text className="text-sm font-inter text-muted">Chưa có thông báo.</Text>
          </Card>
        ) : (
          (listQuery.data ?? []).map((n) => (
            <Pressable key={n.id} onPress={() => onPressItem(n)}>
              <Card className={`p-4 border ${n.isRead ? 'border-border bg-surface' : 'border-amber-200 bg-amber-50'}`}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-inter-bold text-text">{n.title}</Text>
                    <Text className="text-xs font-inter text-muted mt-1">{n.message}</Text>
                    <Text className="text-[11px] font-inter text-muted mt-2">
                      {formatTime(n.createdAt)} • {n.notificationType}
                    </Text>
                  </View>
                  {!n.isRead ? (
                    <View className="px-2 py-1 rounded-full bg-amber-500">
                      <Text className="text-[10px] font-inter-bold text-white">MỚI</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
