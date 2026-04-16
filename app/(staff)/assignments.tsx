import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { ClipboardList } from 'lucide-react-native';

export default function AssignmentsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
      <ClipboardList size={64} color="#CBD5E1" />
      <Text className="text-xl font-outfit-bold text-slate-800 mt-4">Danh sách phân công</Text>
      <Text className="text-slate-500 font-inter text-center mt-2">
        Màn hình này hiển thị chi tiết các đơn hàng bạn đã nhận và đang xử lý.
      </Text>
    </SafeAreaView>
  );
}
