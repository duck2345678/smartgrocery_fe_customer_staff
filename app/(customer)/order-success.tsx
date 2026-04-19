import { View, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import { CheckCircle2 } from 'lucide-react-native';

export default function OrderSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;

  return (
    <View className="flex-1 bg-background p-6">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 items-center justify-center">
        <CheckCircle2 size={72} color="#22C55E" />
        <Text className="text-2xl font-outfit-bold text-slate-900 mt-6">Đặt hàng thành công</Text>
        {orderId ? (
          <Text className="text-slate-500 font-inter mt-2">Mã đơn: SG-ORD-{String(orderId)}</Text>
        ) : (
          <Text className="text-slate-500 font-inter mt-2">Cảm ơn bạn đã mua sắm!</Text>
        )}
      </View>

      <View className="gap-y-3">
        <Button label="Xem đơn hàng" onPress={() => router.replace('/(customer)/orders' as never)} hapticVariant="success" />
        <Button label="Tiếp tục mua sắm" variant="outline" onPress={() => router.replace('/(customer)' as never)} />
      </View>
    </View>
  );
}

