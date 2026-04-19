import { View, Text, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Card from '../../../src/components/ui/Card';
import { Order } from '../../../src/types/order';
import { useOrders } from '../../../src/hooks/useOrders';
import { RefreshCw, ShoppingBag } from 'lucide-react-native';
import { clsx } from 'clsx';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PENDING: { label: 'Mới tạo', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  PROCESSING: { label: 'Đang xử lý', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  SHIPPED: { label: 'Đang giao', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  DELIVERED: { label: 'Đã giao', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  CANCELLED: { label: 'Đã huỷ', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isLoading, isError, refetch } = useOrders();

  const renderItem = ({ item }: { item: Order }) => {
    const statusInfo = STATUS_LABELS[item.status] ?? STATUS_LABELS.PENDING;
    return (
      <Pressable onPress={() => router.push(`/(customer)/orders/${item.id}` as never)}>
        <Card className="mb-3 p-4 border border-slate-100">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-inter-bold text-slate-400 uppercase">Đơn hàng</Text>
            <View className={clsx('px-2.5 py-1 rounded-full border', statusInfo.bg, statusInfo.border)}>
              <Text className={clsx('text-[10px] font-inter-bold', statusInfo.color)}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
          <Text className="text-lg font-outfit-bold text-slate-900 mt-1">{item.orderNumber}</Text>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-sm font-inter text-slate-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
            <Text className="text-sm font-inter-bold text-slate-900">{item.totalAmount.toLocaleString('vi-VN')}₫</Text>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Đơn hàng',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />
      <View className="flex-1 px-6 pt-4">
        <FlashList
          data={orders}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          estimatedItemSize={120}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              {isError ? (
                <View className="items-center">
                  <Text className="text-slate-500 font-inter mb-4">
                    Không tải được đơn hàng.
                  </Text>
                  <Pressable
                    onPress={() => refetch()}
                    className="flex-row items-center px-5 py-3 bg-emerald-500 rounded-2xl"
                  >
                    <RefreshCw size={16} color="#FFF" />
                    <Text className="text-white font-inter-bold ml-2">Thử lại</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center">
                  <ShoppingBag size={48} color="#CBD5E1" />
                  <Text className="text-slate-400 font-inter mt-4">Chưa có đơn hàng nào.</Text>
                </View>
              )}
            </View>
          }
        />
      </View>
    </View>
  );
}
