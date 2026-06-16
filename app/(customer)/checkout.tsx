import { useMemo, useState } from 'react';
import { View, Text, Alert, Pressable, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
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
import { ChevronDown, ChevronUp, Ticket } from 'lucide-react-native';

const SHIPPING_FEE = 15000;

export default function CheckoutScreen() {
  const router = useRouter();
  const { selectedIds } = useLocalSearchParams<{ selectedIds?: string }>();
  const selectedIdSet = useMemo(() => {
    if (!selectedIds) return null;
    return new Set(selectedIds.split(',').map(Number));
  }, [selectedIds]);

  const { items: allItems } = useCart();
  const items = useMemo(() => {
    if (!selectedIdSet) return allItems;
    return allItems.filter(item => item.cartItemId != null && selectedIdSet.has(item.cartItemId));
  }, [allItems, selectedIdSet]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

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

  const handlePaymentMethodSelect = (method: 'COD' | 'VNPAY') => {
    if (method !== 'COD') {
      Alert.alert(
        'Thông báo',
        'Tính năng thanh toán online đang được phát triển. Vui lòng sử dụng phương thức thanh toán khi nhận hàng (COD)!'
      );
      return;
    }
    setPaymentMethod(method);
  };
  const [note, setNote] = useState('');
  const [selectedVoucherCode, setSelectedVoucherCode] = useState<string>('');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherApplyError, setVoucherApplyError] = useState<string | null>(null);
  const [showVoucherList, setShowVoucherList] = useState(false);
  const [voucherStatusFilter, setVoucherStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  const claimedVouchersQuery = useQuery({
    queryKey: ['claimed-vouchers'],
    queryFn: () => orderApi.getClaimedVouchers(),
    staleTime: 60_000,
  });

  const claimableVouchersQuery = useQuery({
    queryKey: ['claimable-vouchers'],
    queryFn: () => orderApi.getClaimableVouchers(),
    staleTime: 60_000,
  });

  const voucherMap = useMemo(() => {
    const map = new Map<string, Voucher>();
    (claimedVouchersQuery.data ?? []).forEach((v) => {
      map.set(v.voucherCode.trim().toUpperCase(), v);
    });
    (claimableVouchersQuery.data ?? []).forEach((v) => {
      map.set(v.voucherCode.trim().toUpperCase(), v);
    });
    return map;
  }, [claimableVouchersQuery.data, claimedVouchersQuery.data]);

  const claimedVoucherIds = useMemo(() => {
    return new Set((claimedVouchersQuery.data ?? []).map((v) => v.id));
  }, [claimedVouchersQuery.data]);

  const voucherCards = useMemo(() => {
    const merged = [...(claimedVouchersQuery.data ?? []), ...(claimableVouchersQuery.data ?? [])];
    const seen = new Set<number>();
    return merged.filter((voucher) => {
      if (seen.has(voucher.id)) return false;
      seen.add(voucher.id);
      return true;
    });
  }, [claimableVouchersQuery.data, claimedVouchersQuery.data]);

  const filteredVoucherCards = useMemo(() => {
    return voucherCards.filter((voucher) => {
      const isClaimed = claimedVoucherIds.has(voucher.id) || voucher.claimed === true;
      if (voucherStatusFilter === 'claimed') return isClaimed;
      if (voucherStatusFilter === 'unclaimed') return !isClaimed;
      return true;
    });
  }, [claimedVoucherIds, voucherCards, voucherStatusFilter]);

  const selectedVoucher = useMemo(
    () => voucherMap.get(selectedVoucherCode.trim().toUpperCase()),
    [selectedVoucherCode, voucherMap]
  );

  const selectedVoucherClaimStatus = useMemo(() => {
    if (!selectedVoucher) return null;
    const isClaimed = claimedVoucherIds.has(selectedVoucher.id) || selectedVoucher.claimed === true;
    return isClaimed ? 'Đã lưu' : 'Chưa lưu';
  }, [claimedVoucherIds, selectedVoucher]);

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
    if (!claimedVoucherIds.has(voucher.id)) {
      setVoucherApplyError('Mã này chưa được lưu. Vui lòng nhấn Lưu/Nhận voucher trước.');
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
        items: items.map(item => ({ variantId: item.variantId!, quantity: item.quantity })),
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
            <PaymentOption method="COD" label="COD (Thanh toán khi nhận hàng)" selected={paymentMethod} onSelect={handlePaymentMethodSelect} />
            <PaymentOption method="VNPAY" label="VNPAY (Chuyển khoản)" selected={paymentMethod} onSelect={handlePaymentMethodSelect} />
          </View>
        </Card>

        <Card className="p-4 border border-border mb-4">
          <Text className="text-sm font-inter-bold text-text mb-3">Sản phẩm thanh toán</Text>
          <View className="gap-y-3">
            {items.map((item) => (
              <View key={item.cartItemId ?? item.productId} className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <View className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 mr-3">
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-inter-semibold text-text" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-xs font-inter text-muted mt-0.5">
                      Số lượng: {item.quantity} • {item.unit}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm font-outfit-bold text-text">
                  {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card className="p-4 border border-border mb-4">
          <Pressable
            onPress={() => setShowVoucherList(true)}
            className="flex-row items-center justify-between"
            hitSlop={8}
          >
            <View className="flex-row items-center">
              <Ticket size={18} color="#16A34A" className="mr-2" />
              <Text className="text-sm font-inter-bold text-text">Voucher & Khuyến mãi</Text>
              {selectedVoucherCode ? (
                <View className="ml-3 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <Text className="text-[10px] font-inter-bold text-emerald-700">{selectedVoucherCode}</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center">
              {!selectedVoucherCode && (
                <Text className="text-xs font-inter text-muted mr-1">Chọn hoặc nhập mã</Text>
              )}
              <ChevronDown size={18} color="#94A3B8" />
            </View>
          </Pressable>
        </Card>

        <Card className="p-4 border border-border">
          <Text className="text-sm font-inter-bold text-text">Tóm tắt đơn hàng</Text>

          <View className="mt-4 gap-y-2">
            <Row label="Tạm tính" value={`${subtotal.toLocaleString('vi-VN')}₫`} />
            <Row label="Phí ship" value={items.length > 0 ? `${SHIPPING_FEE.toLocaleString('vi-VN')}₫` : '0₫'} />
            <Row label="Giảm voucher" value={`-${discountValue.toLocaleString('vi-VN')}₫`} />
            <View className="h-px bg-border my-2" />
            <Row label="Tổng" value={`${total.toLocaleString('vi-VN')}₫`} strong />
            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-sm font-inter text-muted">Trạng thái voucher</Text>
              {selectedVoucher ? (
                <View className={`px-2.5 py-1 rounded-full border ${selectedVoucherClaimStatus === 'Đã lưu' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                  <Text className={`text-[10px] font-outfit-bold uppercase ${selectedVoucherClaimStatus === 'Đã lưu' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {selectedVoucherClaimStatus}
                  </Text>
                </View>
              ) : (
                <View className="px-2.5 py-1 rounded-full border bg-slate-50 border-slate-200">
                  <Text className="text-[10px] font-outfit-bold uppercase text-slate-500">Chưa chọn voucher</Text>
                </View>
              )}
            </View>
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

      <Modal
        visible={showVoucherList}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoucherList(false)}
      >
        <Pressable 
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowVoucherList(false)}
        >
          <Pressable 
            className="bg-white rounded-t-[32px] p-6"
            style={{ maxHeight: '80%' }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-outfit-bold text-slate-900">Chọn Voucher</Text>
              <Pressable onPress={() => setShowVoucherList(false)} className="p-1">
                <Text className="text-sm font-inter text-slate-400">Đóng</Text>
              </Pressable>
            </View>

            {/* Voucher Code Input */}
            <View className="flex-row items-end gap-x-2 mb-4">
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
                className="px-4 py-3 rounded-xl border border-primary/20 bg-primary/5"
              >
                <Text className="text-xs font-inter-bold text-primary">Áp dụng</Text>
              </Pressable>
            </View>

            {voucherApplyError ? (
              <Text className="text-xs font-inter text-red-500 mb-3">{voucherApplyError}</Text>
            ) : null}

            {/* Voucher Filters */}
            <View className="flex-row bg-slate-50 p-1.5 rounded-2xl mb-4" style={{ gap: 6 }}>
              <Pressable
                onPress={() => setVoucherStatusFilter('all')}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${voucherStatusFilter === 'all' ? 'bg-white border border-slate-200' : 'bg-transparent'}`}
              >
                <Text className={`text-xs font-outfit-bold ${voucherStatusFilter === 'all' ? 'text-slate-900' : 'text-slate-500'}`}>Tất cả</Text>
              </Pressable>
              <Pressable
                onPress={() => setVoucherStatusFilter('claimed')}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${voucherStatusFilter === 'claimed' ? 'bg-emerald-50 border border-emerald-200' : 'bg-transparent'}`}
              >
                <Text className={`text-xs font-outfit-bold ${voucherStatusFilter === 'claimed' ? 'text-emerald-700' : 'text-slate-500'}`}>Đã lưu</Text>
              </Pressable>
              <Pressable
                onPress={() => setVoucherStatusFilter('unclaimed')}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${voucherStatusFilter === 'unclaimed' ? 'bg-amber-50 border border-amber-200' : 'bg-transparent'}`}
              >
                <Text className={`text-xs font-outfit-bold ${voucherStatusFilter === 'unclaimed' ? 'text-amber-700' : 'text-slate-500'}`}>Chưa lưu</Text>
              </Pressable>
            </View>

            {/* Voucher List */}
            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {claimedVouchersQuery.isLoading || claimableVouchersQuery.isLoading ? (
                <Text className="text-xs font-inter text-muted py-4 text-center">Đang tải voucher…</Text>
              ) : claimedVouchersQuery.isError || claimableVouchersQuery.isError ? (
                <Text className="text-xs font-inter text-red-500 py-4 text-center">Không tải được danh sách voucher.</Text>
              ) : filteredVoucherCards.length === 0 ? (
                <Text className="text-xs font-inter text-muted py-4 text-center">Hiện chưa có voucher khả dụng.</Text>
              ) : (
                <View className="gap-y-3">
                  <Pressable
                    onPress={() => {
                      setSelectedVoucherCode('');
                      setVoucherInput('');
                      setVoucherApplyError(null);
                      setShowVoucherList(false);
                    }}
                    className={`px-3 py-3 rounded-xl border ${selectedVoucherCode === '' ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-200'}`}
                  >
                    <Text className="text-sm font-inter-bold text-slate-800">Không áp dụng voucher</Text>
                  </Pressable>
                  {filteredVoucherCards.map((v: Voucher) => {
                    const isClaimed = claimedVoucherIds.has(v.id) || v.claimed === true;
                    const isSelected = selectedVoucherCode === v.voucherCode;
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => {
                          if (!isClaimed) {
                            setVoucherApplyError('Voucher này chưa được lưu. Vui lòng nhấn Lưu/Nhận voucher trước.');
                            return;
                          }
                          if (isSelected) {
                            setSelectedVoucherCode('');
                            setVoucherInput('');
                          } else {
                            setSelectedVoucherCode(v.voucherCode);
                            setVoucherInput(v.voucherCode);
                          }
                          setVoucherApplyError(null);
                          setShowVoucherList(false);
                        }}
                        className={`px-3 py-3 rounded-xl border ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-200'} ${!isClaimed ? 'opacity-70' : ''}`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-inter-bold text-slate-800">{v.voucherCode}</Text>
                          <View className={`px-2 py-0.5 rounded-full border ${isClaimed ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                            <Text className={`text-[9px] font-outfit-bold uppercase ${isClaimed ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {isClaimed ? 'Đã lưu' : 'Chưa lưu'}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs font-inter text-slate-500 mt-1">{v.description ?? 'Giảm giá đơn hàng'}</Text>
                        {isSelected && minOrderMessage ? (
                          <Text className="text-xs font-inter text-amber-700 mt-1">{minOrderMessage}</Text>
                        ) : null}
                        {!isClaimed ? (
                          <Text className="text-xs font-inter text-amber-700 mt-1">Cần lưu voucher trước khi sử dụng.</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
        {[
          address.streetAddress,
          address.ward,
          address.district && address.district.toLowerCase() !== address.city?.toLowerCase() ? address.district : null,
          address.city
        ].filter(Boolean).join(', ')}
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
