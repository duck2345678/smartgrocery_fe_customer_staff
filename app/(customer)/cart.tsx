import { View, Text, Pressable, Alert, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { useCart } from '../../src/hooks/useCart';
import { CartItem } from '../../src/types/cart';

export default function CartScreen() {
  const router = useRouter();
  const { items, subtotal, isLoading, isError, refetch, updateQuantity, removeItem, isUpdating } =
    useCart();

  const data = useMemo(() => items, [items]);

  const renderItem = ({ item }: { item: CartItem }) => (
    <Card className="mb-3 p-4 border border-border">
      <View className="flex-row">
        <View className="w-20 h-20 rounded-2xl bg-surface2 overflow-hidden">
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="disk"
          />
        </View>

        <View className="flex-1 ml-4">
          <Text className="text-base font-outfit-bold text-slate-900" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs font-inter text-muted mt-1">
            {item.price.toLocaleString('vi-VN')}₫ / {item.unit}
          </Text>

          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center bg-surface2 rounded-xl p-1">
              <Pressable
                onPress={async () => {
                  try {
                    await updateQuantity({ cartItemId: item.cartItemId as number, quantity: item.quantity - 1 });
                  } catch (e) {
                    Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật giỏ hàng.', [{ text: 'Đóng' }]);
                  }
                }}
                className="p-2"
                disabled={item.quantity <= 1}
                style={{ opacity: item.quantity <= 1 ? 0.3 : 1 }}
              >
                <Minus size={18} color="#334155" />
              </Pressable>
              <View className="px-3 min-w-[42px] items-center">
                <Text className="text-lg font-outfit-bold text-text">{item.quantity}</Text>
              </View>
              <Pressable
                onPress={async () => {
                  try {
                    await updateQuantity({ cartItemId: item.cartItemId as number, quantity: item.quantity + 1 });
                  } catch (e) {
                    Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể cập nhật giỏ hàng.', [{ text: 'Đóng' }]);
                  }
                }}
                className="p-2"
                disabled={item.quantity >= item.stock}
                style={{ opacity: item.quantity >= item.stock ? 0.3 : 1 }}
              >
                <Plus size={18} color="#334155" />
              </Pressable>
            </View>

            <Pressable
              onPress={async () => {
                try {
                  await removeItem({ cartItemId: item.cartItemId as number });
                } catch (e) {
                  Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể xoá sản phẩm.', [{ text: 'Đóng' }]);
                }
              }}
              className="p-2"
            >
              <Trash2 size={18} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Giỏ hàng',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      <View className="flex-1 px-6 pt-4">
        <FlashList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.productId)}
          estimatedItemSize={130}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-slate-500 font-inter">Giỏ hàng đang trống.</Text>
            </View>
          }
        />
        {isError ? (
          <View className="pt-4 items-center">
            <Text className="text-slate-400 font-inter">Không tải được giỏ hàng. Kéo để thử lại.</Text>
          </View>
        ) : null}
      </View>

      <View className="p-6 bg-surface border-t border-border">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-inter text-muted">Tạm tính</Text>
          <Text className="text-lg font-outfit-bold text-text">{subtotal.toLocaleString('vi-VN')}₫</Text>
        </View>
        <Button
          label="Thanh toán"
          onPress={() => router.push('/(customer)/checkout' as never)}
          disabled={items.length === 0}
          loading={isUpdating}
          hapticVariant="success"
        />
      </View>
    </View>
  );
}
