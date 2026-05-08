import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { userApi } from '../../src/api/users';

export default function ProfileEditScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const userId = authUser?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => userApi.getUserProfile(userId as number),
    enabled: typeof userId === 'number' && userId > 0,
    staleTime: 2 * 60 * 1000,
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () =>
      userApi.updateUserProfile(userId as number, {
        fullName: fullName.trim(),
        phone: phone.trim(),
      }),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: ['userProfile', userId] });
      if (authUser) {
        setUser({ ...authUser, fullName: updated.fullName ?? authUser.fullName });
      }
      Alert.alert('Thành công', 'Thông tin hồ sơ đã được cập nhật.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
    },
  });

  const hasChanges =
    (fullName.trim() !== (profile?.fullName ?? '')) ||
    (phone.trim() !== (profile?.phone ?? ''));

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: true, title: 'Chỉnh sửa hồ sơ' }} />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Email (read-only) */}
          <View className="mb-5">
            <Text className="text-xs font-inter-bold text-muted uppercase mb-1.5">Email</Text>
            <View className="bg-surface border border-border rounded-2xl px-4 py-3">
              <Text className="font-inter text-muted">{profile?.email ?? authUser?.email ?? '—'}</Text>
            </View>
            <Text className="text-xs font-inter text-muted mt-1">Email không thể thay đổi.</Text>
          </View>

          {/* Họ và tên */}
          <View className="mb-5">
            <Text className="text-xs font-inter-bold text-muted uppercase mb-1.5">Họ và tên</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#94a3b8"
              className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
              style={{ paddingVertical: 12, fontSize: 15 }}
              autoCapitalize="words"
            />
          </View>

          {/* Số điện thoại */}
          <View className="mb-8">
            <Text className="text-xs font-inter-bold text-muted uppercase mb-1.5">Số điện thoại</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#94a3b8"
              className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
              style={{ paddingVertical: 12, fontSize: 15 }}
              keyboardType="phone-pad"
            />
          </View>

          {/* Nút lưu */}
          <Pressable
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !hasChanges}
            style={{
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: 'center',
              backgroundColor:
                updateMutation.isPending || !hasChanges ? '#e2e8f0' : '#22c55e',
            }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={{
                  fontWeight: '700',
                  fontSize: 16,
                  color: !hasChanges ? '#94a3b8' : '#ffffff',
                }}
              >
                Lưu thay đổi
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-3 items-center py-4"
          >
            <Text className="font-inter text-muted">Hủy</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
