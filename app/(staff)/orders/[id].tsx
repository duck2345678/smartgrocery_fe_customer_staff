import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, User, Camera, Truck, Check, ShieldAlert } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Card from '../../../src/components/ui/Card';
import { staffOrdersApi } from '../../../src/api/staffOrders';
import { getTodayStatus } from '../../../src/api/staffAttendance';
import {
  buildCompletePickingPayload,
  buildInitialSession,
  clampInt,
  type StaffPickItem,
  type StaffPickSession,
} from '../../../src/utils/staffPickingUtils';

/* ─── 3-step stepper ─────────────────────────────────────── */
const STEPS = ['Soạn & Đóng gói', 'Giao hàng', 'Hoàn tất'] as const;

const getCurrentStep = (status?: string): number => {
  switch (status) {
    case 'ASSIGNED':
    case 'PICKING':
    case 'PICKED':
      return 0;
    case 'READY_TO_SHIP':
    case 'DELIVERING':
      return 1;
    case 'DELIVERED':
      return 2;
    default:
      return 0;
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
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();

  const orderId = useMemo(() => {
    const raw = params.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [params.id]);

  const [session, setSession] = useState<StaffPickSession | null>(null);

  const [localPackingPhoto, setLocalPackingPhoto] = useState<string | null>(null);
  const [localDeliveryPhoto, setLocalDeliveryPhoto] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<number, boolean>>({});

  const pickListQuery = useQuery({
    queryKey: ['staff-order-pick-list', orderId],
    queryFn: () => staffOrdersApi.getPickList(orderId),
    enabled: orderId > 0,
    staleTime: 60_000,
  });

  const attendanceQuery = useQuery({
    queryKey: ['staff-attendance-today'],
    queryFn: () => getTodayStatus(),
  });

  const isClockedIn = useMemo(() => {
    if (!attendanceQuery.data) return false;
    const activeRecords = attendanceQuery.data.records.filter(r => r.checkInAt && !r.checkOutAt);
    if (activeRecords.length === 0) return false;

    // Check if any active record is still within its shift time
    const now = new Date();
    const currentTimeVal = now.getHours() * 60 + now.getMinutes();

    return activeRecords.some(r => {
      let endTimeVal = 0;
      if (r.shiftType === 'S') endTimeVal = 14 * 60 + 30; // 14:30
      else if (r.shiftType === 'C') endTimeVal = 22 * 60 + 30; // 22:30
      else if (r.shiftType === 'G') {
        if (r.blockNumber === 1) endTimeVal = 10 * 60 + 30;
        else if (r.blockNumber === 2) endTimeVal = 14 * 60 + 30;
        else if (r.blockNumber === 3) endTimeVal = 18 * 60 + 30;
        else if (r.blockNumber === 4) endTimeVal = 22 * 60 + 30;
      }
      return currentTimeVal < endTimeVal;
    });
  }, [attendanceQuery.data]);

  // Khởi tạo session một lần khi có dữ liệu
  useEffect(() => {
    if (pickListQuery.data && !session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(buildInitialSession(pickListQuery.data));
    }
  }, [pickListQuery.data, session]);

  // Đồng bộ ảnh đã tải lên từ trước
  useEffect(() => {
    if (pickListQuery.data) {
      if (pickListQuery.data.packingPhotoUrl) {
        setLocalPackingPhoto(pickListQuery.data.packingPhotoUrl);
      }
      if (pickListQuery.data.deliveryPhotoUrl) {
        setLocalDeliveryPhoto(pickListQuery.data.deliveryPhotoUrl);
      }
    }
  }, [pickListQuery.data]);

  // Heartbeat mỗi 5 phút để giữ lease đơn hàng
  useEffect(() => {
    if (!orderId) return;
    const t = setInterval(() => {
      staffOrdersApi.heartbeat(orderId).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [orderId]);

  const handleSelectPhoto = async (type: 'pack' | 'deliver', autoSubmit: boolean = false) => {
    Alert.alert(
      'Chọn hình ảnh',
      'Bạn muốn chụp ảnh trực tiếp hay chọn ảnh từ thư viện?',
      [
        {
          text: 'Chụp ảnh trực tiếp',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền camera trong cài đặt.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              quality: 0.8,
            });
            if (!res.canceled) {
              const uri = res.assets[0].uri;
              if (type === 'pack') {
                setLocalPackingPhoto(uri);
                if (autoSubmit) packMutation.mutate(uri);
              } else {
                setLocalDeliveryPhoto(uri);
                if (autoSubmit) completeDeliveryMutation.mutate(uri);
              }
            }
          }
        },
        {
          text: 'Chọn ảnh từ thư viện',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!res.canceled) {
              const uri = res.assets[0].uri;
              if (type === 'pack') {
                setLocalPackingPhoto(uri);
                if (autoSubmit) packMutation.mutate(uri);
              } else {
                setLocalDeliveryPhoto(uri);
                if (autoSubmit) completeDeliveryMutation.mutate(uri);
              }
            }
          }
        },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const packMutation = useMutation({
    mutationFn: async (photoUrl?: string) => {
      const mockUrl = photoUrl || localPackingPhoto || 'https://images.unsplash.com/photo-1542838132-92c53300491e';
      // 1. Pack order -> READY_TO_SHIP
      await staffOrdersApi.pack(orderId, mockUrl);
      // 2. Deliver order with same photo -> DELIVERING (Đang giao)
      await staffOrdersApi.deliver(orderId, mockUrl);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-order-queue'] });
      void qc.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      void qc.invalidateQueries({ queryKey: ['staff-order-pick-list', orderId] });
      Alert.alert('Thành công!', 'Xác nhận đóng gói hàng thành công. Đơn hàng chuyển sang trạng thái ĐANG GIAO.');
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể xác nhận đóng gói.');
    },
  });

  const deliverMutation = useMutation({
    mutationFn: async () => {
      const mockUrl = localDeliveryPhoto || 'https://images.unsplash.com/photo-1542838132-92c53300491e';
      await staffOrdersApi.deliver(orderId, mockUrl);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-order-queue'] });
      void qc.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      void qc.invalidateQueries({ queryKey: ['staff-order-pick-list', orderId] });
      Alert.alert('Thành công!', 'Bắt đầu đi giao hàng.');
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể đi giao hàng.');
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async (photoUrl?: string) => {
      const mockUrl = photoUrl || localDeliveryPhoto || 'https://images.unsplash.com/photo-1542838132-92c53300491e';
      // 1. Deliver with Photo 2 -> saves real POD photo to deliveryPhotoUrl
      await staffOrdersApi.deliver(orderId, mockUrl);
      // 2. Complete order -> DELIVERED
      await staffOrdersApi.complete(orderId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-order-queue'] });
      void qc.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      router.replace('/(staff)/orders/complete-success' as never);
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể hoàn tất đơn hàng.');
    },
  });

  const updateQty = useCallback((orderItemId: number, delta: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const it = prev.itemsById[orderItemId];
      if (!it) return prev;
      const newQty = clampInt(it.pickedQuantity + delta, 0, it.orderedQuantity);
      return {
        ...prev,
        itemsById: {
          ...prev.itemsById,
          [orderItemId]: { ...it, pickedQuantity: newQty, isSubstituted: false, substitutedVariantId: null },
        },
      };
    });
  }, []);

  const completeMutation = useMutation({
    mutationFn: () => {
      if (!session) throw new Error('Chưa có session nhặt hàng.');
      return staffOrdersApi.completePicking(orderId, buildCompletePickingPayload(session));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['staff-order-queue'] });
      void qc.invalidateQueries({ queryKey: ['staff-order-my-active'] });
      void qc.invalidateQueries({ queryKey: ['staff-order-pick-list', orderId] });
      Alert.alert('Hoàn thành nhặt hàng!', 'Hệ thống sẽ mở máy ảnh để bạn chụp ảnh xác nhận đóng gói.', [
        { text: 'Chụp ảnh ngay', onPress: () => setTimeout(() => handleSelectPhoto('pack', true), 300) },
      ]);
    },
    onError: (e) => {
      Alert.alert('Lỗi', e instanceof Error ? e.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    },
  });

  const progress = useMemo(() => {
    if (!session) return { done: 0, total: 0, allDone: false };
    const items = Object.values(session.itemsById);
    const done = items.filter((it) => it.pickedQuantity >= it.orderedQuantity || it.isSubstituted).length;
    return { done, total: items.length, allDone: done === items.length };
  }, [session]);

  const handleComplete = () => {
    const items = session ? Object.values(session.itemsById) : [];
    const hasZeroPicked = items.some((it) => it.pickedQuantity === 0);
    if (hasZeroPicked) {
      Alert.alert(
        'Chưa nhặt đủ hàng',
        'Có sản phẩm chưa được nhặt (số lượng nhặt bằng 0). Vui lòng soạn tối thiểu 1 sản phẩm cho mỗi mặt hàng.'
      );
      return;
    }

    Alert.alert(
      'Xác nhận hoàn thành',
      `Bạn đã nhặt ${progress.done}/${progress.total} mặt hàng. Xác nhận hoàn thành đơn?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận', onPress: () => completeMutation.mutate() },
      ],
    );
  };

  const pickItems = useMemo(() => pickListQuery.data?.items ?? [], [pickListQuery.data]);

  const order = pickListQuery.data as NonNullable<typeof pickListQuery.data>;
  const status = order?.status ?? '';
  const currentStep = getCurrentStep(status);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* App Header */}
      <View className="px-5 py-3 flex-row items-center bg-white border-b border-slate-100 shadow-sm justify-between">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 items-center justify-center mr-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-xl font-bold">←</Text>
          </Pressable>
          <View>
            <Text className="text-[20px] font-outfit-bold text-text">Chi tiết đơn soạn</Text>
            <Text className="text-[12px] font-inter text-muted mt-0.5">Xử lý đơn theo đúng quy trình đóng gói</Text>
          </View>
        </View>

        {/* Refetch button */}
        <Pressable
          onPress={() => void pickListQuery.refetch()}
          disabled={pickListQuery.isFetching}
          className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 items-center justify-center"
        >
          {pickListQuery.isFetching ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text className="text-emerald-600 text-lg">↻</Text>
          )}
        </Pressable>
      </View>

      {/* ── Loading ── */}
      {pickListQuery.isLoading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator color="#16A34A" />
          <Text className="text-xs font-inter text-muted mt-2">Đang tải đơn hàng…</Text>
        </View>

      /* ── Block if offline / not ready ── */
      ) : !isClockedIn ? (
        <View className="flex-1 px-6 justify-center items-center">
          <Card className="p-6 items-center bg-[#FFF7ED] border border-orange-200">
            <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center mb-4">
              <ShieldAlert size={32} color="#F97316" />
            </View>
            <Text className="font-outfit-bold text-text text-lg text-center">Yêu cầu Vào ca</Text>
            <Text className="text-xs font-inter text-muted mt-2 text-center leading-5 px-4">
              Không thể xử lý đơn hàng khi chưa vào ca làm việc. Vui lòng chấm công để thực hiện soạn hàng, đóng gói và giao hàng.
            </Text>
            <Pressable
              onPress={() => router.push('/(staff)/attendance' as never)}
              className="mt-6 w-full py-3.5 rounded-2xl bg-orange-500 items-center"
            >
              <Text className="font-outfit-bold text-white text-[13px] uppercase">Đi tới Chấm công</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              className="mt-2.5 w-full py-3.5 rounded-2xl bg-white border border-slate-200 items-center"
            >
              <Text className="font-outfit-bold text-slate-700 text-[13px]">Quay lại</Text>
            </Pressable>
          </Card>
        </View>

      /* ── Error ── */
      ) : pickListQuery.isError || !pickListQuery.data || !session ? (
        <View className="p-4">
          <Card className="p-4">
            <Text className="font-inter-bold text-text">Không tải được chi tiết đơn soạn.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Lỗi kết nối hoặc đơn không tồn tại.</Text>
            <Pressable
              onPress={() => void pickListQuery.refetch()}
              className="mt-4 px-4 py-3 rounded-2xl bg-primary items-center"
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

      /* ── Main content ── */
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingTop: 0,
              paddingBottom: (status === 'ASSIGNED' || status === 'PICKING') ? 120 : 40,
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
                    #{pickListQuery.data.orderNumber || pickListQuery.data.orderId}
                  </Text>
                </View>
                <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center">
                  <ShoppingBag size={26} color="#FFFFFF" />
                </View>
              </View>

              {/* Progress badge */}
              <View className="mt-3 rounded-[18px] bg-white/15 px-4 py-3">
                <Text className="text-[12px] font-inter text-white/80">Tiến độ nhặt hàng</Text>
                <Text className="mt-1 text-[20px] font-outfit-bold text-white">
                  {progress.done}/{progress.total} mặt hàng
                </Text>
              </View>

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

            {/* ───── Bằng chứng hình ảnh (Packing & Delivery Photos) ───── */}
            {(order.packingPhotoUrl || order.deliveryPhotoUrl) && (
              <Card className="p-5 rounded-[30px] border border-primary/20 bg-white">
                <View className="flex-row items-center mb-4">
                  <View className="w-9 h-9 rounded-full bg-[#EDF7F1] items-center justify-center mr-3 border border-primary/10">
                    <Camera size={18} color="#16A34A" />
                  </View>
                  <Text className="font-inter-bold text-text text-[17px]">Ảnh đối soát đơn hàng</Text>
                </View>

                <View className="flex-row gap-3">
                  {order.packingPhotoUrl ? (
                    <View className="flex-1 bg-[#F8FAF9] rounded-2xl p-3 border border-slate-100 items-center">
                      <Text className="text-[11px] font-inter-bold text-slate-500 mb-2 uppercase tracking-tighter">Ảnh đóng gói</Text>
                      <Image
                        source={{ uri: order.packingPhotoUrl }}
                        style={{ width: '100%', aspectRatio: 4/3, borderRadius: 12 }}
                        contentFit="cover"
                        cachePolicy="disk"
                        transition={200}
                      />
                    </View>
                  ) : null}
                  {order.deliveryPhotoUrl ? (
                    <View className="flex-1 bg-[#F8FAF9] rounded-2xl p-3 border border-slate-100 items-center">
                      <Text className="text-[11px] font-inter-bold text-slate-500 mb-2 uppercase tracking-tighter">Ảnh giao hàng (POD)</Text>
                      <Image
                        source={{ uri: order.deliveryPhotoUrl }}
                        style={{ width: '100%', aspectRatio: 4/3, borderRadius: 12 }}
                        contentFit="cover"
                        cachePolicy="disk"
                        transition={200}
                      />
                    </View>
                  ) : null}
                </View>
              </Card>
            )}

            {/* ───── BƯỚC TIẾP THEO: XÁC NHẬN BẰNG ẢNH CHỤP ───── */}
            {(status === 'PICKED' || status === 'READY_TO_SHIP' || status === 'DELIVERING') && (
              <Card className="p-5 rounded-[30px] border border-primary/20 bg-[#EDF7F1]">
                <View className="flex-row items-center mb-4">
                  <View className="w-9 h-9 rounded-full bg-white items-center justify-center mr-3 border border-primary/10">
                    <Camera size={18} color="#16A34A" />
                  </View>
                  <Text className="font-inter-bold text-text text-[17px]">Quy trình xử lý tiếp theo</Text>
                </View>

                {status === 'PICKED' ? (
                  <View className="bg-white rounded-2xl px-4 py-4 border border-slate-100">
                    <Text className="font-inter-bold text-[#0F172A] text-sm">Bước 1: Chụp ảnh Đóng gói sản phẩm</Text>
                    <Text className="font-inter text-slate-500 text-xs mt-1 leading-5">
                      Vui lòng chụp ảnh kiện hàng sau khi đóng gói. Xác nhận sẽ tự động chuyển đơn hàng sang trạng thái "Đang giao".
                    </Text>

                    {/* Camera upload box */}
                    <Pressable
                      onPress={() => handleSelectPhoto('pack')}
                      className="mt-4 aspect-video rounded-xl bg-slate-50 border border-dashed border-slate-300 items-center justify-center overflow-hidden"
                    >
                      {localPackingPhoto ? (
                        <Image source={{ uri: localPackingPhoto }} className="w-full h-full" contentFit="cover" />
                      ) : (
                        <View className="items-center">
                          <Camera size={28} color="#94A3B8" />
                          <Text className="text-xs font-inter text-muted mt-1.5">Nhấp để chụp hoặc tải ảnh lên</Text>
                        </View>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => packMutation.mutate(localPackingPhoto || undefined)}
                      disabled={!localPackingPhoto || packMutation.isPending}
                      className={`mt-4 w-full py-3.5 rounded-xl items-center justify-center flex-row ${
                        !localPackingPhoto || packMutation.isPending ? 'bg-slate-200' : 'bg-primary'
                      }`}
                    >
                      {packMutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Check size={16} color="#FFFFFF" className="mr-1.5" />
                          <Text className="font-outfit-bold text-white text-[13px]">Xác nhận đóng gói & Đi giao</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View className="bg-white rounded-2xl px-4 py-4 border border-slate-100">
                    <Text className="font-inter-bold text-[#0F172A] text-sm">Bước 2: Xác nhận Giao hàng thành công</Text>
                    <Text className="font-inter text-slate-500 text-xs mt-1 leading-5">
                      Chụp ảnh xác nhận (Proof of Delivery / POD) khi đã giao hàng đầy đủ cho khách hàng.
                    </Text>

                    {/* Camera upload box */}
                    <Pressable
                      onPress={() => handleSelectPhoto('deliver')}
                      className="mt-4 aspect-video rounded-xl bg-slate-50 border border-dashed border-slate-300 items-center justify-center overflow-hidden"
                    >
                      {localDeliveryPhoto ? (
                        <Image source={{ uri: localDeliveryPhoto }} className="w-full h-full" contentFit="cover" />
                      ) : (
                        <View className="items-center">
                          <Camera size={28} color="#94A3B8" />
                          <Text className="text-xs font-inter text-muted mt-1.5">Nhấp để chụp hoặc tải ảnh giao hàng</Text>
                        </View>
                      )}
                    </Pressable>

                    {/* Display photos taken */}
                    <View className="flex-row mt-3 mb-1" style={{ gap: 8 }}>
                      {localPackingPhoto && (
                        <View className="flex-1">
                          <Text className="text-[10px] font-inter text-muted mb-1">Ảnh đóng gói</Text>
                          <Image source={{ uri: localPackingPhoto }} className="w-full aspect-video rounded-lg" contentFit="cover" />
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={() => completeDeliveryMutation.mutate(localDeliveryPhoto || undefined)}
                      disabled={!localDeliveryPhoto || completeDeliveryMutation.isPending}
                      className={`mt-4 w-full py-3.5 rounded-xl items-center justify-center flex-row ${
                        !localDeliveryPhoto || completeDeliveryMutation.isPending ? 'bg-slate-200' : 'bg-emerald-600'
                      }`}
                    >
                      {completeDeliveryMutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <Check size={16} color="#FFFFFF" className="mr-1.5" />
                          <Text className="font-outfit-bold text-white text-[13px]">Giao thành công & Hoàn tất</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </Card>
            )}

            {/* ───── Product list card (Flat List styled like Customer Cart) ───── */}
            <View style={{ gap: 10 }}>
              {pickItems.map((it) => {
                const state = session.itemsById[it.orderItemId];
                if (!state) return null;

                const isFullyPicked = state.pickedQuantity >= it.orderedQuantity;
                const isZero = state.pickedQuantity === 0;
                const leftBorderColor = isFullyPicked ? '#10B981' : isZero ? '#EF4444' : '#F59E0B';

                return (
                  <View
                    key={it.orderItemId}
                    style={{ borderLeftWidth: 4, borderLeftColor: leftBorderColor, borderRadius: 24, overflow: 'hidden' }}
                  >
                    <Card className="p-4 flex-row items-center bg-white border border-slate-50 shadow-sm" style={{ elevation: 1 }}>
                      {/* Left: Product Image */}
                      <View className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 mr-4 items-center justify-center">
                        {(!it.imageUrl || brokenImageIds[it.orderItemId]) ? (
                          <View className="w-full h-full bg-[#16A34A] items-center justify-center">
                            <Text className="text-white text-lg font-outfit-bold">
                              {(it.productName || 'S').trim().charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        ) : (
                          <Image
                            source={{ uri: it.imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            cachePolicy="disk"
                            transition={200}
                            onError={() => setBrokenImageIds((prev) => ({ ...prev, [it.orderItemId]: true }))}
                          />
                        )}
                      </View>

                      {/* Middle: Product Name, Variant, SKU & Shelf Location */}
                      <View className="flex-1 justify-between py-1">
                        <View>
                          <Text className="text-[14px] font-outfit-bold text-[#0F172A]" numberOfLines={2}>
                            {it.productName}
                          </Text>
                          <Text className="text-[11px] font-inter text-slate-400 mt-1" numberOfLines={1}>
                            {it.variantName ?? '-'} • SKU: {it.sku}
                          </Text>
                          {it.aisleLocation ? (
                            <View className="bg-emerald-50 self-start px-2 py-0.5 rounded-md mt-1.5 border border-emerald-100">
                              <Text className="text-[10px] font-inter-bold text-[#16A34A]">
                                Kệ: {it.aisleLocation}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Right: Needs count & Picking controls */}
                      <View className="items-end justify-between py-1 pl-2">
                        <View className="flex-row items-center mb-3">
                          <Text className="text-[11px] font-inter text-slate-400 mr-1.5">Cần:</Text>
                          <Text className="text-[14px] font-outfit-bold text-[#0F172A]">{it.orderedQuantity}</Text>
                        </View>

                        {(status === 'ASSIGNED' || status === 'PICKING') ? (
                          <View className="flex-row items-center" style={{ gap: 8 }}>
                            <Pressable
                              onPress={() => updateQty(it.orderItemId, -1)}
                              disabled={state.pickedQuantity <= 0}
                              style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: state.pickedQuantity <= 0 ? '#F1F5F9' : '#16A34A' }}
                            >
                              <Text style={{ fontWeight: '700', fontSize: 16, color: state.pickedQuantity <= 0 ? '#94A3B8' : '#FFFFFF', lineHeight: 20 }}>-</Text>
                            </Pressable>
                            <Text className="font-outfit-bold text-[#0F172A] text-[15px]" style={{ minWidth: 20, textAlign: 'center' }}>
                              {state.pickedQuantity}
                            </Text>
                            <Pressable
                              onPress={() => updateQty(it.orderItemId, 1)}
                              disabled={state.pickedQuantity >= it.orderedQuantity}
                              style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: state.pickedQuantity >= it.orderedQuantity ? '#F1F5F9' : '#16A34A' }}
                            >
                              <Text style={{ fontWeight: '700', fontSize: 16, color: state.pickedQuantity >= it.orderedQuantity ? '#94A3B8' : '#FFFFFF', lineHeight: 20 }}>+</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <View className="flex-row items-center bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <Text className="text-[12px] font-outfit-bold text-[#16A34A] mr-1">{state.pickedQuantity} / {it.orderedQuantity}</Text>
                            <View className="w-4 h-4 rounded-full bg-[#16A34A] items-center justify-center">
                              <Text className="text-white text-[9px] font-bold">✓</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </Card>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* ───── Fixed bottom action bar ───── */}
          {(status === 'ASSIGNED' || status === 'PICKING') && (
            <View
              className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 pb-8 pt-5"
              style={{ elevation: 10 }}
            >
              <Pressable
                onPress={handleComplete}
                disabled={completeMutation.isPending}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  backgroundColor: completeMutation.isPending ? '#e2e8f0' : '#16A34A',
                }}
              >
                {completeMutation.isPending ? (
                  <ActivityIndicator color="#16A34A" />
                ) : (
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#ffffff' }}>
                    {progress.allDone ? '✓ Hoàn thành nhặt hàng' : `Hoàn thành (${progress.done}/${progress.total})`}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

        </>
      )}
    </SafeAreaView>
  );
}
