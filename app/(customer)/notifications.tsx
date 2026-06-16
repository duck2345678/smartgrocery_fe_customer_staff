import React, { useState, useMemo } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft,
  CheckCheck,
  Info,
  BellOff,
  ShoppingBag,
  Clock,
  Sparkles
} from 'lucide-react-native';
import Card from '../../src/components/ui/Card';
import { notificationsApi, Notification } from '../../src/api/notifications';

const isOrderNotification = (item: Notification) =>
  item.notificationType === 'ORDER_STATUS' ||
  item.notificationType === 'NEW_ORDER' ||
  item.notificationType === 'NEW_ORDER_ASSIGNED';

const resolveCustomerNotificationRoute = (item: Notification) => {
  if (typeof item.route === 'string' && item.route.startsWith('/')) {
    return item.route;
  }
  if (isOrderNotification(item) && item.orderId) {
    return `/(customer)/orders/${item.orderId}`;
  }
  if (isOrderNotification(item)) {
    return '/(customer)/orders';
  }
  return null;
};

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return `${diffDays} ngày trước`;
};

export default function CustomerNotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationPress = (item: Notification) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }

    const targetRoute = resolveCustomerNotificationRoute(item);
    if (targetRoute) {
      router.push(targetRoute as any);
    }
  };

  const notifications = notificationsQuery.data || [];
  const isLoading = notificationsQuery.isLoading;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  }, [notifications, activeTab]);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Thông báo', headerShown: false }} />

      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-[#F1F5F9] bg-white">
        <View className="flex-row items-center">
          <Pressable 
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
          >
            <ChevronLeft size={20} color="#1E293B" />
          </Pressable>
          <View className="ml-4">
            <Text className="text-[17px] font-outfit-bold text-[#1E293B]">Thông báo</Text>
            <Text className="text-[11px] font-inter text-slate-400">Tin nhắn & Đơn hàng</Text>
          </View>
        </View>

        {unreadCount > 0 && (
          <Pressable 
            onPress={() => markAllReadMutation.mutate()}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="flex-row items-center px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm shadow-emerald-50"
          >
            {markAllReadMutation.isPending ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <CheckCheck size={15} color="#10B981" />
                <Text className="text-[12px] font-outfit-bold text-[#10B981] ml-1.5">Đọc tất cả</Text>
              </>
            )}
          </Pressable>
        )}
      </View>

      {/* Tab Filter */}
      <View className="px-6 py-3.5 flex-row bg-white border-b border-[#F1F5F9]">
        <View className="flex-1 flex-row bg-[#F1F5F9] p-1 rounded-2xl" style={{ gap: 4 }}>
          <Pressable 
            onPress={() => setActiveTab('all')}
            className="flex-1 py-2.5 rounded-xl items-center justify-center"
            style={[
              activeTab === 'all' && {
                backgroundColor: '#FFFFFF',
                shadowColor: '#94A3B8',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }
            ]}
          >
            <Text className={`text-[12.5px] ${activeTab === 'all' ? 'font-outfit-bold text-slate-800' : 'font-inter text-slate-500'}`}>
              Tất cả ({notifications.length})
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('unread')}
            className="flex-1 py-2.5 rounded-xl items-center justify-center"
            style={[
              activeTab === 'unread' && {
                backgroundColor: '#FFFFFF',
                shadowColor: '#94A3B8',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }
            ]}
          >
            <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
              {unreadCount > 0 && <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              <Text className={`text-[12.5px] ${activeTab === 'unread' ? 'font-outfit-bold text-slate-800' : 'font-inter text-slate-500'}`}>
                Chưa đọc ({unreadCount})
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-[13px] font-inter text-muted mt-3">Đang tải thông báo...</Text>
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8 py-20">
          <View className="w-24 h-24 rounded-full bg-slate-50 items-center justify-center mb-6" style={{ position: 'relative' }}>
            <View 
              style={{
                position: 'absolute',
                top: -12,
                left: -12,
                right: -12,
                bottom: -12,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                borderStyle: 'dashed',
                opacity: 0.8
              }}
            />
            <BellOff size={36} color="#94A3B8" strokeWidth={1.5} />
          </View>
          <Text className="text-[17px] font-outfit-bold text-slate-800 text-center">Hộp thư trống</Text>
          <Text className="text-[13px] font-inter text-slate-400 text-center mt-2.5 px-6 leading-5">
            {activeTab === 'unread' 
              ? 'Tuyệt vời! Bạn đã đọc hết tất cả các thông báo.'
              : 'Bạn chưa có thông báo nào. Các cập nhật mới về đơn hàng hoặc ưu đãi sẽ hiển thị tại đây.'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16 }}>
          <View className="px-4 gap-y-3.5">
            {filteredNotifications.map((item) => {
              const isOrder = isOrderNotification(item);
              const isShift = item.notificationType === 'SHIFT_UPDATE';
              
              let Icon = Info;
              let iconBg = '#EFF6FF';
              let iconColor = '#3B82F6';

              if (isOrder) {
                Icon = ShoppingBag;
                iconBg = '#EAF8F0';
                iconColor = '#10B981';
              } else if (isShift) {
                Icon = Clock;
                iconBg = '#FFF7ED';
                iconColor = '#EA580C';
              }

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleNotificationPress(item)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
                >
                  <View 
                    className={`p-4 rounded-[26px] border ${
                      item.isRead 
                        ? 'bg-white border-[#F1F5F9]' 
                        : 'bg-[#F0FDF4]/70 border-[#A7F3D0]'
                    }`}
                    style={{
                      shadowColor: item.isRead ? '#000' : '#10B981',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: item.isRead ? 0.02 : 0.05,
                      shadowRadius: 12,
                      elevation: item.isRead ? 1 : 2,
                    }}
                  >
                    <View className="flex-row items-start">
                      {/* Left Icon Panel */}
                      <View 
                        className="w-11 h-11 rounded-2xl items-center justify-center mr-3.5 shadow-sm" 
                        style={{ backgroundColor: iconBg, shadowColor: iconColor, shadowOpacity: 0.1, shadowRadius: 4, elevation: 1 }}
                      >
                        <Icon size={19} color={iconColor} strokeWidth={2.2} />
                      </View>

                      {/* Notification Info */}
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between">
                          <Text 
                            className={`flex-1 text-[14px] leading-5 text-slate-800 ${
                              !item.isRead ? 'font-outfit-bold text-[#047857]' : 'font-inter-bold'
                            }`}
                          >
                            {item.title}
                          </Text>
                          {!item.isRead && (
                            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2 mt-1 shadow-sm shadow-emerald-400" />
                          )}
                        </View>
                        
                        <Text className="text-[12.5px] font-inter text-slate-600 mt-1 leading-5">
                          {item.message}
                        </Text>
                        
                        <View className="flex-row items-center justify-between mt-2.5">
                          <Text className="text-[11px] font-inter text-slate-400">
                            {formatTimeAgo(item.createdAt)}
                          </Text>
                          {!item.isRead && (
                            <Text className="text-[10px] font-outfit-bold text-[#10B981] uppercase tracking-wider">Mới</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
