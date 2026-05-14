import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';
import { ChevronRight, History, MapPin, UserCircle2 } from 'lucide-react-native';

export default function CustomerProfile() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <View className="flex-1 bg-background p-6">
      <View className="mt-10 mb-6">
        <Text className="text-2xl font-outfit-bold text-text">{user?.fullName ?? 'Khách hàng'}</Text>
        <Text className="text-sm font-inter text-muted mt-1">{user?.email}</Text>
      </View>

      <View className="space-y-3">
        <PressableCard
          title="Thông tin hồ sơ"
          description="Chỉnh sửa tên và số điện thoại."
          icon={<UserCircle2 size={18} color="#0F172A" />}
          onPress={() => router.push('/(customer)/profile-edit' as never)}
        />

        <PressableCard
          title="Địa chỉ giao hàng"
          description="Thêm, sửa, xóa địa chỉ giao hàng."
          icon={<MapPin size={18} color="#0F172A" />}
          onPress={() => router.push('/(customer)/addresses' as never)}
        />

        <PressableCard
          title="Đơn hàng của tôi"
          description="Xem lịch sử và trạng thái đơn hàng."
          icon={<History size={18} color="#16A34A" />}
          onPress={() => router.push('/(customer)/orders' as never)}
        />
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

function PressableCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="rounded-3xl border border-border bg-white p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-3">
          <View className="w-11 h-11 rounded-2xl bg-slate-100 items-center justify-center">
            {icon}
          </View>
          <View>
            <Text className="text-base font-inter-bold text-text">{title}</Text>
            <Text className="text-xs font-inter text-muted mt-1">{description}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </View>
    </Pressable>
  );
}
