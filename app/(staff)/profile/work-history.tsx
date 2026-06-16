import React, { useState, useMemo } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/store/authStore';
import * as staffAttendanceApi from '../../../src/api/staffAttendance';

const SHIFT_LABELS: Record<string, string> = {
  'S': 'Ca sáng',
  'C': 'Ca chiều',
  'G': 'Ca gãy',
  'P': 'Ca phụ',
  'F': 'Ca full',
  'OFF': 'Nghỉ',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  'ON_TIME': { label: 'Đúng giờ', color: '#16A34A', bg: '#DCFCE7', icon: CheckCircle2 },
  'LATE': { label: 'Trễ / Vi phạm', color: '#EA580C', bg: '#FFF7ED', icon: AlertTriangle },
  'ABSENT': { label: 'Vắng mặt', color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  'OFF': { label: 'Nghỉ phép', color: '#64748B', bg: '#F1F5F9', icon: Calendar },
  'SCHEDULED': { label: 'Chưa làm', color: '#3B82F6', bg: '#EFF6FF', icon: Clock },
  'NO_SCHEDULE': { label: 'Không có lịch', color: '#94A3B8', bg: '#F8FAFC', icon: Calendar },
};

export default function WorkHistoryScreen() {
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

  // Fetch Monthly Calendar Days
  const calendarQuery = useQuery({
    queryKey: ['staff-attendance-calendar', selectedYear, selectedMonth],
    queryFn: () => staffAttendanceApi.getMonthlyCalendar(selectedYear, selectedMonth),
  });

  // Fetch Monthly Stats
  const statsQuery = useQuery({
    queryKey: ['staff-attendance-stats', selectedYear, selectedMonth],
    queryFn: () => staffAttendanceApi.getMonthlyStats(selectedYear, selectedMonth),
  });

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    return `${parts[2]}/${parts[1]}`;
  };

  const getDayName = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const dateObj = new Date(dateStr);
      const day = dateObj.getDay();
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return days[day] || '';
    } catch {
      return '';
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    try {
      const dateObj = new Date(timeStr);
      return dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const days = calendarQuery.data || [];
  const stats = statsQuery.data;

  // Filter reverse chronological order for timeline
  const reversedDays = useMemo(() => {
    return [...days].reverse();
  }, [days]);

  const isLoading = calendarQuery.isLoading || statsQuery.isLoading;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Quá trình công tác', headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-[#F1F5F9] bg-white">
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(staff)/profile');
            }
          }}
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
        >
          <ChevronLeft size={20} color="#1E293B" />
        </Pressable>
        <Text className="text-[18px] font-inter-bold text-[#1E293B] ml-4">Quá trình công tác</Text>
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
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16A34A" />
          <Text className="text-[14px] font-inter text-muted mt-3">Đang tải lịch sử công tác...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}>
          
          {/* Summary Stats Card */}
          <View className="px-5 mb-6 mt-4">
            <Card className="rounded-[28px] p-5 bg-white shadow-sm border border-slate-100">
              <View className="flex-row items-center mb-4">
                <Calendar size={18} color="#16A34A" />
                <Text className="text-[15px] font-inter-bold text-[#1E293B] ml-2">Tổng kết tháng này</Text>
              </View>
              <View className="flex-row" style={{ gap: 10 }}>
                <StatBox label="Đúng ca" value={String(stats?.onTimeCheckIns || 0)} color="#16A34A" bg="#DCFCE7" />
                <StatBox label="Đi trễ" value={String(stats?.lateCheckIns || 0)} color="#EA580C" bg="#FFF7ED" />
                <StatBox label="Vắng mặt" value={String(stats?.absentDays || 0)} color="#DC2626" bg="#FEF2F2" />
                <StatBox label="Tổng giờ" value={String(Math.round((stats?.totalWorkedMinutes || 0) / 60 * 10) / 10)} color="#3B82F6" bg="#EFF6FF" />
              </View>
            </Card>
          </View>

          {/* Timeline */}
          {reversedDays.length === 0 ? (
            <View className="items-center justify-center py-20 px-8">
              <Calendar size={48} color="#94A3B8" />
              <Text className="text-[15px] font-inter-bold text-[#475569] mt-3">Không có lịch sử công tác</Text>
              <Text className="text-[13px] font-inter text-muted text-center mt-1">
                Không tìm thấy dữ liệu chấm công cho tháng {selectedMonth}/{selectedYear}.
              </Text>
            </View>
          ) : (
            <View className="px-5">
              <Text className="text-[13px] font-inter-bold text-[#64748B] mb-4 ml-1 uppercase tracking-widest">
                Nhật ký chấm công
              </Text>
              <View className="ml-1.5 border-l-2 border-slate-200 pl-5">
                {reversedDays.map((day, idx) => {
                  const statusKey = day.dayStatus || 'NO_SCHEDULE';
                  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG['NO_SCHEDULE'];
                  const StatusIcon = config.icon;
                  const hasRecord = day.records && day.records.length > 0;

                  return (
                    <View key={day.date} className="mb-4 relative">
                      {/* Timeline dot */}
                      <View 
                        className="absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-[3px] border-white shadow-sm"
                        style={{ backgroundColor: config.color }}
                      />
                      
                      <Card className="rounded-[24px] p-4 bg-white border border-slate-100 shadow-sm">
                        <View className="flex-row items-center justify-between mb-2.5">
                          <View className="flex-row items-center">
                            <Text className="text-[15px] font-inter-bold text-[#1E293B]">{formatDateString(day.date)}</Text>
                            <Text className="text-[13px] font-inter text-[#64748B] ml-2">{getDayName(day.date)}</Text>
                          </View>
                          <View className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: config.bg }}>
                            <StatusIcon size={12} color={config.color} />
                            <Text className="text-[11px] font-inter-bold ml-1" style={{ color: config.color }}>{config.label}</Text>
                          </View>
                        </View>
                        
                        {hasRecord ? (
                          day.records.map((rec, rIdx) => (
                            <View key={rec.id || rIdx} className="mt-1 flex-row items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                              <View className="flex-row items-center">
                                <Clock size={13} color="#64748B" />
                                <Text className="text-[12px] font-inter text-[#475569] ml-1.5">
                                  {formatTime(rec.checkInAt)} → {formatTime(rec.checkOutAt)}
                                </Text>
                              </View>
                              <View className="flex-row items-center" style={{ gap: 6 }}>
                                <View className="px-2 py-0.5 bg-slate-200/60 rounded-full">
                                  <Text className="text-[10px] font-inter-bold text-[#475569]">
                                    {SHIFT_LABELS[rec.shiftType] || rec.shiftType}
                                  </Text>
                                </View>
                                {rec.checkInStatus === 'LATE' && (
                                  <View className="px-1.5 py-0.5 bg-red-50 rounded-full">
                                    <Text className="text-[9px] font-inter-bold text-red-600">Trễ</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          ))
                        ) : (
                          <View className="mt-1 flex-row items-center justify-between">
                            <Text className="text-[12.5px] font-inter text-[#64748B] italic">
                              {statusKey === 'OFF' ? 'Lịch nghỉ phép hàng tuần' : statusKey === 'NO_SCHEDULE' ? 'Không có lịch được xếp' : 'Không có ghi nhận chấm công'}
                            </Text>
                            <Text className="text-[12px] font-inter-bold text-[#475569]">
                              {day.shiftType ? (SHIFT_LABELS[day.shiftType] || day.shiftType) : '-'}
                            </Text>
                          </View>
                        )}
                      </Card>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View className="flex-1 items-center p-3 rounded-2xl" style={{ backgroundColor: bg }}>
      <Text className="text-[20px] font-inter-bold" style={{ color }}>{value}</Text>
      <Text className="text-[10px] font-inter text-[#64748B] mt-1 text-center" numberOfLines={1}>{label}</Text>
    </View>
  );
}
