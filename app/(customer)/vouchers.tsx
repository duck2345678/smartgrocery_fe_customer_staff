import { Alert, View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { orderApi } from '../../src/api/orders';
import { ChevronLeft, Ticket, CheckCircle2, Sparkles, Tag, BellOff, LockKeyhole } from 'lucide-react-native';
import { useMemo, useState } from 'react';

export default function VouchersPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [claimingVoucherId, setClaimingVoucherId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'regular' | 'ai'>('regular');

  const vouchersQuery = useQuery({
    queryKey: ['claimable-vouchers'],
    queryFn: () => orderApi.getClaimableVouchers(),
  });

  const claimedVouchersQuery = useQuery({
    queryKey: ['claimed-vouchers'],
    queryFn: () => orderApi.getClaimedVouchers(),
  });

  const handleClaim = async (voucherId: number) => {
    setClaimingVoucherId(voucherId);
    try {
      await orderApi.claimVoucher(voucherId);
      Alert.alert('Thành công', 'Lưu mã giảm giá thành công!');
      await queryClient.invalidateQueries({ queryKey: ['claimable-vouchers'] });
      await queryClient.invalidateQueries({ queryKey: ['claimed-vouchers'] });
    } catch (error: any) {
      console.error('Claim voucher error:', error);
      Alert.alert('Thất bại', error?.message || 'Không thể lưu voucher này. Vui lòng thử lại sau.');
    } finally {
      setClaimingVoucherId(null);
    }
  };

  const vouchers = useMemo(() => {
    const merged = [...(claimedVouchersQuery.data ?? []), ...(vouchersQuery.data ?? [])];
    const seen = new Set<number>();
    return merged.filter((voucher) => {
      if (!voucher || typeof voucher.id !== 'number') return false;
      if (seen.has(voucher.id)) return false;
      seen.add(voucher.id);
      return true;
    });
  }, [claimedVouchersQuery.data, vouchersQuery.data]);

  const claimedVoucherIds = useMemo(() => {
    return new Set((claimedVouchersQuery.data ?? []).map((voucher) => voucher.id));
  }, [claimedVouchersQuery.data]);

  const regularVouchers = vouchers.filter(v => v.revealTrigger !== 'AI_ORDER_COMPLETED');
  const aiVouchers = vouchers.filter(v => v.revealTrigger === 'AI_ORDER_COMPLETED');

  const activeVouchers = activeCategory === 'ai' ? aiVouchers : regularVouchers;

  const isLoading = vouchersQuery.isLoading || claimedVouchersQuery.isLoading;
  const isError = vouchersQuery.isError || claimedVouchersQuery.isError;

  const formatDiscount = (val: any, type: string) => {
    const num = Number(val);
    if (isNaN(num)) return '0';
    if (type === 'PERCENT' || type === 'PERCENTAGE') {
      return `Giảm ${num}%`;
    }
    return `Giảm ${num.toLocaleString('vi-VN')}₫`;
  };

  const formatMinOrder = (val: any) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return 'Đơn tối thiểu 0₫';
    return `Đơn tối thiểu ${num.toLocaleString('vi-VN')}₫`;
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <View 
        className="bg-white px-6 pb-4 border-b border-slate-100"
        style={{ paddingTop: Math.max(insets.top, 20) }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100"
          >
            <ChevronLeft size={20} color="#0F172A" />
          </Pressable>
          <View className="items-center">
            <Text className="text-[17px] font-outfit-bold text-slate-900">Mã giảm giá</Text>
            <Text className="text-[11px] font-inter text-slate-400">Khuyến mãi của tôi</Text>
          </View>
          <View className="w-10" />
        </View>
      </View>

      {/* Category Tabs */}
      <View className="px-6 py-3 flex-row bg-white border-b border-slate-100">
        <View className="flex-1 flex-row bg-slate-50 p-1.5 rounded-2xl" style={{ gap: 6 }}>
          <Pressable 
            onPress={() => setActiveCategory('regular')}
            className="flex-1 py-3 rounded-xl items-center justify-center flex-row"
            style={[
              { gap: 6 },
              activeCategory === 'regular' && {
                backgroundColor: '#FFFFFF',
                shadowColor: '#94A3B8',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }
            ]}
          >
            <Tag size={15} color={activeCategory === 'regular' ? '#16A34A' : '#64748B'} />
            <Text className={`text-[12.5px] ${activeCategory === 'regular' ? 'font-outfit-bold text-slate-800' : 'font-inter text-slate-500'}`}>
              Voucher thường ({regularVouchers.length})
            </Text>
          </Pressable>
          
          <Pressable 
            onPress={() => setActiveCategory('ai')}
            className="flex-1 py-3 rounded-xl items-center justify-center flex-row"
            style={[
              { gap: 6 },
              activeCategory === 'ai' && {
                backgroundColor: '#FFFFFF',
                shadowColor: '#94A3B8',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#FAE8FF'
              }
            ]}
          >
            <Sparkles size={14} color={activeCategory === 'ai' ? '#8B5CF6' : '#64748B'} />
            <Text className={`text-[12.5px] ${activeCategory === 'ai' ? 'font-outfit-bold text-slate-800' : 'font-inter text-slate-500'}`}>
              Đặc quyền AI ({aiVouchers.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="text-2xl font-outfit-bold text-slate-900">
            {activeCategory === 'ai' ? 'Quà tặng từ AI Assistant ✦' : 'Ưu đãi dành cho bạn'}
          </Text>
          <Text className="text-sm font-inter text-slate-500 mt-1">
            {activeCategory === 'ai' 
              ? 'Phần quà độc quyền khi đặt mua sản phẩm từ danh sách gợi ý AI'
              : 'Lưu mã ngay để nhận ưu đãi cực hời khi mua sắm'}
          </Text>
        </View>

        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator color={activeCategory === 'ai' ? '#8B5CF6' : '#16A34A'} />
            <Text className="mt-4 text-slate-500 font-inter">Đang tải mã giảm giá...</Text>
          </View>
        ) : isError ? (
          <View className="py-16 items-center justify-center bg-white rounded-[32px] border border-red-100 shadow-sm">
            <Text className="text-red-600 font-outfit-bold text-[16px]">Lỗi tải mã giảm giá</Text>
            <Text className="text-slate-400 font-inter text-center mt-2 px-10 text-[12.5px] leading-5">
              Đã xảy ra sự cố khi kết nối với máy chủ. Vui lòng thử lại sau.
            </Text>
            <Pressable
              onPress={() => {
                void vouchersQuery.refetch();
                void claimedVouchersQuery.refetch();
              }}
              className="mt-4 px-6 py-2.5 bg-primary rounded-xl"
            >
              <Text className="text-white font-outfit-bold text-[12px]">Tải lại</Text>
            </Pressable>
          </View>
        ) : activeVouchers.length === 0 ? (
          <View className="py-16 items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4" style={{ position: 'relative' }}>
              <View 
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  right: -8,
                  bottom: -8,
                  borderRadius: 999,
                  borderWidth: 1.2,
                  borderColor: '#E2E8F0',
                  borderStyle: 'dashed',
                  opacity: 0.8
                }}
              />
              <BellOff size={28} color="#94A3B8" />
            </View>
            <Text className="text-slate-900 font-outfit-bold text-[16px]">Chưa có mã giảm giá nào</Text>
            <Text className="text-slate-400 font-inter text-center mt-2 px-10 text-[12.5px] leading-5">
              {activeCategory === 'ai'
                ? 'Mua sắm thông qua danh sách gợi ý của Trợ lý AI để được tặng voucher đặc quyền ngay!'
                : 'Hiện tại chưa có mã giảm giá nào khả dụng. Hãy quay lại sau nhé!'}
            </Text>
          </View>
        ) : (
          <View className="pb-10">
            {activeVouchers.map((v) => {
              const isAi = v.revealTrigger === 'AI_ORDER_COMPLETED';
              const isClaimed = claimedVoucherIds.has(v.id) || v.claimed === true;
              const cardBorderColor = isAi ? 'border-purple-200 bg-purple-50/10' : 'border-slate-100 bg-white';
              const tagColor = isAi ? '#8B5CF6' : '#16A34A';
              const tagBg = isAi ? 'bg-purple-100/50' : 'bg-emerald-50';
              const buttonBg = isAi ? 'bg-purple-600' : 'bg-[#16A34A]';

              return (
                <View 
                  key={v.id} 
                  className={`mb-4.5 rounded-3xl overflow-hidden border shadow-sm flex-row ${cardBorderColor}`}
                  style={{
                    shadowColor: isAi ? '#8B5CF6' : '#94A3B8',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isAi ? 0.05 : 0.02,
                    shadowRadius: 12,
                    elevation: 2
                  }}
                >
                  {/* Left Color Indicator Bar */}
                  <View className={`w-2 ${isAi ? 'bg-purple-500' : 'bg-[#16A34A]'}`} />
                  
                  {/* Card Content */}
                  <View className="flex-1 p-4 flex-row items-center">
                    {/* Left Icon */}
                    <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 ${tagBg}`}>
                      {isAi ? (
                        <Sparkles size={20} color={tagColor} strokeWidth={2} />
                      ) : (
                        <Ticket size={20} color={tagColor} strokeWidth={2} />
                      )}
                    </View>
                    
                    {/* Voucher Details */}
                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap">
                        <Text className="text-[16px] font-outfit-bold text-slate-900">
                          {formatDiscount(v.discountValue, v.discountType)}
                        </Text>
                        {isClaimed && (
                          <View className="ml-2 px-2 py-0.5 bg-emerald-100 rounded-full border border-emerald-200">
                            <Text className="text-[8.5px] font-outfit-bold text-emerald-700 uppercase tracking-wider">Đã lưu</Text>
                          </View>
                        )}
                        {isAi && (
                          <View className="ml-2 px-2 py-0.5 bg-purple-100 rounded-full border border-purple-200">
                            <Text className="text-[8.5px] font-outfit-bold text-purple-700 uppercase tracking-wider">AI Gift</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text className="text-[12px] font-inter text-slate-500 mt-1 leading-4">
                        {v.description || formatMinOrder(v.minOrderAmount)}
                      </Text>
                      
                      <Text className="text-[10.5px] font-inter text-slate-400 mt-1">
                        Hạn dùng: {v.validUntil ? new Date(v.validUntil).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </Text>
                    </View>

                    {/* Copy Button */}
                    <Pressable 
                      onPress={() => handleClaim(v.id)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                      className={`px-4 py-2.5 rounded-2xl flex-row items-center ${isClaimed ? 'bg-emerald-50 border border-emerald-200' : buttonBg}`}
                      disabled={claimingVoucherId === v.id || isClaimed}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 size={13} color="#059669" />
                          <Text className="text-emerald-700 font-outfit-bold text-[11.5px] ml-1">Đã lưu</Text>
                        </>
                      ) : claimingVoucherId === v.id ? (
                        <>
                          <LockKeyhole size={13} color="#FFF" />
                          <Text className="text-white font-outfit-bold text-[11.5px] ml-1">Đang lưu</Text>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} color="#FFF" />
                          <Text className="text-white font-outfit-bold text-[11.5px] ml-1">Lưu mã</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
