import { View, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import { CheckCircle2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../src/api/orders';

export default function OrderSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawOrderNumber = useMemo(() => {
    const raw = Array.isArray(params.orderNumber) ? params.orderNumber[0] : params.orderNumber;
    const normalized = String(raw ?? '').trim();
    return normalized.length > 0 ? normalized : null;
  }, [params.orderNumber]);
  const orderId = useMemo(() => {
    const raw = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
    const parsed = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.orderId]);
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getOrderById(orderId),
    enabled: orderId > 0,
    staleTime: 2 * 60 * 1000,
  });

  const displayOrderNumber = order?.orderNumber ?? rawOrderNumber;
  const itemCount = order?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <View className="flex-1 bg-background p-6">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 justify-center">
        <View className="items-center">
          <CheckCircle2 size={72} color="#16A34A" />
          <Text className="text-2xl font-outfit-bold text-slate-900 mt-6">Đặt hàng thành công</Text>
          {displayOrderNumber ? (
            <Text className="text-slate-500 font-inter mt-2">Mã đơn: {displayOrderNumber}</Text>
          ) : orderId > 0 ? (
            <Text className="text-slate-500 font-inter mt-2">Mã tham chiếu: #{orderId}</Text>
          ) : (
            <Text className="text-slate-500 font-inter mt-2">Cảm ơn bạn đã mua sắm!</Text>
          )}
        </View>

        {order ? (
          <View className="mt-6 rounded-3xl border border-border bg-white p-4">
            <Text className="text-sm font-inter text-muted">Chi tiết đơn hàng</Text>
            <View className="mt-3 space-y-2">
              <Text className="text-base font-inter text-text">Số sản phẩm: {itemCount}</Text>
              <Text className="text-base font-inter text-text">Thanh toán: {order.paymentMethod}</Text>
              <Text className="text-base font-inter text-text">Trạng thái: {order.status}</Text>
              <Text className="text-base font-inter text-text">Tổng thanh toán: {order.totalAmount.toLocaleString('vi-VN')}₫</Text>
            </View>
            {order.items?.length > 0 ? (
              <View className="mt-4">
                <Text className="text-sm font-inter-bold text-text mb-2">Mặt hàng</Text>
                {order.items.slice(0, 3).map((item) => (
                  <View key={item.id} className="flex-row items-center justify-between py-1">
                    <Text className="text-sm font-inter text-text" numberOfLines={1}>
                      {item.productName} x{item.quantity}
                    </Text>
                    <Text className="text-sm font-inter-bold text-text">
                      {item.totalPrice.toLocaleString('vi-VN')}₫
                    </Text>
                  </View>
                ))}
                {order.items.length > 3 ? (
                  <Text className="text-xs font-inter text-muted mt-2">+ {order.items.length - 3} sản phẩm khác</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : isLoading ? (
          <Text className="text-sm font-inter text-muted mt-6">Đang tải chi tiết đơn hàng…</Text>
        ) : isError ? (
          <Text className="text-sm font-inter text-muted mt-6">Không thể tải chi tiết đơn hàng.</Text>
        ) : null}
      </View>

      <View className="gap-y-3">
        <Button
          label="Xem đơn hàng"
          onPress={() => {
            if (orderId > 0) {
              router.replace({
                pathname: '/(customer)/orders/[id]',
                params: {
                  id: String(orderId),
                },
              } as never);
              return;
            }
            router.replace('/(customer)/orders' as never);
          }}
          hapticVariant="success"
        />
        <Button label="Tiếp tục mua sắm" variant="outline" onPress={() => router.replace('/(customer)' as never)} />
      </View>
    </View>
  );
}

