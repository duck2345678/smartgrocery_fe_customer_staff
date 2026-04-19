import { useState } from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';

export default function CustomerProfile() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  return (
    <View className="flex-1 bg-background p-6">
      <View className="mt-10">
        <Text className="text-2xl font-outfit-bold text-slate-900">Tài khoản</Text>
        <Text className="text-slate-500 font-inter mt-1">{user?.email}</Text>
      </View>

      <View className="mt-8">
        <Button
          label="Đăng xuất"
          variant="outline"
          loading={loading}
          onPress={async () => {
            if (loading) return;
            setLoading(true);
            logout();
            setLoading(false);
          }}
        />
      </View>
    </View>
  );
}
