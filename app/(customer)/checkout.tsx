import { useMemo, useState } from 'react';
import { View, Text, Alert, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import Input from '../../src/components/ui/Input';
import { useCart } from '../../src/hooks/useCart';
import { useCheckout } from '../../src/hooks/useCheckout';
import { useAuthStore } from '../../src/store/authStore';
import { useAddresses } from '../../src/hooks/useAddresses';
import { type UserAddress } from '../../src/types/address';
import { useAddressStore } from '../../src/store/addressStore';
import { orderApi } from '../../src/api/orders';
import { type Voucher } from '../../src/types/order';

const SHIPPING_FEE = 15000;

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const { createOrder, isPlacingOrder } = useCheckout();
  const userId = useAuthStore((s) => s.user?.id);
  const { addresses, isLoading: isLoadingAddresses, isError: isAddressError, refetch: refetchAddresses } = useAddresses(
    userId
  );
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);

  const defaultAddressId = useMemo(() => {
    const def = addresses.find((a) => a.isDefault)?.id;
    return def ?? addresses[0]?.id;
  }, [addresses]);

  const [addressId, setAddressId] = useState<number | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [note, setNote] = useState('');
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string>('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherApplyError, setVoucherApplyError] = useState<string | null>(null);

  const vouchersQuery = useQuery({
    queryKey: ['available-vouchers'],
    queryFn: () => orderApi.getAvailableVouchers(),
    staleTime: 60_000,
  });

  const voucherMap = useMemo(() => {
    const map = new Map<string, Voucher>();
    (vouchersQuery.data ?? []).forEach((v) => {
      map.set(v.voucherCode.trim().toUpperCase(), v);
    });
    return map;
  }, [vouchersQuery.data]);

  const selectedVoucher = useMemo(
    () => voucherMap.get(selectedVoucherCode.trim().toUpperCase()),
    [selectedVoucherCode, voucherMap]
  );

  const minOrderMessage = useMemo(() => {
    if (!selectedVoucher?.minOrderAmount) return null;
    const minOrderAmount = Number(selectedVoucher.minOrderAmount);
    if (subtotal >= minOrderAmount) return null;
    const gap = minOrderAmount - subtotal;
    return `Đơn tối thiểu ${minOrderAmount.toLocaleString('vi-VN')}₫, cần mua thêm ${gap.toLocaleString('vi-VN')}₫ để áp dụng.`;
  }, [selectedVoucher, subtotal]);

  const discountValue = useMemo(() => {
    const v = selectedVoucher;
    if (!v) return 0;
    if (v.minOrderAmount != null && subtotal < v.minOrderAmount) return 0;
    let discount = 0;
    if (String(v.discountType).toUpperCase() === 'PERCENTAGE') {
      discount = (subtotal * Number(v.discountValue || 0)) / 100;
    } else {
      discount = Number(v.discountValue || 0);
    }
    if (v.maxDiscountAmount != null) {
      discount = Math.min(discount, Number(v.maxDiscountAmount));
    }
    return Math.max(0, Math.min(discount, subtotal));
  }, [selectedVoucher, subtotal]);

  const total = useMemo(
    () => subtotal + (items.length > 0 ? SHIPPING_FEE : 0) - discountValue,
    [discountValue, items.length, subtotal]
  );

  const handleApplyVoucherCode = () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setVoucherApplyError('Vui lòng nhập mã voucher.');
      return;
    }
    const voucher = voucherMap.get(code);
    if (!voucher) {
      setVoucherApplyError('Mã voucher không tồn tại hoặc chưa khả dụng.');
      return;
    }
    setSelectedVoucherCode(voucher.voucherCode);
    setVoucherInput(voucher.voucherCode);
    setVoucherApplyError(null);
  };

  const handleConfirm = async () => {
    if (isPlacingOrder) return;
    if (items.length === 0) return;
    const preferred = selectedAddressId && addresses.some((a) => a.id === selectedAddressId) ? selectedAddressId : undefined;
    const finalAddressId = addressId ?? preferred ?? defaultAddressId;
    if (!finalAddressId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn địa chỉ giao hàng.', [{ text: 'Đóng' }]);
      return;
    }
    try {
      if (selectedVoucherCode && minOrderMessage) {
        Alert.alert('Voucher chưa hợp lệ', minOrderMessage, [{ text: 'Đóng' }]);
        return;
      }
      const created = await createOrder({
        addressId: finalAddressId,
        paymentMethod,
        note: note.trim() ? note.trim() : undefined,
        voucherCode: selectedVoucherCode && !minOrderMessage ? selectedVoucherCode : undefined,
      });
      router.replace({
        pathname: '/(customer)/order-success',
        params: {
          orderId: String(created.id),
          orderNumber: String(created.orderNumber ?? ''),
        },
      } as never);
    } catch (e) {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể tạo đơn hàng.', [{ text: 'Đóng' }]);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Thanh toán',
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 36 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card className="p-4 border border-border mb-4">
          <Text className="text-sm font-inter-bold text-text">Địa chỉ giao hàng</Text>
          {isLoadingAddresses ? (
            <View className="mt-3">
              <Text className="text-xs font-inter text-muted">Đang tải địa chỉ…</Text>
            </View>
          ) : isAddressError ? (
            <View className="mt-3">
              <Text className="text-xs font-inter text-muted">Không tải được địa chỉ.</Text>
              <Pressable onPress={() => refetchAddresses()} className="mt-2 px-3 py-2 rounded-xl bg-surface2 border border-border self-start">
                <Text className="text-xs font-inter-bold text-text">Thử lại</Text>
              </Pressable>
            </View>
          ) : addresses.length === 0 ? (
            <View className="mt-3">
              <Text className="text-xs font-inter text-muted">Chưa có địa chỉ. Vui lòng tạo địa chỉ trên hệ thống.</Text>
            </View>
          ) : (
            <View className="mt-3 gap-y-2">
              {addresses.map((a) => (
                <AddressOption
                  key={a.id}
                  address={a}
                  activeId={addressId ?? selectedAddressId ?? defaultAddressId}
                  onSelect={(id) => setAddressId(id)}
                />
              ))}
            </View>
          )}
        </Card>

        <Card className="p-4 border border-border mb-4">
          <Text className="text-sm font-inter-bold text-text">Phương thức thanh toán</Text>
          <View className="mt-3 gap-y-2">
            <PaymentOption method="COD" label="COD (Thanh toán khi nhận hàng)" selected={paymentMethod} onSelect={setPaymentMethod} />
            <PaymentOption method="VNPAY" label="VNPAY (Chuyển khoản)" selected={paymentMethod} onSelect={setPaymentMethod} />
          </View>
        </Card>

        <Card className="p-4 border border-border mb-4">
          <Text className="text-sm font-inter-bold text-text">Voucher</Text>
          <View className="mt-3 flex-row items-end gap-x-2">
            <View className="flex-1">
              <Input
                label="Nhập mã voucher"
                placeholder="Ví dụ: GIAM50K"
                value={voucherInput}
                onChangeText={(text) => {
                  setVoucherInput(text);
                  if (voucherApplyError) setVoucherApplyError(null);
                }}
              />
            </View>
            <Pressable
              onPress={handleApplyVoucherCode}
              className="px-3 py-3 rounded-xl border border-primary/20 bg-primary/5"
            >
              <Text className="text-xs font-inter-bold text-primary">Áp dụng</Text>
            </Pressable>
          </View>
          {voucherApplyError ? (
            <Text className="text-xs font-inter text-red-500 mt-2">{voucherApplyError}</Text>
          ) : null}
          {vouchersQuery.isLoading ? (
            <Text className="text-xs font-inter text-muted mt-2">Đang tải voucher…</Text>
          ) : vouchersQuery.isError ? (
            <Pressable onPress={() => vouchersQuery.refetch()} className="mt-2">
              <Text className="text-xs font-inter-bold text-text">Không tải được voucher. Nhấn để thử lại.</Text>
            </Pressable>
          ) : (vouchersQuery.data ?? []).length === 0 ? (
            <Text className="text-xs font-inter text-muted mt-2">Hiện chưa có voucher khả dụng.</Text>
          ) : (
            <View className="mt-3 gap-y-2">
              <Pressable
                onPress={() => {
                  setSelectedVoucherCode('');
                  setVoucherInput('');
                  setVoucherApplyError(null);
                }}
                className={`px-3 py-3 rounded-xl border ${selectedVoucherCode === '' ? 'bg-primary/5 border-primary/20' : 'bg-surface border-border'}`}
              >
                <Text className="text-sm font-inter-bold text-text">Không áp dụng voucher</Text>
              </Pressable>
              {(vouchersQuery.data ?? []).map((v: Voucher) => (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    setSelectedVoucherCode(v.voucherCode);
                    setVoucherInput(v.voucherCode);
                    setVoucherApplyError(null);
                  }}
                  className={`px-3 py-3 rounded-xl border ${selectedVoucherCode === v.voucherCode ? 'bg-primary/5 border-primary/20' : 'bg-surface border-border'}`}
                >
                  <Text className="text-sm font-inter-bold text-text">{v.voucherCode}</Text>
                  <Text className="text-xs font-inter text-muted mt-1">{v.description ?? 'Giảm giá đơn hàng'}</Text>
                  {selectedVoucherCode === v.voucherCode && minOrderMessage ? (
                    <Text className="text-xs font-inter text-amber-700 mt-1">{minOrderMessage}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Input
          label="Ghi chú (tuỳ chọn)"
          placeholder="Ví dụ: Giao giờ hành chính"
          value={note}
          onChangeText={setNote}
        />

        <Card className="p-4 border border-border">
          <Text className="text-sm font-inter-bold text-text">Tóm tắt đơn hàng</Text>

          <View className="mt-4 gap-y-2">
            <Row label="Tạm tính" value={`${subtotal.toLocaleString('vi-VN')}₫`} />
            <Row label="Phí ship" value={items.length > 0 ? `${SHIPPING_FEE.toLocaleString('vi-VN')}₫` : '0₫'} />
            <Row label="Giảm voucher" value={`-${discountValue.toLocaleString('vi-VN')}₫`} />
            <View className="h-px bg-border my-2" />
            <Row label="Tổng" value={`${total.toLocaleString('vi-VN')}₫`} strong />
          </View>
        </Card>

        <Button
          label="Xác nhận đặt hàng"
          onPress={handleConfirm}
          loading={isPlacingOrder}
          disabled={items.length === 0 || isLoadingAddresses || (!addressId && !defaultAddressId)}
          hapticVariant="success"
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={strong ? 'text-sm font-inter-bold text-text' : 'text-sm font-inter text-muted'}>{label}</Text>
      <Text className={strong ? 'text-base font-outfit-bold text-text' : 'text-sm font-inter text-text'}>{value}</Text>
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
      className={`px-3 py-3 rounded-xl border ${active ? 'bg-primary/5 border-primary/20' : 'bg-surface border-border'}`}
      hitSlop={6}
    >
      <View className="flex-row items-center justify-between">
        <Text className={`text-sm font-inter-bold ${active ? 'text-primary' : 'text-text'}`}>
          {address.receiverName}
        </Text>
        {address.isDefault ? (
          <View className="px-2 py-1 rounded-full bg-surface2 border border-border">
            <Text className="text-[10px] font-inter-bold text-muted">Mặc định</Text>
          </View>
        ) : null}
      </View>
      <Text className={`text-xs font-inter mt-1 ${active ? 'text-primary' : 'text-muted'}`}>
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
      className={`px-3 py-3 rounded-xl border ${active ? 'bg-primary/5 border-primary/20' : 'bg-surface border-border'}`}
      hitSlop={6}
    >
      <Text className={`text-sm font-inter-bold ${active ? 'text-primary' : 'text-text'}`}>{label}</Text>
      <Text className={`text-xs font-inter mt-1 ${active ? 'text-primary' : 'text-muted'}`}>Method: {method}</Text>
    </Pressable>
  );
}
