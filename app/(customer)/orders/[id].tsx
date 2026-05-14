import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  ChevronLeft,
  Package,
  Receipt,
  Truck,
  AlertCircle
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { orderApi } from '../../../src/api/orders';

/* ─── helpers ─── */
function formatCurrency(amount?: number | null) {
  if (amount == null) return '0₫';
  return amount.toLocaleString('vi-VN') + '₫';
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

function getStatusInfo(status: string) {
  switch (status) {
    case 'PENDING':
      return { label: 'Đang chờ xử lý', icon: Clock, color: '#EAB308', bg: '#FEF9C3' };
    case 'ASSIGNED':
      return { label: 'Đã tiếp nhận đơn', icon: Package, color: '#3B82F6', bg: '#DBEAFE' };
    case 'PICKING':
      return { label: 'Đang chuẩn bị hàng', icon: Package, color: '#3B82F6', bg: '#DBEAFE' };
    case 'READY_TO_SHIP':
      return { label: 'Đã đóng gói xong', icon: Package, color: '#3B82F6', bg: '#DBEAFE' };
    case 'SHIPPED':
      return { label: 'Đang giao hàng', icon: Truck, color: '#8B5CF6', bg: '#EDE9FE' };
    case 'DELIVERED':
      return { label: 'Giao thành công', icon: CheckCircle2, color: '#16A34A', bg: '#DCFCE7' };
    case 'CANCELLED':
      return { label: 'Đã hủy đơn', icon: AlertCircle, color: '#EF4444', bg: '#FEE2E2' };
    default:
      return { label: status, icon: ShoppingBag, color: '#64748B', bg: '#F1F5F9' };
  }
}

export default function OrderDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const orderId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    const parsed = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.id]);

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getOrderById(orderId),
    enabled: orderId > 0,
    staleTime: 30000,
  });

  const [cancelling, setCancelling] = React.useState(false);

  const handleCancel = async () => {
    if (!order) return;
    Alert.alert(
      'Xác nhận hủy đơn',
      'Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Hủy đơn', 
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await orderApi.cancelOrder(order.id);
              await refetch();
              Alert.alert('Thành công', 'Đơn hàng của bạn đã được hủy.');
            } catch (e: any) {
              Alert.alert('Lỗi', e.message || 'Không thể hủy đơn hàng lúc này.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const statusInfo = useMemo(() => (order ? getStatusInfo(order.status) : null), [order]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['left', 'right', 'top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
      <View className="px-5 py-3 flex-row items-center bg-white border-b border-slate-100 shadow-sm">
        <Pressable 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 items-center justify-center mr-3"
          hitSlop={10}
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <View>
          <Text className="text-[20px] font-outfit-bold text-slate-900">Chi tiết đơn hàng</Text>
          <Text className="text-[12px] font-inter text-slate-500 mt-0.5">Theo dõi hành trình đơn hàng của bạn</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#16A34A" size="large" />
          <Text className="text-[13px] font-inter text-slate-500 mt-3">Đang tải chi tiết đơn hàng...</Text>
        </View>
      ) : isError || !order ? (
        <View className="flex-1 p-6 items-center justify-center">
           <AlertCircle size={48} color="#EF4444" />
           <Text className="text-lg font-outfit-bold text-slate-900 mt-4">Không tìm thấy đơn hàng</Text>
           <Text className="text-sm font-inter text-slate-500 text-center mt-2">Đã có lỗi xảy ra hoặc đơn hàng này không tồn tại.</Text>
           <Pressable onPress={() => router.back()} className="mt-8 px-8 py-3 bg-primary rounded-2xl">
              <Text className="text-white font-inter-bold">Quay lại</Text>
           </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ───── Status Banner ───── */}
          <View className="rounded-[32px] p-6 bg-[#16A34A] overflow-hidden">
            <View className="absolute right-[-10] top-[-10] w-32 h-32 rounded-full bg-white/10" />
            <View className="absolute right-8 bottom-[-24] w-20 h-20 rounded-full bg-white/10" />

            <View className="flex-row items-start justify-between">
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text className="text-[13px] font-inter text-white/85">Mã đơn hàng</Text>
                <Text className="mt-1 text-[26px] font-outfit-bold text-white" numberOfLines={1}>
                  #{order.orderNumber}
                </Text>
              </View>
              <View className="w-14 h-14 rounded-2xl bg-white/15 items-center justify-center">
                <ShoppingBag size={26} color="#FFFFFF" />
              </View>
            </View>

            <View className="mt-4 rounded-[22px] bg-white/15 px-4 py-3 flex-row items-center" style={{ gap: 10 }}>
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                {statusInfo && <statusInfo.icon size={22} color="#FFFFFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text className="text-[15px] font-outfit-bold text-white">
                  {statusInfo?.label || order.status}
                </Text>
                <Text className="text-[12px] font-inter text-white/80 mt-0.5">
                  Đặt vào {formatDateFull(order.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* ───── Delivery Info ───── */}
          <Card className="p-5 rounded-[30px] border border-slate-50">
            <View className="flex-row items-center mb-4">
              <View className="w-9 h-9 rounded-full bg-[#EDF7F1] items-center justify-center mr-3">
                <MapPin size={18} color="#16A34A" />
              </View>
              <Text className="font-inter-bold text-slate-900 text-[17px]">Thông tin giao hàng</Text>
            </View>
            
            <View className="bg-slate-50 rounded-2xl px-4 py-4" style={{ gap: 12 }}>
              <View>
                <Text className="font-inter text-slate-400 text-[11px] uppercase">Phương thức thanh toán</Text>
                <View className="flex-row items-center mt-1">
                  <CreditCard size={14} color="#64748B" />
                  <Text className="font-inter-bold text-slate-700 text-[13px] ml-2">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-slate-200" />

              <View>
                <Text className="font-inter text-slate-400 text-[11px] uppercase">Địa chỉ nhận hàng</Text>
                <Text className="font-inter text-slate-700 text-[13px] leading-5 mt-1">
                  {order.addressLine || 'Địa chỉ đang cập nhật...'}
                </Text>
              </View>

              {order.customerNote ? (
                <>
                  <View className="h-px bg-slate-200" />
                  <View>
                    <Text className="font-inter text-slate-400 text-[11px] uppercase">Ghi chú</Text>
                    <Text className="font-inter text-slate-600 text-[13px] italic mt-1">
                      "{order.customerNote}"
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          </Card>

          {/* ───── Order Items ───── */}
          <Card className="p-5 rounded-[30px] border border-slate-50">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-[#EDF7F1] items-center justify-center mr-3">
                  <Package size={18} color="#16A34A" />
                </View>
                <Text className="font-inter-bold text-slate-900 text-[17px]">Danh sách mặt hàng</Text>
              </View>
              <View className="px-3 py-1 rounded-full bg-[#EDF7F1]">
                <Text className="text-[11px] font-inter-bold text-[#16A34A]">{order.items.length} món</Text>
              </View>
            </View>

            <View style={{ gap: 14 }}>
              {order.items.map((it) => (
                <View key={it.id} className="flex-row items-center">
                  <View className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                    <Image
                      source={{ uri: it.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      cachePolicy="disk"
                      transition={200}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text className="font-inter-bold text-slate-900 text-[15px]" numberOfLines={1}>
                      {it.productName}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text className="text-[12px] font-inter text-slate-500">
                        SL: {it.quantity} × 
                      </Text>
                      {it.discountAmount > 0 && (
                        <Text className="text-[11px] font-inter text-slate-400 line-through ml-1">
                          {formatCurrency(it.unitPrice)}
                        </Text>
                      )}
                      <Text className="text-[12px] font-inter-bold text-slate-700 ml-1">
                        {formatCurrency(it.totalPrice / it.quantity)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text className="font-inter-bold text-primary text-[15px]">
                      {formatCurrency(it.totalPrice)}
                    </Text>
                    {it.discountAmount > 0 && (
                      <Text className="text-[10px] font-inter text-red-500 mt-0.5">
                        Giảm {formatCurrency(it.discountAmount)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* ── Payment Summary ── */}
            <View className="mt-6 pt-5 border-t border-slate-100" style={{ gap: 8 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Receipt size={14} color="#94A3B8" />
                  <Text className="font-inter text-slate-500 text-[13px] ml-2">Tạm tính</Text>
                </View>
                <Text className="font-inter-bold text-slate-700 text-[13px]">
                  {formatCurrency(order.subtotal)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Truck size={14} color="#94A3B8" />
                  <Text className="font-inter text-slate-500 text-[13px] ml-2">Phí vận chuyển</Text>
                </View>
                <Text className="font-inter-bold text-slate-700 text-[13px]">
                  +{formatCurrency(order.shippingFee)}
                </Text>
              </View>

              {order.discountAmount > 0 && (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <AlertCircle size={14} color="#EF4444" />
                    <Text className="font-inter text-red-500 text-[13px] ml-2">Giảm giá</Text>
                  </View>
                  <Text className="font-inter-bold text-red-500 text-[13px]">
                    -{formatCurrency(order.discountAmount)}
                  </Text>
                </View>
              )}

              <View className="h-px bg-slate-100 my-1" />

              <View className="flex-row justify-between items-center">
                <Text className="font-outfit-bold text-slate-900 text-[18px]">Tổng cộng</Text>
                <Text className="font-outfit-bold text-[#16A34A] text-[22px]">
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>
            </View>
          </Card>

          {['PENDING', 'ASSIGNED', 'PICKING'].includes(order.status) && (
            <Pressable
              onPress={handleCancel}
              disabled={cancelling}
              className="mt-4 mb-6 mx-4 py-4 rounded-2xl bg-red-50 border border-red-100 items-center active:bg-red-100"
            >
              {cancelling ? (
                <ActivityIndicator color="#EF4444" size="small" />
              ) : (
                <Text className="text-red-500 font-inter-bold text-[16px]">Hủy đơn hàng</Text>
              )}
            </Pressable>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
