import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { ChevronRight, History, MapPin, Settings } from 'lucide-react-native';

export default function CustomerProfile() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <View className="flex-1 bg-background p-6">
      <View className="mt-10">
        <Text className="text-2xl font-outfit-bold text-slate-900">Tài khoản</Text>
        <Text className="text-slate-500 font-inter mt-1">{user?.email}</Text>
      </View>

      <View className="mt-6 gap-y-3">
        <Pressable onPress={() => router.push('/(customer)/orders' as never)}>
          <Card className="p-4 border border-slate-100">
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
                <History size={18} color="#22C55E" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-inter-bold text-slate-900">Đơn hàng</Text>
                <Text className="text-xs font-inter text-slate-500 mt-1">Xem lịch sử và theo dõi trạng thái đơn.</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển.')}>
          <Card className="p-4 border border-slate-100">
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center">
                <MapPin size={18} color="#0F172A" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-inter-bold text-slate-900">Sổ địa chỉ</Text>
                <Text className="text-xs font-inter text-slate-500 mt-1">Quản lý địa chỉ giao hàng.</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={() => Alert.alert('Thông báo', 'Tính năng đang được phát triển.')}>
          <Card className="p-4 border border-slate-100">
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center">
                <Settings size={18} color="#0F172A" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-inter-bold text-slate-900">Cài đặt</Text>
                <Text className="text-xs font-inter text-slate-500 mt-1">Bảo mật và tuỳ chọn tài khoản.</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </View>
          </Card>
        </Pressable>
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
