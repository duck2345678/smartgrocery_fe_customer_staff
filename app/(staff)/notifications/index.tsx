import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Bell } from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';

export default function StaffNotificationsScreen() {
  const router = useRouter();

  const notificationsQuery = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: () => Promise.resolve([] as any[]),
    staleTime: 5000,
  });

  const notifications = notificationsQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center mr-3">
          <ChevronLeft size={20} color="#0F172A" />
        </Pressable>
        <View>
          <Text className="text-xl font-outfit-bold text-text">Thông báo</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">Cập nhật công việc và hệ thống.</Text>
        </View>
      </View>

      <View className="flex-1 px-4 pb-4">
        {notificationsQuery.isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
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
            <Text className="text-sm font-inter text-muted">Bạn chưa có thông báo nào.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingTop: 10, paddingBottom: 18, gap: 10 }}>
            {notifications.map((notif: any, index: number) => (
              <Card key={index} className="p-4">
                <Text className="font-outfit-bold text-text">{notif.title || 'Thông báo'}</Text>
                <Text className="text-sm font-inter text-muted mt-1">{notif.body}</Text>
                <Text className="text-[10px] font-inter text-muted mt-2">Vừa xong</Text>
              </Card>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
