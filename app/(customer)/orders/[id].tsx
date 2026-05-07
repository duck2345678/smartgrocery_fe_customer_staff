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
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted font-inter">Đang tải đơn hàng...</Text>
        </View>
      ) : isError || !order ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted font-inter">Không tìm thấy đơn hàng.</Text>
        </View>
      ) : (
        <View className="gap-y-3">
          <Card className="p-4 border border-border">
            <Text className="text-xs font-inter-bold text-muted uppercase">Mã đơn</Text>
            <Text className="text-xl font-outfit-bold text-text mt-1">{order.orderNumber}</Text>
            <Text className="text-sm font-inter text-muted mt-2">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </Text>
          </Card>

          <Card className="p-4 border border-border">
            <Text className="text-sm font-inter-bold text-text">Sản phẩm</Text>
            <View className="mt-3 gap-y-2">
              {order.items.map((i) => (
                <View key={i.id} className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-inter text-text" numberOfLines={1}>
                      {i.productName} × {i.quantity}
                    </Text>
                  </View>
                  <Text className="text-sm font-inter-bold text-text">{i.totalPrice.toLocaleString('vi-VN')}₫</Text>
                </View>
              ))}
            </View>
            <View className="h-px bg-border my-4" />
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-inter text-muted">Tạm tính</Text>
              <Text className="text-sm font-inter-bold text-text">{order.subtotal.toLocaleString('vi-VN')}₫</Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sm font-inter text-muted">Phí ship</Text>
              <Text className="text-sm font-inter-bold text-text">{order.shippingFee.toLocaleString('vi-VN')}₫</Text>
            </View>
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-sm font-inter-bold text-text">Tổng</Text>
              <Text className="text-lg font-outfit-bold text-text">{order.totalAmount.toLocaleString('vi-VN')}₫</Text>
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}
