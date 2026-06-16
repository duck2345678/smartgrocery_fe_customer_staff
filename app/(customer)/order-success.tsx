import { View, Text, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../src/components/ui/Button';
import { CheckCircle2, Gift } from 'lucide-react-native';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../src/api/orders';
import { Image } from 'expo-image';

export default function OrderSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawOrderNumber = useMemo(() => {
    const raw = Array.isArray(params.orderNumber) ? params.orderNumber[0] : params.orderNumber;
    const normalized = String(raw ?? '').trim();
    return normalized.length > 0 ? normalized : null;
  }, [params.orderNumber]);
  const orderId = useMemo(() => {
    const raw = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
    const parsed = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.orderId]);
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderApi.getOrderById(orderId),
    enabled: orderId > 0,
    staleTime: 2 * 60 * 1000,
  });

  const displayOrderNumber = order?.orderNumber ?? rawOrderNumber;

  return (
    <View className="flex-1 bg-slate-50 p-6">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingVertical: 24 }}>
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-emerald-50 rounded-full items-center justify-center border border-emerald-100 shadow-sm">
            <CheckCircle2 size={44} color="#10B981" />
          </View>
          <Text className="text-2xl font-outfit-bold text-slate-900 mt-4">Đặt hàng thành công</Text>
          <Text className="text-xs font-inter text-slate-500 mt-1.5 text-center px-4">
            Cảm ơn bạn đã mua sắm! Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
          </Text>
        </View>

        {order ? (
          <View className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            {/* Receipt Header */}
            <View className="bg-slate-50/50 p-4 border-b border-slate-100 flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-inter text-muted uppercase tracking-wider">Mã đơn hàng</Text>
                <Text className="text-sm font-outfit-bold text-slate-800 mt-0.5">
                  {displayOrderNumber ?? '—'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-inter text-muted uppercase tracking-wider">Thanh toán</Text>
                <Text className="text-xs font-inter-bold text-primary mt-0.5">
                  {order.paymentMethod}
                </Text>
              </View>
            </View>

            <View className="p-5">
              {/* Items Section */}
              {(order.items ?? []).length > 0 ? (
                <View className="mb-4">
                  <Text className="text-[10px] font-inter-bold text-muted uppercase tracking-wider mb-3">Sản phẩm mua</Text>
                  <View className="gap-y-3">
                    {(order.items ?? []).slice(0, 3).map((item) => (
                      <View key={item.id} className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-4">
                          <View className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 mr-2.5">
                            {item.imageUrl ? (
                              <Image
                                source={{ uri: item.imageUrl }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                              />
                            ) : (
                              <View className="w-full h-full bg-slate-100 items-center justify-center animate-pulse" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-inter-semibold text-slate-800" numberOfLines={1}>
                              {item.productName}
                            </Text>
                            <Text className="text-[10px] font-inter text-muted mt-0.5">
                              Số lượng: {item.quantity} • {item.variantName || 'Mặc định'}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs font-outfit-bold text-slate-800">
                          {(item.totalPrice ?? 0).toLocaleString('vi-VN')}₫
                        </Text>
                      </View>
                    ))}
                  </View>
                  {(order.items ?? []).length > 3 ? (
                    <View className="mt-3 py-1 px-2.5 bg-slate-50 rounded-lg self-start">
                      <Text className="text-[10px] font-inter-semibold text-muted">
                        + {(order.items ?? []).length - 3} sản phẩm khác
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Divider */}
              <View className="h-px border-t border-dashed border-slate-200 my-4" />

              {/* Payment Summary */}
              <View className="gap-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-inter text-muted">Tạm tính</Text>
                  <Text className="text-xs font-inter text-slate-800">
                    {(order.subtotal ?? 0).toLocaleString('vi-VN')}₫
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-inter text-muted">Phí giao hàng</Text>
                  <Text className="text-xs font-inter text-slate-800">
                    {(order.shippingFee ?? 0).toLocaleString('vi-VN')}₫
                  </Text>
                </View>
                {order.discountAmount && Number(order.discountAmount) > 0 ? (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-inter text-muted">Giảm giá</Text>
                    <Text className="text-xs font-inter-semibold text-emerald-600">
                      -{(order.discountAmount).toLocaleString('vi-VN')}₫
                    </Text>
                  </View>
                ) : null}
                
                <View className="h-px bg-slate-100 my-2" />

                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-inter-bold text-slate-800">Tổng cộng</Text>
                  <Text className="text-base font-outfit-bold text-primary">
                    {(order.totalAmount ?? 0).toLocaleString('vi-VN')}₫
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : isLoading ? (
          <View className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm items-center justify-center min-h-[150px]">
            <Text className="text-xs font-inter text-muted">Đang tải chi tiết đơn hàng…</Text>
          </View>
        ) : isError ? (
          <View className="rounded-3xl border border-red-100 bg-red-50/50 p-5 items-center justify-center min-h-[100px]">
            <Text className="text-xs font-inter text-red-500">Không thể tải chi tiết đơn hàng.</Text>
          </View>
        ) : null}

        {order?.rewardVoucher ? (
          <View className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center mr-3 shadow-xs">
                <Gift size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-outfit-bold text-emerald-900">Voucher đã được mở khóa!</Text>
                <Text className="text-[10px] font-inter text-emerald-700 mt-0.5 leading-relaxed">
                  Mã <Text className="font-inter-bold text-emerald-950">{order.rewardVoucher.voucherCode}</Text> sẽ xuất hiện trong kho voucher của bạn.
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View className="gap-y-3 pt-3 bg-slate-50 border-t border-slate-100">
        <Button
          label="Xem đơn hàng"
          onPress={() => {
            if (orderId > 0) {
              router.replace({
                pathname: '/(customer)/orders/[id]',
                params: {
                  id: String(orderId),
                },
              } as never);
              return;
            }
            router.replace('/(customer)/orders' as never);
          }}
          hapticVariant="success"
        />
        <Button label="Tiếp tục mua sắm" variant="outline" onPress={() => router.replace('/(customer)' as never)} />
      </View>
    </View>
  );
}
