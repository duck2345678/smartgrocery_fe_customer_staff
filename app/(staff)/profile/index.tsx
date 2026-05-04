import React from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/store/authStore';
import { useStaffProfileStore } from '../../../src/store/staffProfileStore';

export default function StaffProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const receiveInAppNotifications = useStaffProfileStore((s) => s.receiveInAppNotifications);
  const setReceiveInAppNotifications = useStaffProfileStore((s) => s.setReceiveInAppNotifications);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Cá nhân', headerShown: false }} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}>
        <View>
          <Text className="text-xl font-outfit-bold text-text">Cá nhân</Text>
          <Text className="text-xs font-inter text-muted mt-1">Quản lý tài khoản và tuỳ chọn làm việc.</Text>
        </View>

        <Card className="p-4">
          <Text className="font-inter-bold text-text">Thông tin tài khoản</Text>
          <View className="mt-3" style={{ gap: 8 }}>
            <Row label="Họ tên" value={user?.fullName ?? '—'} />
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Vai trò" value={user?.role ?? '—'} />
          </View>
        </Card>

        <Card className="p-4">
          <Text className="font-inter-bold text-text">Tuỳ chọn</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text className="font-inter text-text">Thông báo trong app</Text>
              <Text className="text-xs font-inter text-muted mt-1">Hiển thị banner khi có thông báo mới.</Text>
            </View>
            <Switch value={receiveInAppNotifications} onValueChange={setReceiveInAppNotifications} />
          </View>
        </Card>

        <Card className="p-4">
          <Text className="font-inter-bold text-text">Phiên làm việc</Text>
          <Text className="text-xs font-inter text-muted mt-1">Đăng xuất khỏi thiết bị này.</Text>
          <View className="mt-3">
            <Button
              label="Đăng xuất"
              variant="outline"
              onPress={() => {
                Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất khỏi tài khoản này?', [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: () => {
                      logout();
                      router.replace('/(auth)/login' as never);
                    },
                  },
                ]);
              }}
            />
          </View>
        </Card>

        <Pressable onPress={() => router.push('/(auth)/design-system' as never)} className="items-center py-2">
          <Text className="text-xs font-inter text-muted">Design System (Demo)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-xs font-inter text-muted">{label}</Text>
      <Text className="text-sm font-inter text-text" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
