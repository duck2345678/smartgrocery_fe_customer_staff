import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/store/authStore';

// Mock data based on AttendanceRecord entity
const MOCK_HISTORY = [
  {
    month: 'Tháng 5, 2026',
    records: [
      { date: '06/05', day: 'Thứ Ba', shiftType: 'S', checkIn: '06:02', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '05/05', day: 'Thứ Hai', shiftType: 'S', checkIn: '06:15', checkOut: '14:00', status: 'LATE', hours: 8 },
      { date: '04/05', day: 'Chủ Nhật', shiftType: 'OFF', checkIn: null, checkOut: null, status: 'OFF', hours: 0 },
      { date: '03/05', day: 'Thứ Bảy', shiftType: 'S', checkIn: '05:58', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '02/05', day: 'Thứ Sáu', shiftType: 'C', checkIn: '14:00', checkOut: '22:00', status: 'ON_TIME', hours: 8 },
      { date: '01/05', day: 'Thứ Năm', shiftType: 'OFF', checkIn: null, checkOut: null, status: 'OFF', hours: 0 },
    ]
  },
  {
    month: 'Tháng 4, 2026',
    records: [
      { date: '30/04', day: 'Thứ Tư', shiftType: 'OFF', checkIn: null, checkOut: null, status: 'OFF', hours: 0 },
      { date: '29/04', day: 'Thứ Ba', shiftType: 'S', checkIn: '06:00', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '28/04', day: 'Thứ Hai', shiftType: 'S', checkIn: null, checkOut: null, status: 'ABSENT', hours: 0 },
      { date: '27/04', day: 'Chủ Nhật', shiftType: 'OFF', checkIn: null, checkOut: null, status: 'OFF', hours: 0 },
      { date: '26/04', day: 'Thứ Bảy', shiftType: 'C', checkIn: '14:05', checkOut: '22:00', status: 'ON_TIME', hours: 8 },
      { date: '25/04', day: 'Thứ Sáu', shiftType: 'S', checkIn: '06:00', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '24/04', day: 'Thứ Năm', shiftType: 'S', checkIn: '06:30', checkOut: '14:00', status: 'LATE', hours: 8 },
      { date: '23/04', day: 'Thứ Tư', shiftType: 'S', checkIn: '05:55', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '22/04', day: 'Thứ Ba', shiftType: 'C', checkIn: '14:00', checkOut: '22:00', status: 'ON_TIME', hours: 8 },
      { date: '21/04', day: 'Thứ Hai', shiftType: 'S', checkIn: '06:00', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '20/04', day: 'Chủ Nhật', shiftType: 'OFF', checkIn: null, checkOut: null, status: 'OFF', hours: 0 },
      { date: '19/04', day: 'Thứ Bảy', shiftType: 'S', checkIn: '06:00', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '18/04', day: 'Thứ Sáu', shiftType: 'S', checkIn: '06:10', checkOut: '14:00', status: 'LATE', hours: 8 },
      { date: '17/04', day: 'Thứ Năm', shiftType: 'S', checkIn: '06:00', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '16/04', day: 'Thứ Tư', shiftType: 'S', checkIn: '06:00', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
      { date: '15/04', day: 'Thứ Ba', shiftType: 'S', checkIn: '06:00', checkOut: '14:00', status: 'ON_TIME', hours: 8 },
    ]
  }
];

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
  'LATE': { label: 'Trễ giờ', color: '#EA580C', bg: '#FFF7ED', icon: AlertTriangle },
  'ABSENT': { label: 'Vắng mặt', color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  'OFF': { label: 'Nghỉ phép', color: '#64748B', bg: '#F1F5F9', icon: Calendar },
};

export default function WorkHistoryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(MOCK_HISTORY[0].month);

  // Stats for current month
  const currentMonth = MOCK_HISTORY[0];
  const onTimeCount = currentMonth.records.filter(r => r.status === 'ON_TIME').length;
  const lateCount = currentMonth.records.filter(r => r.status === 'LATE').length;
  const absentCount = currentMonth.records.filter(r => r.status === 'ABSENT').length;
  const totalHours = currentMonth.records.reduce((sum, r) => sum + r.hours, 0);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Quá trình công tác', headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <Pressable 
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1E293B" />
        </Pressable>
        <Text className="text-[20px] font-inter-bold text-[#1E293B] ml-4">Quá trình công tác</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Summary Stats */}
        <View className="px-5 mb-6">
          <Card className="rounded-[28px] p-5 bg-white shadow-sm border-0">
            <View className="flex-row items-center mb-4">
              <Calendar size={20} color="#16A34A" />
              <Text className="text-[15px] font-inter-bold text-[#475569] ml-2">Tháng hiện tại</Text>
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <StatBox label="Đúng giờ" value={String(onTimeCount)} color="#16A34A" bg="#DCFCE7" />
              <StatBox label="Trễ giờ" value={String(lateCount)} color="#EA580C" bg="#FFF7ED" />
              <StatBox label="Vắng" value={String(absentCount)} color="#DC2626" bg="#FEF2F2" />
              <StatBox label="Tổng giờ" value={String(totalHours)} color="#3B82F6" bg="#EFF6FF" />
            </View>
          </Card>
        </View>

        {/* Timeline */}
        {MOCK_HISTORY.map((monthGroup) => (
          <View key={monthGroup.month} className="px-5 mb-4">
            {/* Month Header */}
            <Pressable 
              onPress={() => setExpandedMonth(expandedMonth === monthGroup.month ? null : monthGroup.month)}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-[#16A34A] mr-3" />
                <Text className="text-[16px] font-inter-bold text-[#1E293B]">{monthGroup.month}</Text>
              </View>
              {expandedMonth === monthGroup.month ? 
                <ChevronUp size={20} color="#64748B" /> : 
                <ChevronDown size={20} color="#64748B" />
              }
            </Pressable>

            {expandedMonth === monthGroup.month && (
              <View className="ml-1.5 border-l-2 border-[#E2E8F0] pl-5">
                {monthGroup.records.map((record, idx) => {
                  const config = STATUS_CONFIG[record.status];
                  const StatusIcon = config.icon;
                  return (
                    <View key={idx} className="mb-3 relative">
                      {/* Timeline dot */}
                      <View 
                        className="absolute -left-[27px] top-4 w-3 h-3 rounded-full border-2 border-white"
                        style={{ backgroundColor: config.color }}
                      />
                      <Card className="rounded-[20px] p-4 bg-white border-0 shadow-sm">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center">
                            <Text className="text-[16px] font-inter-bold text-[#1E293B]">{record.date}</Text>
                            <Text className="text-[14px] font-inter text-[#64748B] ml-2">{record.day}</Text>
                          </View>
                          <View className="flex-row items-center px-3 py-1 rounded-full" style={{ backgroundColor: config.bg }}>
                            <StatusIcon size={14} color={config.color} />
                            <Text className="text-[12px] font-inter-bold ml-1.5" style={{ color: config.color }}>{config.label}</Text>
                          </View>
                        </View>
                        
                        {record.status !== 'OFF' && record.status !== 'ABSENT' && (
                          <View className="flex-row items-center mt-1" style={{ gap: 16 }}>
                            <View className="flex-row items-center">
                              <Clock size={14} color="#94A3B8" />
                              <Text className="text-[13px] font-inter text-[#64748B] ml-1.5">
                                {record.checkIn} → {record.checkOut}
                              </Text>
                            </View>
                            <View className="px-2 py-0.5 bg-[#F1F5F9] rounded-full">
                              <Text className="text-[12px] font-inter-bold text-[#475569]">{SHIFT_LABELS[record.shiftType]}</Text>
                            </View>
                            <Text className="text-[13px] font-inter-bold text-[#3B82F6]">{record.hours}h</Text>
                          </View>
                        )}
                        
                        {record.status === 'ABSENT' && (
                          <Text className="text-[13px] font-inter text-[#DC2626] mt-1">Không chấm công ngày này</Text>
                        )}
                      </Card>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}

        {/* Employment start marker */}
        <View className="px-5 mb-4">
          <View className="flex-row items-center py-3 px-1">
            <View className="w-3 h-3 rounded-full bg-[#16A34A] mr-3" />
            <Text className="text-[15px] font-inter-bold text-[#16A34A]">Ngày bắt đầu: 15/04/2026</Text>
          </View>
          <Card className="rounded-[20px] p-5 bg-[#EDF7F1] border-0 ml-6">
            <Text className="text-[15px] font-inter-bold text-[#16A34A]">🎉 Chào mừng gia nhập SmartGrocery!</Text>
            <Text className="text-[13px] font-inter text-[#166534] mt-1.5">
              Nhân viên {user?.fullName || 'PO Staff'} bắt đầu làm việc tại SmartGrocery.
            </Text>
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View className="flex-1 items-center p-3 rounded-2xl" style={{ backgroundColor: bg }}>
      <Text className="text-[22px] font-inter-bold" style={{ color }}>{value}</Text>
      <Text className="text-[11px] font-inter text-[#64748B] mt-1">{label}</Text>
    </View>
  );
}
