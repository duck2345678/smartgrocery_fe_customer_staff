import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

export default function CompleteSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF7] px-5 justify-center">
      <View className="items-center">
        <View className="w-24 h-24 rounded-full bg-[#EAF8F0] items-center justify-center mb-5">
          <CheckCircle2 size={58} color="#16A34A" />
        </View>
        <Text className="text-[26px] font-outfit-bold text-[#0F172A] text-center">Hoàn tất giao hàng</Text>
        <Text className="mt-3 text-[15px] font-inter text-slate-500 text-center leading-6">
          Đơn hàng đã được xác nhận giao xong và lưu lại ảnh POD thành công.
        </Text>

        <Pressable
          onPress={() => router.replace('/(staff)/orders' as never)}
          className="mt-8 w-full px-4 py-4 rounded-2xl items-center"
          style={{ backgroundColor: '#16A34A' }}
        >
          <Text className="font-outfit-bold text-white text-[15px]">Quay về danh sách đơn</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
