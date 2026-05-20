import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import Card from '../../../src/components/ui/Card';
import { Order } from '../../../src/types/order';
import { useOrders } from '../../../src/hooks/useOrders';
import { 
  ShoppingBag, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  RefreshCw,
  Search
} from 'lucide-react-native';
import { clsx } from 'clsx';
import { resolveImageUrl } from '../../../src/utils/imageUtils';

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả', icon: ShoppingBag, color: '#64748B' },
  { id: 'PREPARING', label: 'Đang chuẩn bị', icon: Package, color: '#3B82F6' },
  { id: 'SHIPPED', label: 'Đang giao', icon: Truck, color: '#8B5CF6' },
  { id: 'DELIVERED', label: 'Đã giao', icon: CheckCircle2, color: '#16A34A' },
  { id: 'CANCELLED', label: 'Đã hủy', icon: XCircle, color: '#EF4444' },
];

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDING: { label: 'Chờ xử lý', icon: Clock, color: '#EAB308', bg: '#FEF9C3' },
  ASSIGNED: { label: 'Đã tiếp nhận', icon: Package, color: '#3B82F6', bg: '#DBEAFE' },
  PICKING: { label: 'Đang lấy hàng', icon: Package, color: '#3B82F6', bg: '#DBEAFE' },
  PICKED: { label: 'Đã soạn xong', icon: Package, color: '#3B82F6', bg: '#DBEAFE' },
  READY_TO_SHIP: { label: 'Đã đóng gói', icon: Package, color: '#3B82F6', bg: '#DBEAFE' },
  SHIPPED: { label: 'Đang giao', icon: Truck, color: '#8B5CF6', bg: '#EDE9FE' },
  DELIVERING: { label: 'Đang giao', icon: Truck, color: '#8B5CF6', bg: '#EDE9FE' },
  DELIVERED: { label: 'Đã giao', icon: CheckCircle2, color: '#16A34A', bg: '#DCFCE7' },
  CANCELLED: { label: 'Đã hủy', icon: XCircle, color: '#EF4444', bg: '#FEE2E2' },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isLoading, isError, refetch } = useOrders();
  const [activeTab, setActiveTab] = useState('ALL');

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filteredOrders = useMemo(() => {
    const list = orders || [];
    if (activeTab === 'ALL') return list;
    if (activeTab === 'PREPARING') {
      return list.filter(o => ['PENDING', 'ASSIGNED', 'PICKING', 'PICKED', 'READY_TO_SHIP'].includes(o.status));
    }
    if (activeTab === 'SHIPPED') {
      return list.filter(o => ['SHIPPED', 'DELIVERING'].includes(o.status));
    }
    return list.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  const renderItem = ({ item }: { item: Order }) => {
    const status = STATUS_MAP[item.status] || { label: item.status, icon: ShoppingBag, color: '#64748B', bg: '#F1F5F9' };
    const firstItem = item.items && item.items.length > 0 ? item.items[0] : null;
    const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <Pressable 
        onPress={() => router.push(`/(customer)/orders/${item.id}` as never)}
        className="active:opacity-70 transition-opacity"
      >
        <Card className="mb-4 p-4 border border-slate-50 bg-white rounded-[28px] shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <View className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
               <Text className="text-[10px] font-inter-bold text-slate-400 uppercase tracking-tighter">
                 #{item.orderNumber}
               </Text>
            </View>
            <View 
              className="flex-row items-center px-3 py-1 rounded-full" 
              style={{ backgroundColor: status.bg }}
            >
              <status.icon size={12} color={status.color} />
              <Text 
                className="text-[10px] font-inter-bold ml-1.5"
                style={{ color: status.color }}
              >
                {status.label}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            {/* First Item Image Preview */}
            <View className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
              {firstItem?.imageUrl ? (
                <Image
                  source={{ uri: resolveImageUrl(firstItem.imageUrl, firstItem.productName) ?? undefined }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-slate-100">
                   <ShoppingBag size={20} color="#CBD5E1" />
                </View>
              )}
            </View>

            <View className="flex-1 ml-4 justify-center">
              <Text className="text-[15px] font-outfit-bold text-slate-900" numberOfLines={1}>
                {firstItem ? firstItem.productName : 'Đơn hàng'}
                {(item.items ?? []).length > 1 ? ` (+${(item.items ?? []).length - 1} món khác)` : ''}
              </Text>
              <Text className="text-[11px] font-inter text-slate-400 mt-1">
                {dateStr}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-[16px] font-outfit-bold text-primary">
                {(item.totalAmount ?? 0).toLocaleString('vi-VN')}₫
              </Text>
              <ChevronRight size={16} color="#CBD5E1" className="mt-1" />
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFBFC]">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Đơn hàng của bạn',
          headerStyle: { backgroundColor: '#FBFBFC' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 20 },
          headerShadowVisible: false,
        }}
      />

      {/* ───── Status Filter Tabs ───── */}
      <View className="pt-2 pb-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        >
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex-row items-center px-4 py-2.5 rounded-full border",
                  active ? "bg-primary border-primary" : "bg-white border-slate-100"
                )}
                style={active ? { shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 } : {}}
              >
                <tab.icon size={16} color={active ? "#FFF" : tab.color} />
                <Text 
                  className={clsx(
                    "ml-2 text-[13px] font-inter-bold",
                    active ? "text-white" : "text-slate-600"
                  )}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="flex-1 px-5">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
             <ActivityIndicator color="#16A34A" />
             <Text className="text-[12px] font-inter text-slate-400 mt-2">Đang tải đơn hàng...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          <FlashList
            data={filteredOrders}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            estimatedItemSize={120}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-24 h-24 bg-slate-100 rounded-full items-center justify-center mb-4">
              <ShoppingBag size={40} color="#CBD5E1" />
            </View>
            <Text className="text-lg font-outfit-bold text-slate-900">
              {activeTab === 'ALL' ? 'Chưa có đơn hàng nào' : `Không có đơn hàng ${activeTab.toLowerCase()}`}
            </Text>
            <Text className="text-sm font-inter text-slate-400 text-center mt-2 px-10">
              {isError ? 'Đã có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.' : 'Hãy mua sắm để lấp đầy lịch sử đơn hàng của bạn!'}
            </Text>
            <Pressable 
              onPress={() => isError ? refetch() : router.push('/(customer)/(tabs)/shop' as never)}
              className="mt-6 px-8 py-3 bg-primary rounded-2xl flex-row items-center"
            >
              {isError && <RefreshCw size={16} color="#FFF" className="mr-2" />}
              <Text className="text-white font-inter-bold">{isError ? 'Thử lại' : 'Mua sắm ngay'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
