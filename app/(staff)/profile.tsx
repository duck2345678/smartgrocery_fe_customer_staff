import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Card from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/authStore';

export default function StaffProfileScreen() {
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Hồ sơ nhân sự', headerShown: true }} />

      <View className="p-4 gap-y-3">
        <Card className="p-4 border border-border bg-surface">
          <Text className="font-outfit-bold text-text">Thông tin cá nhân</Text>
          <View className="mt-3 gap-y-2">
            <Row label="Họ tên" value={user?.fullName ?? '-'} />
            <Row label="Email" value={user?.email ?? '-'} />
            <Row label="Vai trò" value={user?.role ?? 'STAFF'} />
            <Row label="Mã người dùng" value={user?.id != null ? String(user.id) : '-'} />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm font-inter text-muted">{label}</Text>
      <Text className="text-sm font-inter-bold text-text">{value}</Text>
    </View>
  );
}
