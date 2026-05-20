import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { orderApi } from '../../src/api/orders';
import { ChevronLeft, Ticket, Copy, CheckCircle2, Sparkles, Tag, BellOff } from 'lucide-react-native';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';

export default function VouchersPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'regular' | 'ai'>('regular');

  const vouchersQuery = useQuery({
    queryKey: ['available-vouchers'],
    queryFn: () => orderApi.getAvailableVouchers(),
  });

  const copyToClipboard = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const vouchers = vouchersQuery.data ?? [];

  const regularVouchers = vouchers.filter(v => v.revealTrigger !== 'AI_ORDER_COMPLETED');
  const aiVouchers = vouchers.filter(v => v.revealTrigger === 'AI_ORDER_COMPLETED');

  const activeVouchers = activeCategory === 'ai' ? aiVouchers : regularVouchers;

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
            className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${activeCategory === 'regular' ? 'bg-white shadow-sm shadow-slate-200' : ''}`}
            style={{ gap: 6 }}
          >
            <Tag size={15} color={activeCategory === 'regular' ? '#16A34A' : '#64748B'} />
            <Text className={`text-[12.5px] ${activeCategory === 'regular' ? 'font-outfit-bold text-slate-800' : 'font-inter text-slate-500'}`}>
              Voucher thường ({regularVouchers.length})
            </Text>
          </Pressable>
          
          <Pressable 
            onPress={() => setActiveCategory('ai')}
            className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${activeCategory === 'ai' ? 'bg-white shadow-sm shadow-slate-200 border border-purple-100/50' : ''}`}
            style={{ gap: 6 }}
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

        {vouchersQuery.isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator color={activeCategory === 'ai' ? '#8B5CF6' : '#16A34A'} />
            <Text className="mt-4 text-slate-500 font-inter">Đang tải mã giảm giá...</Text>
          </View>
        ) : activeVouchers.length === 0 ? (
          <View className="py-16 items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4" style={{ position: 'relative' }}>
              <View 
                style={{
                  position: 'absolute',
                  inset: -8,
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
                          Giảm {v.discountType === 'PERCENT' || v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `${(v.discountValue).toLocaleString('vi-VN')}₫`}
                        </Text>
                        {isAi && (
                          <View className="ml-2 px-2 py-0.5 bg-purple-100 rounded-full border border-purple-200">
                            <Text className="text-[8.5px] font-outfit-bold text-purple-700 uppercase tracking-wider">AI Gift</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text className="text-[12px] font-inter text-slate-500 mt-1 leading-4">
                        {v.description || `Đơn tối thiểu ${v.minOrderAmount?.toLocaleString('vi-VN')}₫`}
                      </Text>
                      
                      <Text className="text-[10.5px] font-inter text-slate-400 mt-1">
                        Hạn dùng: {v.validUntil ? new Date(v.validUntil).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                      </Text>
                    </View>

                    {/* Copy Button */}
                    <Pressable 
                      onPress={() => copyToClipboard(v.voucherCode)}
                      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                      className={`px-4 py-2.5 rounded-2xl flex-row items-center ${
                        copiedCode === v.voucherCode 
                          ? (isAi ? 'bg-purple-50 border border-purple-200' : 'bg-emerald-50 border border-emerald-200') 
                          : buttonBg
                      }`}
                    >
                      {copiedCode === v.voucherCode ? (
                        <>
                          <CheckCircle2 size={13} color={isAi ? '#7C3AED' : '#059669'} />
                          <Text className={`font-outfit-bold text-[11.5px] ml-1 ${isAi ? 'text-purple-700' : 'text-emerald-700'}`}>Đã lưu</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={13} color="#FFF" />
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
