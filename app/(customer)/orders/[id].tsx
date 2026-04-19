import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../../src/api/orders';

export default function OrderDetail() {
  const params = useLocalSearchParams();
  const orderId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    const parsed = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.id]);
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getOrderById(orderId),
    enabled: orderId > 0,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <View className="flex-1 bg-background p-6">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chi tiết đơn',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500 font-inter">Đang tải đơn hàng...</Text>
        </View>
      ) : isError || !order ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500 font-inter">Không tìm thấy đơn hàng.</Text>
        </View>
      ) : (
        <View className="gap-y-3">
          <Card className="p-4 border border-slate-100">
            <Text className="text-xs font-inter-bold text-slate-400 uppercase">Mã đơn</Text>
            <Text className="text-xl font-outfit-bold text-slate-900 mt-1">{order.code}</Text>
            <Text className="text-sm font-inter text-slate-500 mt-2">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </Text>
          </Card>

          <Card className="p-4 border border-slate-100">
            <Text className="text-sm font-inter-bold text-slate-800">Sản phẩm</Text>
            <View className="mt-3 gap-y-2">
              {order.items.map((i) => (
                <View key={i.productId} className="flex-row items-center justify-between">
                  <Text className="text-sm font-inter text-slate-700" numberOfLines={1}>
                    {i.name} × {i.quantity}
                  </Text>
                  <Text className="text-sm font-inter-bold text-slate-900">
                    {(i.price * i.quantity).toLocaleString('vi-VN')}₫
                  </Text>
                </View>
              ))}
            </View>
            <View className="h-px bg-slate-100 my-4" />
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-inter text-slate-500">Tạm tính</Text>
              <Text className="text-sm font-inter-bold text-slate-900">{order.subtotal.toLocaleString('vi-VN')}₫</Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sm font-inter text-slate-500">Phí ship</Text>
              <Text className="text-sm font-inter-bold text-slate-900">{order.shippingFee.toLocaleString('vi-VN')}₫</Text>
            </View>
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-sm font-inter-bold text-slate-700">Tổng</Text>
              <Text className="text-lg font-outfit-bold text-slate-900">{order.total.toLocaleString('vi-VN')}₫</Text>
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}
