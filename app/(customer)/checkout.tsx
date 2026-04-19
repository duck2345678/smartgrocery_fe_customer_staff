import { useMemo, useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Input from '../../src/components/ui/Input';
import { useCart } from '../../src/hooks/useCart';
import { useCheckout } from '../../src/hooks/useCheckout';

const SHIPPING_FEE = 15000;

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const { createOrder, isPlacingOrder } = useCheckout();
  const [addressId, setAddressId] = useState<number>(101);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [note, setNote] = useState('');

  const total = useMemo(() => subtotal + (items.length > 0 ? SHIPPING_FEE : 0), [items.length, subtotal]);

  const handleConfirm = async () => {
    if (isPlacingOrder) return;
    if (items.length === 0) return;
    try {
      const created = await createOrder({
        addressId,
        paymentMethod,
        note: note.trim() ? note.trim() : undefined,
        items,
        shippingFee: SHIPPING_FEE,
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
          <View className="mt-3 gap-y-2">
            <AddressOption id={101} label="Nhà (Q.1, TP.HCM)" selectedId={addressId} onSelect={setAddressId} />
            <AddressOption id={102} label="Công ty (Q.3, TP.HCM)" selectedId={addressId} onSelect={setAddressId} />
          </View>
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
          disabled={items.length === 0}
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
  id,
  label,
  selectedId,
  onSelect,
}: {
  id: number;
  label: string;
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  const active = selectedId === id;
  return (
    <Pressable
      onPress={() => onSelect(id)}
      className={`px-3 py-3 rounded-xl border ${active ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}
      hitSlop={6}
    >
      <Text className={`text-sm font-inter-bold ${active ? 'text-emerald-800' : 'text-slate-800'}`}>{label}</Text>
      <Text className={`text-xs font-inter mt-1 ${active ? 'text-emerald-700' : 'text-slate-500'}`}>ID: {id}</Text>
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
