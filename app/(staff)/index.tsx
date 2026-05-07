import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Package, ClipboardList, Clock, User, TrendingUp, BookOpen, CalendarDays, ChevronRight, DollarSign, ShieldCheck, ShieldAlert } from 'lucide-react-native';
import Card from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/authStore';
import { staffOrdersApi } from '../../src/api/staffOrders';
import { getTodayStatus } from '../../src/api/staffAttendance';
import { useStaffHomeStore } from '../../src/store/staffHomeStore';
import { formatVND, getCurrentMonthPayslip } from '../../src/utils/staffPayslip';

export default function StaffHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const selectedDateIso = useStaffHomeStore((s) => s.selectedDateIso);

  const myActiveQuery = useQuery({
    queryKey: ['staff-order-my-active'],
    queryFn: () => staffOrdersApi.getMyActive(),
    staleTime: 5000,
  });

  const todayIso = useMemo(() => toIsoLocal(new Date()), []);

  const performanceDailyQuery = useQuery({
    queryKey: ['staff-performance-daily', todayIso],
    queryFn: () => staffOrdersApi.getPerformanceDaily(todayIso),
    staleTime: 30 * 1000,
  });

  const performanceSummaryQuery = useQuery({
    queryKey: ['staff-performance-summary', todayIso],
    queryFn: () => staffOrdersApi.getPerformanceSummary(todayIso),
    staleTime: 30 * 1000,
  });

  const attendanceQuery = useQuery({
    queryKey: ['staff-attendance-today'],
    queryFn: () => getTodayStatus(),
  });
  const currentPayslip = useMemo(() => getCurrentMonthPayslip(), []);

  const refreshKpis = useCallback(() => {
    void myActiveQuery.refetch();
    void performanceDailyQuery.refetch();
    void performanceSummaryQuery.refetch();
    void attendanceQuery.refetch();
  }, [myActiveQuery, performanceDailyQuery, performanceSummaryQuery, attendanceQuery]);

  useFocusEffect(
    useCallback(() => {
      refreshKpis();
    }, [refreshKpis])
  );

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

  const performanceDailyCount = performanceDailyQuery.data?.completedCount ?? null;
  const performanceWeekCount = performanceSummaryQuery.data?.weekCompletedCount ?? null;
  const performanceMonthCount = performanceSummaryQuery.data?.monthCompletedCount ?? null;

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
          <StatPill 
            testID="stat-attendance" 
            icon={isClockedIn ? <ShieldCheck size={18} color="#16A34A" /> : <ShieldAlert size={18} color="#F59E0B" />} 
            label="Trạng thái" 
            value={isClockedIn ? 'Sẵn sàng' : 'Chưa vào ca'} 
            onPress={() => {}} 
          />
          <StatPill testID="stat-salary" icon={<DollarSign size={18} color="#16A34A" />} label="Lương tháng này" value={formatVND(currentPayslip.calc.netPay)} onPress={() => router.push('/(staff)/profile/payslip' as never)} />
        </View>

        <View className="mt-6">
          <Text className="text-sm font-inter-bold text-text">Truy cập nhanh</Text>
          <View className="mt-3" style={{ gap: 12 }}>
            <View className="flex-row" style={{ gap: 12 }}>
              <QuickAction icon={<Package size={24} color="#16A34A" />} title="Sản phẩm" subtitle="Tra cứu nhanh" onPress={() => router.push('/(staff)/products' as never)} />
              <QuickAction icon={<ClipboardList size={24} color="#16A34A" />} title="Đơn hàng" subtitle="Xử lý & Giao hàng" onPress={() => router.push('/(staff)/orders' as never)} />
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <QuickAction icon={<Clock size={24} color="#16A34A" />} title="Chấm công" subtitle="Vào ca / ra ca" onPress={() => router.push('/(staff)/attendance' as never)} />
              <QuickAction icon={<User size={24} color="#16A34A" />} title="Cá nhân" subtitle="Tài khoản & tuỳ chọn" onPress={() => router.push('/(staff)/profile' as never)} />
            </View>
          </View>
        </View>

        <View className="mt-6">
          <Pressable testID="btn-handbook" onPress={() => router.push('/(staff)/handbook' as never)}>
            <Card className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
                  <View className="w-10 h-10 rounded-2xl bg-[#DFF5E8] items-center justify-center">
                    <BookOpen size={18} color="#16A34A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-inter-bold text-text">Sổ tay công việc</Text>
                    <Text className="text-[13px] font-inter text-muted mt-0.5" numberOfLines={1}>Hướng dẫn nhanh theo từng nhóm tác vụ.</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#94A3B8" />
              </View>
            </Card>
          </Pressable>
        </View>

        <View className="mt-6">
          <Pressable testID="btn-performance" onPress={() => router.push('/(staff)/performance' as never)}>
            <Card className="p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
                  <View className="w-10 h-10 rounded-2xl bg-[#DFF5E8] items-center justify-center">
                    <CalendarDays size={18} color="#16A34A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-inter-bold text-text">Hiệu suất công việc</Text>
                    <Text className="text-[13px] font-inter text-muted mt-0.5" numberOfLines={1}>Theo dõi đơn hoàn thành theo ngày/tuần/tháng.</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#94A3B8" />
              </View>

              <View className="mt-4 flex-row" style={{ gap: 10 }}>
                <MiniKpi
                  label="Hôm nay"
                  value={performanceDailyQuery.isLoading ? '...' : String(performanceDailyCount ?? '—')}
                  hint={performanceDailyQuery.isError ? 'Lỗi tải dữ liệu' : 'Đơn hoàn thành'}
                />
                <MiniKpi
                  label="Tuần này"
                  value={performanceSummaryQuery.isLoading ? '...' : String(performanceWeekCount ?? '—')}
                  hint={performanceSummaryQuery.isError ? 'Lỗi tải dữ liệu' : 'Đơn hoàn thành'}
                />
                <MiniKpi
                  label="Tháng này"
                  value={performanceSummaryQuery.isLoading ? '...' : String(performanceMonthCount ?? '—')}
                  hint={performanceSummaryQuery.isError ? 'Lỗi tải dữ liệu' : 'Đơn hoàn thành'}
                />
              </View>
            </Card>
          </Pressable>
        </View>

        {myActiveQuery.isError || performanceDailyQuery.isError || performanceSummaryQuery.isError ? (
          <Card className="p-4 mt-6">
            <Text className="font-inter-bold text-text">Không tải được dữ liệu.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Kiểm tra mạng và thử lại.</Text>
            <Pressable
              onPress={refreshKpis}
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
        <View className="mt-2 w-full flex-col">
          <Text className="text-[13px] font-inter-bold text-[#0F172A]" numberOfLines={1}>{label}</Text>
          <Text className="text-[14px] leading-5 font-outfit-bold text-[#0F172A] mt-1" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        </View>
      </View>
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

function MiniKpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-3">
      <Text className="text-[11px] font-inter text-muted">{label}</Text>
      <Text className="mt-1 text-[20px] leading-6 font-outfit-bold text-[#0F172A]">{value}</Text>
      <Text className="mt-1 text-[10px] font-inter text-[#64748B]" numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

function toIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
