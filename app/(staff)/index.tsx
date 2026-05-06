import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, ClipboardList, Clock, User, TrendingUp, Inbox, AlertCircle, BookOpen, CalendarDays, Bell, Home, MessageCircle, Search, MoreHorizontal } from 'lucide-react-native';
import Card from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/authStore';
import { staffOrdersApi } from '../../src/api/staffOrders';
import { staffIssuesApi } from '../../src/api/staffIssues';
import { useStaffHomeStore } from '../../src/store/staffHomeStore';
import { useStaffOrdersStore } from '../../src/store/staffOrdersStore';

export default function StaffHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const promoIndex = useStaffHomeStore((s) => s.promoIndex);
  const setPromoIndex = useStaffHomeStore((s) => s.setPromoIndex);

  const queueQuery = useQuery({
    queryKey: ['staff-order-queue'],
    queryFn: () => staffOrdersApi.getQueue(),
    staleTime: 5000,
  });

  const myActiveQuery = useQuery({
    queryKey: ['staff-order-my-active'],
    queryFn: () => staffOrdersApi.getMyActive(),
    staleTime: 5000,
  });

  const issuesQuery = useQuery({
    queryKey: ['staff-issues-my'],
    queryFn: () => staffIssuesApi.my(),
    staleTime: 5000,
  });

  

  

  const openIssuesCount = useMemo(() => {
    const list = issuesQuery.data ?? [];
    return list.filter((x) => (x.status ?? '').toUpperCase() === 'OPEN').length;
  }, [issuesQuery.data]);

  const notificationsQuery = useQuery({
    queryKey: ['staff-notifications'],
    queryFn: () => Promise.resolve([] as any[]),
    staleTime: 5000,
  });

  const queueCount = queueQuery.data?.length ?? 0;
  const unreadNotifications = (notificationsQuery.data ?? []).length;
  const hasActive = Boolean(myActiveQuery.data);

  const todayLabel = useMemo(() => new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }), []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="flex-row items-start justify-between">
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text className="text-xs font-inter text-muted">{todayLabel}</Text>
            <Text className="mt-1 text-2xl font-outfit-bold text-text" numberOfLines={1}>
              Xin chào, {user?.fullName ?? 'nhân viên'}
            </Text>
          </View>
          <View className="flex-row" style={{ gap: 12 }}>
            <Pressable onPress={() => router.push('/(staff)/notifications' as never)} className="w-12 h-12 rounded-2xl bg-[#16A34A] items-center justify-center relative" testID="btn-notifications">
              <Bell size={20} color="#FFFFFF" />
              {unreadNotifications > 0 && (
                <View className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              )}
            </Pressable>
            <View className="w-12 h-12 rounded-2xl bg-[#16A34A] items-center justify-center">
              <TrendingUp size={20} color="#FFFFFF" />
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-[28px] overflow-hidden" style={{ backgroundColor: '#EAF8F0' }}>
          <View
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: '#EAF8F0',
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: -40,
              top: -30,
              width: 160,
              height: 160,
              borderRadius: 999,
              backgroundColor: 'rgba(22, 163, 74, 0.16)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: -20,
              bottom: -40,
              width: 120,
              height: 120,
              borderRadius: 999,
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
            }}
          />
          <View className="flex-row items-center justify-between px-5 py-5">
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text className="text-[20px] font-outfit-bold text-[#0F172A]">Nâng cao hiệu suất làm việc của bạn</Text>
              <Text className="mt-2 text-[13px] font-inter text-[#64748B]">Theo dõi nhanh đơn hàng, chấm công và hiệu suất mỗi ngày.</Text>
            </View>
            <View style={{ width: 106, height: 106, justifyContent: 'center', alignItems: 'center' }}>
              <View
                style={{
                  position: 'absolute',
                  right: 6,
                  top: 0,
                  width: 86,
                  height: 86,
                  borderRadius: 999,
                  backgroundColor: 'rgba(255,255,255,0.55)',
                }}
              />
              <TrendingUp size={58} color="#16A34A" strokeWidth={2.2} />
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row" style={{ gap: 12 }}>
          <StatPill testID="stat-queue" icon={<Inbox size={18} color="#16A34A" />} label="Hàng chờ" value={String(queueCount)} onPress={() => { useStaffOrdersStore.getState().setView('QUEUE'); router.push('/(staff)/orders' as never); }} />
          <StatPill testID="stat-active" icon={<ClipboardList size={18} color="#16A34A" />} label="Đang xử lý" value={hasActive ? '1' : '0'} onPress={() => { useStaffOrdersStore.getState().setView('MY_ACTIVE'); router.push('/(staff)/orders' as never); }} />
          <StatPill testID="stat-issues" icon={<AlertCircle size={18} color="#16A34A" />} label="Sự cố" value={String(openIssuesCount)} onPress={() => router.push('/(staff)/issues' as never)} />
        </View>

        <View className="mt-6">
          <Text className="text-sm font-inter-bold text-text">Truy cập nhanh</Text>
          <View className="mt-3" style={{ gap: 12 }}>
            <View className="flex-row" style={{ gap: 12 }}>
              <QuickAction icon={<Package size={24} color="#16A34A" />} title="Sản phẩm" subtitle="Tra cứu nhanh" onPress={() => router.push('/(staff)/products' as never)} />
              <QuickAction icon={<ClipboardList size={24} color="#16A34A" />} title="Đơn hàng" subtitle="Nhận & theo dõi" onPress={() => router.push('/(staff)/orders' as never)} />
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <QuickAction icon={<Clock size={24} color="#16A34A" />} title="Chấm công" subtitle="Vào ca / ra ca" onPress={() => router.push('/(staff)/attendance' as never)} />
              <QuickAction icon={<User size={24} color="#16A34A" />} title="Cá nhân" subtitle="Tài khoản & tuỳ chọn" onPress={() => router.push('/(staff)/profile' as never)} />
            </View>
          </View>
        </View>

        <View className="mt-6">
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <View className="w-10 h-10 rounded-2xl bg-[#DFF5E8] items-center justify-center">
                  <BookOpen size={18} color="#16A34A" />
                </View>
                <View>
                  <Text className="text-[15px] font-inter-bold text-text">Sổ tay công việc</Text>
                  <Text className="text-[13px] font-inter text-muted mt-0.5">Hướng dẫn nhanh theo từng nhóm tác vụ.</Text>
                </View>
              </View>
              <Pressable testID="btn-handbook" onPress={() => router.push('/(staff)/handbook' as never)} className="px-3 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                <Text className="text-xs font-inter-bold text-text">Mở</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        <View className="mt-6">
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <View className="w-10 h-10 rounded-2xl bg-[#DFF5E8] items-center justify-center">
                  <CalendarDays size={18} color="#16A34A" />
                </View>
                <View>
                  <Text className="text-[15px] font-inter-bold text-text">Hiệu suất công việc</Text>
                  <Text className="text-[13px] font-inter text-muted mt-0.5">Theo dõi đơn hoàn thành theo ngày/tuần/tháng.</Text>
                </View>
              </View>
              <Pressable testID="btn-performance" onPress={() => router.push('/(staff)/performance' as never)} className="px-3 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                <Text className="text-xs font-inter-bold text-text">Xem</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        {queueQuery.isError || myActiveQuery.isError || issuesQuery.isError ? (
          <Card className="p-4 mt-6">
            <Text className="font-inter-bold text-text">Không tải được dữ liệu.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Kiểm tra mạng và thử lại.</Text>
            <Pressable
              onPress={() => {
                void queueQuery.refetch();
                void myActiveQuery.refetch();
                void issuesQuery.refetch();
              }}
              className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
            >
              <Text className="font-outfit-bold text-primary-fg">Tải lại</Text>
            </Pressable>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ icon, label, value, onPress, testID }: { icon: React.ReactNode; label: string; value: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} className="flex-1 bg-[#EAF8F0] border border-[#D6EFD9] rounded-[22px] px-3 py-4">
      <View className="items-start justify-between" style={{ minHeight: 72 }}>
        <View className="w-10 h-10 rounded-2xl bg-[#DFF5E8] items-center justify-center">
          {icon}
        </View>
        <View className="mt-2 w-full flex-row items-end justify-between">
          <Text className="text-[14px] font-inter-bold text-[#0F172A]">{label}</Text>
          <Text className="text-[26px] leading-7 font-outfit-bold text-[#0F172A]">{value}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function PromoCard({ title, subtitle, active, onPress }: { title: string; subtitle: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 280 }} className={active ? 'bg-surface border border-primary rounded-3xl p-4' : 'bg-surface border border-border rounded-3xl p-4'}>
      <Text className="font-outfit-bold text-text">{title}</Text>
      <Text className="text-xs font-inter text-muted mt-1">{subtitle}</Text>
    </Pressable>
  );
}

function QuickAction({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 bg-white border border-[#E5E7EB] rounded-[26px] p-4 shadow-sm" style={{ elevation: 2 }}>
      <View className="w-12 h-12 rounded-2xl bg-[#DFF5E8] items-center justify-center">{icon}</View>
      <Text className="mt-3 text-[16px] font-outfit-bold text-[#0F172A]">{title}</Text>
      <Text className="mt-1 text-[13px] font-inter text-[#64748B]">{subtitle}</Text>
    </Pressable>
  );
}

