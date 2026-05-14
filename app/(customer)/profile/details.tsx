import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, User, Phone, Mail, Save } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/authStore';
import { userApi } from '../../../src/api/users';

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên đầy đủ.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await userApi.updateProfile(user.id, {
        fullName: fullName.trim(),
        phone: phone.trim()
      });
      setUser(updatedUser);
      Alert.alert('Thành công', 'Thông tin hồ sơ của bạn đã được cập nhật.');
      router.back();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật hồ sơ lúc này.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* ───── Header ───── */}
      <View className="px-5 py-4 flex-row items-center border-b border-slate-100">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center mr-3"
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <View>
          <Text className="text-[18px] font-outfit-bold text-slate-900">Hồ sơ cá nhân</Text>
          <Text className="text-[12px] font-inter text-slate-500">Chỉnh sửa thông tin tài khoản của bạn</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-8"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="gap-y-6">
          {/* Full Name Input */}
          <View>
            <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">Họ và tên</Text>
            <View className="flex-row items-center px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <User size={20} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 font-inter text-[15px] text-slate-900"
                placeholder="Nhập họ tên của bạn"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email Input (Disabled) */}
          <View>
            <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">Email (Không thể sửa)</Text>
            <View className="flex-row items-center px-4 py-3.5 bg-slate-100 rounded-2xl border border-slate-200">
              <Mail size={20} color="#CBD5E1" />
              <TextInput
                className="flex-1 ml-3 font-inter text-[15px] text-slate-400"
                value={user?.email}
                editable={false}
              />
            </View>
          </View>

          {/* Phone Input */}
          <View>
            <Text className="text-[13px] font-inter-bold text-slate-500 mb-2 ml-1">Số điện thoại</Text>
            <View className="flex-row items-center px-4 py-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <Phone size={20} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 font-inter text-[15px] text-slate-900"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* ───── Save Button ───── */}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          className="mt-12 bg-primary py-4 rounded-[24px] flex-row items-center justify-center shadow-lg shadow-emerald-500/30"
          style={{ elevation: 5 }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save size={20} color="#FFFFFF" className="mr-2" />
              <Text className="text-white font-inter-bold text-[16px] ml-2">Lưu thay đổi</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
