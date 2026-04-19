import { useMemo, useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Input from '../../src/components/ui/Input';
import { useCart } from '../../src/hooks/useCart';
import { useCheckout } from '../../src/hooks/useCheckout';
import { useAuthStore } from '../../src/store/authStore';
import { useAddresses } from '../../src/hooks/useAddresses';
import { useSubstitutionStore } from '../../src/store/substitutionStore';
import { type UserAddress } from '../../src/types/address';

const SHIPPING_FEE = 15000;

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const { createOrder, isPlacingOrder } = useCheckout();
  const userId = useAuthStore((s) => s.user?.id);
  const { addresses, isLoading: isLoadingAddresses, isError: isAddressError, refetch: refetchAddresses } = useAddresses(
    userId
  );
  const isAllowed = useSubstitutionStore((s) => s.isAllowed);

  const defaultAddressId = useMemo(() => {
    const def = addresses.find((a) => a.isDefault)?.id;
    return def ?? addresses[0]?.id;
  }, [addresses]);

  const [addressId, setAddressId] = useState<number | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [note, setNote] = useState('');

  const total = useMemo(() => subtotal + (items.length > 0 ? SHIPPING_FEE : 0), [items.length, subtotal]);

  const handleConfirm = async () => {
    if (isPlacingOrder) return;
    if (items.length === 0) return;
    const selectedAddressId = addressId ?? defaultAddressId;
    if (!selectedAddressId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn địa chỉ giao hàng.');
      return;
    }
    try {
      const created = await createOrder({
        addressId: selectedAddressId,
        paymentMethod,
        note: note.trim() ? note.trim() : undefined,
        items: items.map((i) => ({
          variantId: i.variantId ?? i.productId,
          quantity: i.quantity,
          allowSubstitution: isAllowed(i.productId),
        })),
      });
      router.replace({ pathname: '/(customer)/order-success', params: { orderId: String(created.id) } } as never);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể tạo đơn hàng.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Thanh toán',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      <View className="flex-1 p-6">
        <Card className="p-4 border border-slate-100 mb-4">
          <Text className="text-sm font-inter-bold text-slate-800">Địa chỉ giao hàng</Text>
          {isLoadingAddresses ? (
            <View className="mt-3">
              <Text className="text-xs font-inter text-slate-500">Đang tải địa chỉ...</Text>
            </View>
          ) : isAddressError ? (
            <View className="mt-3">
              <Text className="text-xs font-inter text-slate-500">Không tải được địa chỉ.</Text>
              <Pressable onPress={() => refetchAddresses()} className="mt-2 px-3 py-2 rounded-xl bg-slate-100 self-start">
                <Text className="text-xs font-inter-bold text-slate-700">Thử lại</Text>
              </Pressable>
            </View>
          ) : addresses.length === 0 ? (
            <View className="mt-3">
              <Text className="text-xs font-inter text-slate-500">Chưa có địa chỉ. Vui lòng tạo địa chỉ trên hệ thống.</Text>
            </View>
          ) : (
            <View className="mt-3 gap-y-2">
              {addresses.map((a) => (
                <AddressOption
                  key={a.id}
                  address={a}
                  activeId={addressId ?? defaultAddressId}
                  onSelect={(id) => setAddressId(id)}
                />
              ))}
            </View>
          )}
        </Card>

        <Card className="p-4 border border-slate-100 mb-4">
          <Text className="text-sm font-inter-bold text-slate-800">Phương thức thanh toán</Text>
          <View className="mt-3 gap-y-2">
            <PaymentOption method="COD" label="COD (Thanh toán khi nhận hàng)" selected={paymentMethod} onSelect={setPaymentMethod} />
            <PaymentOption method="VNPAY" label="VNPAY (Chuyển khoản)" selected={paymentMethod} onSelect={setPaymentMethod} />
          </View>
        </Card>

        <Input
          label="Ghi chú (tuỳ chọn)"
          placeholder="Ví dụ: Giao giờ hành chính"
          value={note}
          onChangeText={setNote}
        />

        <Card className="p-4 border border-slate-100">
          <Text className="text-sm font-inter-bold text-slate-800">Tóm tắt đơn hàng</Text>

          <View className="mt-4 gap-y-2">
            <Row label="Tạm tính" value={`${subtotal.toLocaleString('vi-VN')}₫`} />
            <Row label="Phí ship" value={items.length > 0 ? `${SHIPPING_FEE.toLocaleString('vi-VN')}₫` : '0₫'} />
            <View className="h-px bg-slate-100 my-2" />
            <Row label="Tổng" value={`${total.toLocaleString('vi-VN')}₫`} strong />
          </View>
        </Card>

        <View className="flex-1" />

        <Button
          label="Xác nhận đặt hàng"
          onPress={handleConfirm}
          loading={isPlacingOrder}
          disabled={items.length === 0 || isLoadingAddresses || (!addressId && !defaultAddressId)}
          hapticVariant="success"
        />
      </View>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={strong ? 'text-sm font-inter-bold text-slate-700' : 'text-sm font-inter text-slate-500'}>{label}</Text>
      <Text className={strong ? 'text-base font-outfit-bold text-slate-900' : 'text-sm font-inter text-slate-700'}>{value}</Text>
    </View>
  );
}

function AddressOption({
  address,
  activeId,
  onSelect,
}: {
  address: UserAddress;
  activeId?: number;
  onSelect: (id: number) => void;
}) {
  const active = activeId === address.id;
  return (
    <Pressable
      onPress={() => onSelect(address.id)}
      className={`px-3 py-3 rounded-xl border ${active ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}
      hitSlop={6}
    >
      <View className="flex-row items-center justify-between">
        <Text className={`text-sm font-inter-bold ${active ? 'text-emerald-800' : 'text-slate-800'}`}>
          {address.receiverName}
        </Text>
        {address.isDefault ? (
          <View className="px-2 py-1 rounded-full bg-slate-100">
            <Text className="text-[10px] font-inter-bold text-slate-600">Mặc định</Text>
          </View>
        ) : null}
      </View>
      <Text className={`text-xs font-inter mt-1 ${active ? 'text-emerald-700' : 'text-slate-500'}`}>
        {address.streetAddress}, {address.ward}, {address.district}, {address.city}
      </Text>
    </Pressable>
  );
}

function PaymentOption({
  method,
  label,
  selected,
  onSelect,
}: {
  method: 'COD' | 'VNPAY';
  label: string;
  selected: 'COD' | 'VNPAY';
  onSelect: (m: 'COD' | 'VNPAY') => void;
}) {
  const active = selected === method;
  return (
    <Pressable
      onPress={() => onSelect(method)}
      className={`px-3 py-3 rounded-xl border ${active ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
      hitSlop={6}
    >
      <Text className={`text-sm font-inter-bold ${active ? 'text-blue-800' : 'text-slate-800'}`}>{label}</Text>
      <Text className={`text-xs font-inter mt-1 ${active ? 'text-blue-700' : 'text-slate-500'}`}>Method: {method}</Text>
    </Pressable>
  );
}
