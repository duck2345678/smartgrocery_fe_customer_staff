import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  Package,
  ChevronLeft,
} from 'lucide-react-native';
import Card from '../../../../src/components/ui/Card';
import { staffOrdersApi } from '../../../../src/api/staffOrders';

/* ─── helpers ─── */
function formatCurrency(amount?: number | null) {
  if (amount == null) return '0 ₫';
  return amount.toLocaleString('vi-VN') + ' ₫';
}

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

/* ─── Main screen ─── */
export default function StaffPerformanceOrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [brokenImageIds, setBrokenImageIds] = React.useState<Record<number, boolean>>({});

  const orderId = useMemo(() => {    const raw = params.id;
    const v = Array.isArray(raw) ? raw[0] : raw;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [params.id]);

  const detailQuery = useQuery({
    queryKey: ['staff-order-detail-delivered', orderId],
    queryFn: () => staffOrdersApi.getPickList(orderId),
    enabled: orderId > 0,
  });

  const order = detailQuery.data;
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
    }));
  }, [order]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5FAF7]" edges={['left', 'right', 'top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-5 py-3 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 items-center justify-center mr-3"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <View>
          <Text className="text-[20px] font-outfit-bold text-text">Chi tiết đơn hàng</Text>
          <Text className="text-[12px] font-inter text-muted mt-0.5">Đơn hàng đã được giao thành công</Text>
        </View>
      </View>

      {/* ── Loading ── */}
      {detailQuery.isLoading ? (
        <View className="flex-1 items-center justify-center bg-[#F3FBF7]">
          <View className="items-center justify-center w-16 h-16 rounded-full bg-white border border-[#DCEFE4] mb-3">
            <ActivityIndicator color="#16A34A" />
          </View>
          <Text className="text-[13px] font-inter text-slate-500 mt-1">
            Đang tải chi tiết đơn…
          </Text>
        </View>

      /* ── Error ── */
      ) : detailQuery.isError || !order ? (
        <View className="p-4">
          <Card className="p-4">
            <Text className="font-inter-bold text-text">Không tải được chi tiết đơn.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Vui lòng thử lại.</Text>
            <Pressable
              onPress={() => void detailQuery.refetch()}
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

      /* ── Main content ── */
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 0,
            paddingBottom: 40,
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

            {/* ── Delivered badge ── */}
            <View className="mt-4 rounded-[22px] bg-white/15 px-4 py-3 flex-row items-center" style={{ gap: 10 }}>
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                <CheckCircle2 size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-[15px] font-outfit-bold text-white">Đã giao thành công</Text>
                <Text className="text-[12px] font-inter text-white/80 mt-0.5">
                  Đơn hàng đã được giao đến khách hàng
                </Text>
              </View>
            </View>
          </View>

          {/* ───── Thông tin chi tiết (Gộp Người nhận, Địa chỉ, Thanh toán, Lịch trình) ───── */}
          <Card className="p-5 rounded-[30px]">
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-full bg-[#EDF7F1] items-center justify-center mr-3">
                <MapPin size={18} color="#16A34A" />
              </View>
              <Text className="font-inter-bold text-text text-[17px]">Thông tin chi tiết</Text>
            </View>
            
            <View className="bg-[#F8FAF9] rounded-2xl px-4 py-4" style={{ gap: 14 }}>
              {/* 1. Người nhận & SĐT */}
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

              {/* 2. Địa chỉ */}
              <View>
                <Text className="font-inter text-muted text-[11px] mb-1">Địa chỉ nhận hàng</Text>
                <Text className="font-inter text-text text-[13px] leading-5">
                  {order.addressLine || '—'}
                </Text>
              </View>

              <View className="h-px bg-slate-200" />

              {/* 3. Phương thức thanh toán */}
              <View>
                <Text className="font-inter text-muted text-[11px] mb-1">Phương thức thanh toán</Text>
                <Text className="font-inter-bold text-text text-[13px]">
                  {getPaymentMethodLabel(order.paymentMethod)}
                </Text>
              </View>

              {/* 4. Lịch trình (nhỏ hơn ở dưới) */}
              <View className="flex-row justify-between border-t border-dashed border-slate-300 pt-3 mt-1">
                <View>
                  <Text className="font-inter text-muted text-[10px] uppercase tracking-tighter">Ngày đặt hàng</Text>
                  <Text className="font-inter text-slate-500 text-[11px] mt-0.5">{formatDateFull(order.orderDate)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text className="font-inter text-muted text-[10px] uppercase tracking-tighter">Ngày giao hàng</Text>
                  <Text className="font-inter text-slate-500 text-[11px] mt-0.5">{formatDateFull(order.deliveryDate || order.leaseExpiresAt)}</Text>
                </View>
              </View>
            </View>
          </Card>

          {/* ───── Ảnh đóng gói & Giao hàng (Đưa lên trên danh sách mặt hàng) ───── */}
          {(order.packingPhotoUrl || order.deliveryPhotoUrl) && (
            <View className="flex-row" style={{ gap: 12 }}>
              {order.packingPhotoUrl && (
                <View className="flex-1 rounded-[30px] p-4 bg-[#EDF7F1] border border-[#D1EAD9]">
                  <Text className="font-inter-bold text-[#111827] text-[13px] mb-2 text-center">Ảnh đóng gói</Text>
                  <View className="w-full aspect-square rounded-[20px] bg-white overflow-hidden">
                    <Image source={{ uri: order.packingPhotoUrl }} className="w-full h-full" resizeMode="cover" />
                  </View>
                </View>
              )}
              {order.deliveryPhotoUrl && (
                <View className="flex-1 rounded-[30px] p-4 bg-[#EDF7F1] border border-[#D1EAD9]">
                  <Text className="font-inter-bold text-[#111827] text-[13px] mb-2 text-center">Ảnh giao hàng</Text>
                  <View className="w-full aspect-square rounded-[20px] bg-white overflow-hidden">
                    <Image source={{ uri: order.deliveryPhotoUrl }} className="w-full h-full" resizeMode="cover" />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ───── Danh sách mặt hàng (Thiết kế lại gọn gàng hơn) ───── */}
          <Card className="p-5 rounded-[30px]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="font-inter-bold text-text text-[19px]">Danh sách mặt hàng</Text>
              <View className="px-3 py-1 rounded-full bg-[#EDF7F1]">
                <Text className="text-[11px] font-inter-bold text-[#16A34A]">{items.length} món</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              {items.map((it) => {
                const fallbackLabel = (it.productName || 'S').trim().charAt(0).toUpperCase();
                const showFallback = !it.imageUrl || brokenImageIds[it.orderItemId];
                return (
                <View key={it.orderItemId} className="flex-row items-center">
                  <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mr-3 overflow-hidden border border-slate-100">
                    {!showFallback ? (
                      <Image
                        source={{ uri: it.imageUrl as string }}
                        className="w-full h-full"
                        resizeMode="cover"
                        onError={() => setBrokenImageIds((prev) => ({ ...prev, [it.orderItemId]: true }))}
                      />
                    ) : (
                      <View className="w-full h-full bg-[#16A34A] items-center justify-center">
                        <Text className="text-white text-[18px] font-outfit-bold">{fallbackLabel}</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text className="font-inter-bold text-text text-[15px]" numberOfLines={1}>{it.productName}</Text>
                    <Text className="text-[12px] font-inter text-muted mt-0.5">
                      SL: {it.orderedQuantity} × {formatCurrency(it.unitPrice)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text className="font-inter-bold text-[#16A34A] text-[15px]">
                      {formatCurrency(it.unitPrice * it.orderedQuantity)}
                    </Text>
                    <View className="mt-1 bg-[#16A34A] w-5 h-5 rounded-full items-center justify-center">
                      <Text className="text-white text-[12px]">✓</Text>
                    </View>
                  </View>
                </View>
                );
              })}
            </View>

            {/* ── Tổng tiền ── */}
            <View className="mt-5 pt-4 border-t border-slate-100" style={{ gap: 6 }}>
              <View className="flex-row justify-between items-center">
                <Text className="font-inter text-muted text-[12px]">Tạm tính</Text>
                <Text className="font-inter-bold text-text text-[12px]">{formatCurrency(order.subtotal)}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="font-inter text-muted text-[12px]">Phí & giảm giá</Text>
                <Text className="font-inter-bold text-text text-[12px]">
                  {formatCurrency((order.totalAmount || 0) - (order.subtotal || 0))}
                </Text>
              </View>
              <View className="flex-row justify-between items-center mt-1">
                <Text className="font-inter-bold text-text text-[15px]">Tổng tiền</Text>
                <Text className="font-outfit-bold text-[#16A34A] text-[18px]">{formatCurrency(order.totalAmount)}</Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
