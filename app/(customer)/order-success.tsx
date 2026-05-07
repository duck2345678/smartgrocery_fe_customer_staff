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
  const { data: order } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getOrderById(orderId),
    enabled: orderId > 0,
    staleTime: 2 * 60 * 1000,
  });

  const displayOrderNumber = order?.orderNumber ?? rawOrderNumber;

  return (
    <View className="flex-1 bg-background p-6">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center">
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

