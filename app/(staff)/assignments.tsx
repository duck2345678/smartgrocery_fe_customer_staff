import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ClipboardList } from 'lucide-react-native';
import Button from '../../src/components/ui/Button';

export default function AssignmentsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background p-6">
      <View className="flex-1 justify-center items-center">
        <View className="w-20 h-20 rounded-full bg-surface border border-border items-center justify-center">
          <ClipboardList size={36} color="#94A3B8" />
        </View>
        <Text className="text-xl font-outfit-bold text-text mt-4">Danh sách phân công</Text>
        <Text className="text-muted font-inter text-center mt-2">
          Màn hình này hiển thị chi tiết các đơn hàng bạn đã nhận và đang xử lý.
        </Text>
      </View>
      <Button label="Về trang vận hành" variant="outline" onPress={() => router.push('/(staff)' as never)} />
    </SafeAreaView>
  );
}
