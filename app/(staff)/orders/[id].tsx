import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ShoppingBag, User, Phone, MapPin, CreditCard, Calendar } from 'lucide-react-native';
import { useCameraPermissions } from 'expo-camera';
import Card from '../../../src/components/ui/Card';
import PackingPhotoCapture from '../../../src/components/ui/PackingPhotoCapture';
import { useStaffHomeStore } from '../../../src/store/staffHomeStore';
import { staffOrdersApi, type StaffPickItem } from '../../../src/api/staffOrders';
import { fileApi } from '../../../src/api/file';

/* ─── 3-step stepper ─────────────────────────────────────── */
const STEPS = ['Soạn & Đóng gói', 'Giao hàng', 'Hoàn tất'] as const;

const getCurrentStep = (status?: string): number => {
  switch (status) {
    case 'ASSIGNED':
    case 'PICKING':
    case 'PICKED':
      return 0;
    case 'READY_TO_SHIP':
      return 1;
    case 'DELIVERING':
      return 2;
    case 'DELIVERED':
      return 2;
    default:
      return 0;
  }
};

const getActionLabel = (step: number, status: string): string => {
  if (status === 'READY_TO_SHIP') return 'Chụp ảnh giao hàng';
  if (status === 'DELIVERING') return 'Xác nhận hoàn tất';
  switch (step) {
    case 0:
      return 'Xác nhận đóng gói';
    case 1:
      return 'Chụp ảnh giao hàng';
    case 2:
      return 'Xác nhận hoàn tất';
    default:
      return 'Tiếp tục';
  }
};

const formatMoney = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('vi-VN')} ₫`;
};

function formatDateFull(isoStr?: string | null) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getPaymentMethodLabel(method?: string | null) {
  if (method === 'COD') return 'Thanh toán khi nhận hàng (COD)';
  if (method === 'VNPAY') return 'Thanh toán qua VNPAY';
  return method || 'Chưa xác định';
}

/* ─── Main screen ─────────────────────────────────────────── */
export default function StaffOrderDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const [checkedIds, setCheckedIds] = useState<Record<number, boolean>>({});
  const [packingCameraVisible, setPackingCameraVisible] = useState(false);
  const [deliveryCameraVisible, setDeliveryCameraVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  /* Pre-request camera permission so it's ready when needed */
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  const orderId = useMemo(() => {
    const raw = params.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [params.id]);

  const pickListQuery = useQuery({
    queryKey: ['staff-order-pick-list', orderId],
    queryFn: () => staffOrdersApi.getPickList(orderId),
    enabled: orderId > 0,
  });

  const order = pickListQuery.data;
  const status = order?.status ?? '';
  const currentStep = getCurrentStep(status);
  const isPacked = currentStep >= 1;
  const leaseExpiresAt = order?.leaseExpiresAt ?? null;
  const expiryAlertShown = useRef(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  
  const canPack = status === 'ASSIGNED' || status === 'PICKING' || status === 'PICKED';

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const leaseRemainingMs = useMemo(() => {
    if (!leaseExpiresAt) return null;
    const expires = new Date(leaseExpiresAt).getTime();
    if (!Number.isFinite(expires)) return null;
    return expires - nowMs;
  }, [leaseExpiresAt, nowMs]);

  const leaseExpired = leaseRemainingMs != null && leaseRemainingMs <= 0;
  const leaseRemainingLabel = useMemo(() => {
    if (leaseRemainingMs == null) return null;
    const safeMs = Math.max(0, leaseRemainingMs);
    const totalSeconds = Math.floor(safeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [leaseRemainingMs]);

  useEffect(() => {
    if (!leaseExpired || expiryAlertShown.current) return;
    expiryAlertShown.current = true;
    Alert.alert(
      'Đơn hàng đã hết hạn',
      'Đơn hàng đã quá hạn xử lý và được chuyển lại vào hàng chờ chung.',
      [{ text: 'Đã hiểu' }],
    );
  }, [leaseExpired]);

  const items = useMemo(() => {
    const raw = order as unknown as Record<string, unknown> | undefined;
    const candidates =
      (Array.isArray(order?.items) && order?.items) ||
      (raw && Array.isArray(raw.orderItems) ? raw.orderItems : null) ||
      (raw && Array.isArray(raw.details) ? raw.details : null) ||
      [];

    return candidates.map((it: any) => ({
      orderItemId: Number(it.orderItemId ?? it.id ?? 0),
      variantId: Number(it.variantId ?? 0),
      sku: String(it.sku ?? ''),
      barcode: typeof it.barcode === 'string' ? it.barcode : null,
      productName:
        typeof it.productName === 'string'
          ? it.productName
          : typeof it.name === 'string'
            ? it.name
            : typeof it.product?.name === 'string'
              ? it.product.name
              : 'Sản phẩm',
      variantName: typeof it.variantName === 'string' ? it.variantName : null,
      aisleLocation: typeof it.aisleLocation === 'string' ? it.aisleLocation : null,
      orderedQuantity: Number(it.orderedQuantity ?? it.quantity ?? 0),
      pickedQuantity: it.pickedQuantity != null ? Number(it.pickedQuantity) : null,
      unitPrice: Number(it.unitPrice ?? it.price ?? 0),
      imageUrl: typeof it.imageUrl === 'string' ? it.imageUrl : typeof it.productImageUrl === 'string' ? it.productImageUrl : typeof it.product?.image === 'string' ? it.product.image : null,
      stockQuantity: it.stockQuantity != null ? Number(it.stockQuantity) : null,
    })) as StaffPickItem[];
  }, [order]);
  
  // Sync local checkedIds with server pickedQuantity if available
  useEffect(() => {
    if (items.length > 0) {
      const initial: Record<number, boolean> = {};
      items.forEach(it => {
        if ((it.pickedQuantity ?? 0) >= it.orderedQuantity) {
          initial[it.orderItemId] = true;
        }
      });
      setCheckedIds(prev => ({ ...initial, ...prev }));
    }
  }, [items]);

  const allPicked =
    items.length > 0 &&
    items.every((it) => checkedIds[it.orderItemId] || it.orderedQuantity <= 0);

  const completePickingMutation = useMutation({
    mutationFn: (payload: any) => staffOrdersApi.completePicking(orderId, payload),
    onSuccess: async () => {
      const selectedDateIso = useStaffHomeStore.getState().selectedDateIso;
      await queryClient.invalidateQueries({ queryKey: ['staff-performance-daily', selectedDateIso] });
      await queryClient.invalidateQueries({ queryKey: ['staff-performance-summary', selectedDateIso] });
      await queryClient.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      await queryClient.invalidateQueries({ queryKey: ['staff-order-queue'] });
      await pickListQuery.refetch();
    },
  });

  const packMutation = useMutation({
    mutationFn: (photoUrl: string) => staffOrdersApi.pack(orderId, photoUrl),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-order-pick-list', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-order-pick-list'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-orders-active'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-order-my-active'] });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (photoUrl: string) => staffOrdersApi.deliver(orderId, photoUrl),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff-order-pick-list', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['staff-order-pick-list'] });
      void queryClient.invalidateQueries({ queryKey: ['staff-order-my-active'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => staffOrdersApi.complete(orderId),
    onSuccess: async () => {
      const selectedDateIso = useStaffHomeStore.getState().selectedDateIso;
      await queryClient.invalidateQueries({ queryKey: ['staff-performance-daily', selectedDateIso] });
      await queryClient.invalidateQueries({ queryKey: ['staff-performance-summary', selectedDateIso] });
      await queryClient.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      await queryClient.invalidateQueries({ queryKey: ['staff-order-queue'] });
      await pickListQuery.refetch();
      router.push('/(staff)/orders/complete-success' as never);
    },
  });

  const togglePicked = (item: StaffPickItem) => {
    setCheckedIds((prev) => ({
      ...prev,
      [item.orderItemId]: !prev[item.orderItemId],
    }));
  };

  /* ── Action: validate → open packing camera or go to next step ── */
  const onAction = async () => {
    if (leaseExpired) {
      Alert.alert('Đơn hàng đã hết hạn', 'Đơn hàng đã quá hạn xử lý và được chuyển lại vào hàng chờ chung.');
      return;
    }

    if (canPack) {
      // Step 0: Đóng gói → open camera to take packing photo
      if (!allPicked) {
        Alert.alert(
          'Chưa hoàn tất',
          'Vui lòng tích hết các mặt hàng đã lấy đủ trước khi đóng gói.',
        );
        return;
      }
      // Ensure camera permission
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert('Thiếu quyền', 'Vui lòng cấp quyền camera để chụp ảnh xác nhận đóng gói.');
          return;
        }
      }
      setPackingCameraVisible(true);
      return;
    }
    
    // Step 1: READY_TO_SHIP -> Open delivery camera first, then call deliver
    if (status === 'READY_TO_SHIP') {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert('Thiếu quyền', 'Vui lòng cấp quyền camera để chụp ảnh xác nhận giao hàng.');
          return;
        }
      }
      setDeliveryCameraVisible(true);
      return;
    }
    
    // Step 2: DELIVERING -> Confirm complete (no photo needed, already captured)
    if (status === 'DELIVERING') {
      try {
        await completeMutation.mutateAsync();
      } catch (err: any) {
        Alert.alert('Lỗi', err.message || 'Không thể hoàn tất giao hàng');
      }
      return;
    }
    
    // Final state
    if (status === 'DELIVERED') {
      router.push('/(staff)/orders/complete-success' as never);
      return;
    }
  };

  /* ── After packing photo captured ── */
  const handlePackingPhotoCaptured = async (uri: string) => {
    setPackingCameraVisible(false);
    try {
      // 1. Complete picking (skip if already in PICKED state, e.g. retry)
      if (status !== 'PICKED') {
        const payload = {
          pickedItems: items.map(it => ({
            originalOrderItemId: it.orderItemId,
            actualQuantity: checkedIds[it.orderItemId] ? it.orderedQuantity : 0,
            isSubstituted: false
          }))
        };
        await completePickingMutation.mutateAsync(payload);
      }
      
      // 2. Pack (READY_TO_SHIP)
      const { url: serverUrl } = await fileApi.upload(uri);
      await packMutation.mutateAsync(serverUrl);
    } catch (err: any) {
      // Refetch to get latest status in case completePicking succeeded but pack failed
      void pickListQuery.refetch();
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận đóng gói');
    }
  };

  /* ── After delivery photo captured ── */
  const handleDeliveryPhotoCaptured = async (uri: string) => {
    setDeliveryCameraVisible(false);
    try {
      const { url: serverUrl } = await fileApi.upload(uri);
      await deliverMutation.mutateAsync(serverUrl);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận giao hàng');
    }
  };

  const stepLabel = `Bước ${currentStep + 1}: ${STEPS[currentStep]}`;
  const actionLabel = getActionLabel(currentStep, status);
  const leaseTimerColor = leaseRemainingMs == null
    ? '#64748B'
    : leaseRemainingMs <= 5 * 60 * 1000
      ? '#EF4444'
      : leaseRemainingMs <= 15 * 60 * 1000
        ? '#F59E0B'
        : '#16A34A';

  /* ────────────────────── render ────────────────────── */
  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF7]" edges={['left', 'right']}>
      <Stack.Screen options={{ title: 'Chi tiết đơn hàng', headerShown: true }} />

      {/* ── Loading ── */}
      {pickListQuery.isLoading ? (
        <View className="flex-1 items-center justify-center bg-[#F3FBF7]">
          <View className="items-center justify-center w-16 h-16 rounded-full bg-white border border-[#DCEFE4] mb-3">
            <ActivityIndicator color="#16A34A" />
          </View>
          <Text className="text-[13px] font-inter text-slate-500 mt-1">
            Đang tải chi tiết đơn…
          </Text>
        </View>

      /* ── Error ── */
      ) : pickListQuery.isError || !order ? (
        <View className="p-4">
          <Card className="p-4">
            <Text className="font-inter-bold text-text">Không tải được chi tiết đơn.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Vui lòng thử lại.</Text>
            <Pressable
              onPress={() => void pickListQuery.refetch()}
              className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="mt-2 px-4 py-3 rounded-2xl bg-surface border border-border items-center"
            >
              <Text className="font-outfit-bold text-text">Quay lại</Text>
            </Pressable>
          </Card>
        </View>

      /* ── Main content (Image 1) ── */
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingTop: 0,
              paddingBottom: 220,
              gap: 14,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* ───── Header card (green) ───── */}
            <View className="rounded-[32px] p-6 bg-[#16A34A] overflow-hidden">
              <View className="absolute right-[-10] top-[-10] w-32 h-32 rounded-full bg-white/10" />
              <View className="absolute right-8 bottom-[-24] w-20 h-20 rounded-full bg-white/10" />

              <View className="flex-row items-start justify-between">
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text className="text-[13px] font-inter text-white/85">Mã đơn</Text>
                  <Text
                    className="mt-1 text-[26px] font-outfit-bold text-white"
                    numberOfLines={1}
                  >
                    #{order.orderNumber || order.orderId}
                  </Text>
                </View>
                <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center">
                  <ShoppingBag size={26} color="#FFFFFF" />
                </View>
              </View>

              {leaseRemainingLabel ? (
                <View className="mt-4 rounded-[22px] bg-white/15 px-4 py-3">
                  <Text className="text-[12px] font-inter text-white/80">Thời gian giữ chỗ</Text>
                  <Text className="mt-1 text-[24px] font-outfit-bold" style={{ color: leaseTimerColor }}>
                    {leaseExpired ? '00:00' : leaseRemainingLabel}
                  </Text>
                  <Text className="text-[11px] font-inter text-white/80">
                    {leaseExpired ? 'Đơn đã quá hạn và sẽ được trả về hàng chờ.' : 'Đơn sẽ tự động thu hồi khi hết thời gian.'}
                  </Text>
                </View>
              ) : null}

              {/* 3-step stepper */}
              <View
                className="mt-5 bg-white rounded-[24px] px-5 py-5"
                style={{ elevation: 2 }}
              >
                <View className="flex-row items-center justify-between">
                  {STEPS.map((title, index, arr) => {
                    const done = index < currentStep;
                    const active = index === currentStep;
                    const isLast = index === arr.length - 1;
                    return (
                      <View key={title} style={{ flex: 1, alignItems: 'center' }}>
                        <View className="flex-row items-center w-full">
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{
                              backgroundColor: done || active ? '#16A34A' : '#D1D5DB',
                            }}
                          >
                            <Text className="text-white text-[14px] font-inter-bold">
                              {done ? '✓' : index + 1}
                            </Text>
                          </View>
                          {!isLast && (
                            <View
                              style={{
                                flex: 1,
                                height: 3,
                                borderRadius: 999,
                                marginHorizontal: 6,
                                backgroundColor: done ? '#16A34A' : '#E5E7EB',
                              }}
                            />
                          )}
                        </View>
                        <Text
                          className="mt-2 text-[12px] font-inter-bold text-center"
                          style={{
                            color: active || done ? '#111827' : '#94A3B8',
                          }}
                          numberOfLines={2}
                        >
                          {title}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* ───── Thông tin chi tiết (Người đặt, Địa chỉ, Thanh toán) ───── */}
            <Card className="p-5 rounded-[30px] border border-border">
              <View className="flex-row items-center mb-4">
                <View className="w-9 h-9 rounded-full bg-[#EDF7F1] items-center justify-center mr-3">
                  <User size={18} color="#16A34A" />
                </View>
                <Text className="font-inter-bold text-text text-[17px]">Thông tin chi tiết</Text>
              </View>
              
              <View className="bg-[#F8FAF9] rounded-2xl px-4 py-4" style={{ gap: 14 }}>
                <View>
                  <View className="flex-row justify-between items-center">
                    <Text className="font-inter text-muted text-[13px]">Khách hàng</Text>
                    <Text className="font-inter-bold text-text text-[14px]">{order.customerName || '—'}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="font-inter text-muted text-[13px]">Số điện thoại</Text>
                    <Text className="font-inter-bold text-text text-[14px]">{order.customerPhone || '—'}</Text>
                  </View>
                </View>

                <View className="h-px bg-slate-200" />

                <View>
                  <Text className="font-inter text-muted text-[11px] mb-1">Địa chỉ nhận hàng</Text>
                  <Text className="font-inter text-text text-[13px] leading-5">
                    {order.addressLine || '—'}
                  </Text>
                </View>

                <View className="h-px bg-slate-200" />

                <View>
                  <Text className="font-inter text-muted text-[11px] mb-1">Phương thức thanh toán</Text>
                  <Text className="font-inter-bold text-text text-[13px]">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </Text>
                </View>

                <View className="flex-row justify-between border-t border-dashed border-slate-300 pt-3 mt-1">
                  <View>
                    <Text className="font-inter text-muted text-[10px] uppercase tracking-tighter">Ngày đặt hàng</Text>
                    <Text className="font-inter text-slate-500 text-[11px] mt-0.5">{formatDateFull(order.orderDate)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text className="font-inter text-muted text-[10px] uppercase tracking-tighter">Hạn xử lý</Text>
                    <Text className="font-inter text-slate-500 text-[11px] mt-0.5">{formatDateFull(order.leaseExpiresAt)}</Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* ───── Product list card ───── */}
            <View className="bg-white rounded-[32px] p-6 shadow-sm border border-[#E5E7EB]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="font-outfit-bold text-[#111827] text-[20px]">
                  Danh sách mặt hàng
                </Text>
                <View className="px-3 py-1.5 rounded-full bg-[#F0FDF4]">
                  <Text className="text-[12px] font-inter-bold text-[#16A34A]">
                    {items.length} món
                  </Text>
                </View>
              </View>

              <View style={{ gap: 20 }}>
                {items.map((it) => {
                  const checked = !!checkedIds[it.orderItemId];
                  const lineTotal = (it.unitPrice || 0) * (it.orderedQuantity || 0);
                  
                  return (
                    <Pressable
                      key={it.orderItemId}
                      onPress={() => !isPacked && togglePicked(it)}
                      className="flex-row items-center"
                    >
                      {/* Product Image */}
                      <View className="w-16 h-16 rounded-[18px] bg-[#F3F4F6] overflow-hidden mr-4">
                        {it.imageUrl ? (
                          <Image
                            source={{ uri: it.imageUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <ShoppingBag size={24} color="#94A3B8" />
                          </View>
                        )}
                      </View>

                      {/* Product Info */}
                      <View className="flex-1 justify-center">
                        <Text className="font-inter-bold text-[#111827] text-[16px] mb-1" numberOfLines={1}>
                          {it.productName}
                        </Text>
                        <Text className="text-[13px] font-inter text-[#64748B]">
                          SL: {it.orderedQuantity} × {formatMoney(it.unitPrice)}
                        </Text>
                      </View>

                      {/* Price & Checkmark */}
                      <View className="items-end justify-between py-1">
                        <Text className="font-outfit-bold text-[#16A34A] text-[17px]">
                          {formatMoney(lineTotal)}
                        </Text>
                        
                        <View 
                          className="mt-2 w-7 h-7 rounded-full items-center justify-center"
                          style={{
                            backgroundColor: checked ? '#16A34A' : '#E5E7EB',
                          }}
                        >
                          <CheckCircle2 size={16} color="#FFFFFF" />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ───── Packing photo display card (Step 2) ───── */}
            {order.packingPhotoUrl && (
              <View 
                className="rounded-[30px] p-5 bg-[#EDF7F1] border border-[#D1EAD9] overflow-hidden"
              >
                {/* Decorative elements */}
                <View className="absolute right-4 top-4 opacity-40">
                  <Text className="text-[24px]">✨</Text>
                </View>
                <View className="absolute left-[-10] bottom-4 opacity-20">
                  <Text className="text-[40px]">🍃</Text>
                </View>
                <View className="absolute right-4 bottom-4 opacity-40">
                  <Text className="text-[20px]">✨</Text>
                </View>
 
                <Text className="font-inter-bold text-[#111827] text-[18px] mb-4">
                  Ảnh đóng gói
                </Text>
                <View className="w-full aspect-[4/3] rounded-[24px] bg-white overflow-hidden shadow-sm">
                  <Image 
                    source={{ uri: order.packingPhotoUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
 
            {/* ───── Delivery photo display card (Step 3) ───── */}
            {order.deliveryPhotoUrl && (
              <View 
                className="rounded-[30px] p-5 bg-[#EDF7F1] border border-[#D1EAD9] overflow-hidden"
              >
                {/* Decorative elements */}
                <View className="absolute right-4 top-4 opacity-40">
                  <Text className="text-[24px]">📦</Text>
                </View>
                <View className="absolute left-[-10] bottom-4 opacity-20">
                  <Text className="text-[40px]">🏠</Text>
                </View>
                
                <Text className="font-inter-bold text-[#111827] text-[18px] mb-4">
                  Ảnh giao hàng
                </Text>
                <View className="w-full aspect-[4/3] rounded-[24px] bg-white overflow-hidden shadow-sm">
                  <Image 
                    source={{ uri: order.deliveryPhotoUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* ───── Fixed bottom action bar ───── */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 pb-8 pt-5"
            style={{ elevation: 10 }}
          >
            <Text className="font-outfit-bold text-text text-[18px] mb-4">
              {stepLabel}
            </Text>
            {leaseRemainingLabel ? (
              <Text className="text-[12px] font-inter mb-3" style={{ color: leaseTimerColor }}>
                {leaseExpired ? 'Đơn đã hết hạn.' : `Còn ${leaseRemainingLabel} để xử lý đơn này.`}
              </Text>
            ) : null}
            <Pressable
              onPress={onAction}
              disabled={leaseExpired}
              className="w-full py-5 rounded-[22px] items-center justify-center"
              style={{ backgroundColor: '#16A34A', opacity: leaseExpired ? 0.45 : 1 }}
            >
              <Text className="font-outfit-bold text-white text-[18px]">
                {actionLabel}
              </Text>
            </Pressable>
          </View>

          {/* ───── Packing photo camera (only for step 0) ───── */}
          <PackingPhotoCapture
            visible={packingCameraVisible}
            title="Chụp ảnh xác nhận đóng gói"
            hintText="Chụp rõ đơn hàng đã đóng gói"
            primaryColor="#16A34A"
            onClose={() => setPackingCameraVisible(false)}
            onCaptured={handlePackingPhotoCaptured}
          />

          {/* ───── Delivery photo camera (Step 2) ───── */}
          <PackingPhotoCapture
            visible={deliveryCameraVisible}
            title="Chụp ảnh xác nhận giao hàng"
            hintText="Chụp rõ đơn hàng tại điểm giao"
            primaryColor="#16A34A"
            reviewTitle="Kiểm tra ảnh giao hàng"
            reviewHint="mã đơn và vị trí giao hàng"
            confirmLabel="Xác nhận hoàn tất"
            onClose={() => setDeliveryCameraVisible(false)}
            onCaptured={handleDeliveryPhotoCaptured}
          />

        </>
      )}
    </SafeAreaView>
  );
}
