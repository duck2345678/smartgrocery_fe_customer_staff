import React, { useState, useMemo } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeft,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  DollarSign
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/store/authStore';
import * as staffAttendanceApi from '../../../src/api/staffAttendance';

const HOURLY_RATE = 30000;

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
};

export default function PayslipScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Dynamic past 6 months selector options
  const MONTHS_LIST = useMemo(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        label: `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`,
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      });
    }
    return list;
  }, []);

  // Fetch Monthly Stats
  const statsQuery = useQuery({
    queryKey: ['staff-attendance-stats', selectedYear, selectedMonth],
    queryFn: () => staffAttendanceApi.getMonthlyStats(selectedYear, selectedMonth),
  });

  const stats = statsQuery.data;
  const isLoading = statsQuery.isLoading;

  // Salary breakdown calculations
  const totalHours = stats ? Math.round(stats.totalWorkedMinutes / 60 * 10) / 10 : 0;
  const grossPay = (stats?.totalWorkedMinutes || 0) / 60 * HOURLY_RATE;
  const deduction = (stats?.lateCheckIns || 0) * (8 * HOURLY_RATE * 0.5); // 120k penalty per late day
  const netPay = Math.max(0, grossPay - deduction);
  
  const lateDays = stats?.lateCheckIns || 0;
  const onTimeDays = stats?.attendedDays ? Math.max(0, stats.attendedDays - lateDays) : 0;
  const absentDays = stats?.absentDays || 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Phiếu báo lương', headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-[#F1F5F9] bg-white">
        <Pressable 
          onPress={() => router.replace('/(staff)/profile' as never)}
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
        >
          <ChevronLeft size={20} color="#1E293B" />
        </Pressable>
        <Text className="text-[18px] font-inter-bold text-[#1E293B] ml-4">Phiếu báo lương</Text>
      </View>

      {/* Month Selector */}
      <View className="bg-white py-3 border-b border-[#F1F5F9]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {MONTHS_LIST.map((item) => {
            const isSelected = selectedYear === item.year && selectedMonth === item.month;
            return (
              <Pressable 
                key={`${item.year}-${item.month}`}
                onPress={() => {
                  setSelectedYear(item.year);
                  setSelectedMonth(item.month);
                }}
                className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'bg-slate-50 border-slate-200'}`}
              >
                <Text 
                  className={`text-[13px] font-inter-bold ${isSelected ? 'text-white' : 'text-[#475569]'}`}
                >
                  Lương tháng T{item.month}/{item.year}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
          <Text className="text-[14px] font-inter text-muted mt-3">Đang tải phiếu báo lương...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}>

          {/* Net Pay Summary */}
          <View className="px-5 mb-6 mt-4">
            <Card className="rounded-[32px] p-6 bg-[#16A34A] border-0 shadow-lg overflow-hidden">
              <View className="flex-row items-center mb-2">
                <DollarSign size={20} color="#fff" />
                <Text className="text-[14px] font-inter text-white/80 ml-1.5">Thực nhận tháng này</Text>
              </View>
              <Text className="text-[32px] font-inter-bold text-white mt-1">
                {formatVND(netPay)}
              </Text>
              <View className="h-[1px] bg-white/20 my-4" />
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-[11px] font-inter text-white/60">Tổng giờ làm</Text>
                  <Text className="text-[16px] font-inter-bold text-white mt-0.5">{totalHours}h</Text>
                </View>
                <View>
                  <Text className="text-[11px] font-inter text-white/60">Đơn giá</Text>
                  <Text className="text-[16px] font-inter-bold text-white mt-0.5">{formatVND(HOURLY_RATE)}/h</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text className="text-[11px] font-inter text-white/60">Ngày làm ca</Text>
                  <Text className="text-[16px] font-inter-bold text-white mt-0.5">{onTimeDays + lateDays}</Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Breakdown */}
          <View className="px-5 mb-6">
            <Text className="text-[13px] font-inter-bold text-[#64748B] mb-3 ml-1 uppercase tracking-wider">Chi tiết lương</Text>
            <Card className="rounded-[28px] p-2 bg-white shadow-sm border border-slate-100">
              <PayRow 
                icon={TrendingUp}
                iconBg="#DCFCE7"
                iconColor="#16A34A"
                label="Lương cơ bản (giờ x đơn giá)"
                value={formatVND(grossPay)}
                valueColor="#16A34A"
              />
              <View className="h-[1px] bg-[#F8FAFC] mx-5" />
              <PayRow 
                icon={TrendingDown}
                iconBg="#FEF2F2"
                iconColor="#DC2626"
                label={`Khấu trừ trễ giờ (${lateDays} ngày x 50%)`}
                value={`-${formatVND(deduction)}`}
                valueColor="#DC2626"
              />
              <View className="h-[1px] bg-[#F8FAFC] mx-5" />
              <PayRow 
                icon={XCircle}
                iconBg="#FFF7ED"
                iconColor="#EA580C"
                label={`Vắng mặt (${absentDays} ngày)`}
                value="Không tính lương"
                valueColor="#EA580C"
              />
            </Card>
          </View>

          {/* Attendance Summary */}
          <View className="px-5 mb-6">
            <Text className="text-[13px] font-inter-bold text-[#64748B] mb-3 ml-1 uppercase tracking-wider">Tổng kết chấm công</Text>
            <Card className="rounded-[28px] p-2 bg-white shadow-sm border border-slate-100">
              <SummaryRow 
                icon={CheckCircle2}
                iconColor="#16A34A"
                iconBg="#DCFCE7"
                label="Đúng giờ"
                value={`${onTimeDays} ngày`}
              />
              <View className="h-[1px] bg-[#F8FAFC] mx-5" />
              <SummaryRow 
                icon={AlertTriangle}
                iconColor="#EA580C"
                iconBg="#FFF7ED"
                label="Trễ giờ / Về sớm"
                value={`${lateDays} ngày`}
              />
              <View className="h-[1px] bg-[#F8FAFC] mx-5" />
              <SummaryRow 
                icon={XCircle}
                iconColor="#DC2626"
                iconBg="#FEF2F2"
                label="Vắng mặt"
                value={`${absentDays} ngày`}
              />
            </Card>
          </View>

          {/* Salary Policy */}
          <View className="px-5">
            <Card className="rounded-[24px] p-5 bg-[#EFF6FF] border border-blue-100">
              <Text className="text-[14px] font-inter-bold text-[#1E40AF] mb-2">Chính sách lương</Text>
              <View style={{ gap: 6 }}>
                <Text className="text-[13px] font-inter text-[#1E40AF]">• Lương cơ bản: 30.000đ / giờ</Text>
                <Text className="text-[13px] font-inter text-[#1E40AF]">• Trễ giờ: Trừ 50% lương ngày hôm đó</Text>
                <Text className="text-[13px] font-inter text-[#1E40AF]">• Vắng mặt: Không tính lương ngày đó</Text>
                <Text className="text-[13px] font-inter text-[#1E40AF]">• Lương được tính dựa trên chấm công thực tế</Text>
              </View>
            </Card>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PayRow({ icon: Icon, iconBg, iconColor, label, value, valueColor }: any) {
  return (
    <View className="flex-row items-center p-4">
      <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: iconBg }}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-[12px] font-inter text-[#64748B]">{label}</Text>
        <Text className="text-[16px] font-inter-bold mt-0.5" style={{ color: valueColor }}>{value}</Text>
      </View>
    </View>
  );
}

function SummaryRow({ icon: Icon, iconColor, iconBg, label, value }: any) {
  return (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: iconBg }}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </View>
        <Text className="text-[14px] font-inter text-[#475569]">{label}</Text>
      </View>
      <Text className="text-[15px] font-inter-bold text-[#1E293B]">{value}</Text>
    </View>
  );
}
