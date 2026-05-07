import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { 
  ChevronLeft,
  ChevronDown,
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


/*
  ===== SALARY LOGIC =====
  - Lương cứng theo giờ: 30.000 VND/giờ
  - Trễ giờ: trừ 50% lương ngày đó  
  - Vắng mặt: không tính lương ngày đó
  - Nghỉ phép (OFF): không tính lương

  Ví dụ: 1 ca 8h => lương ngày = 8 x 30.000 = 240.000 VND
  Nếu trễ: lương ngày = 240.000 / 2 = 120.000 VND
  Nếu vắng: lương ngày = 0 VND
*/

const HOURLY_RATE = 30000;

type DayRecord = {
  date: string;
  day: string;
  shiftType: string;
  hours: number;
  status: 'ON_TIME' | 'LATE' | 'ABSENT' | 'OFF';
};

type MonthPayslip = {
  month: string;
  monthKey: string;
  records: DayRecord[];
};

const PAYSLIP_DATA: MonthPayslip[] = [
  {
    month: 'Tháng 5, 2026',
    monthKey: '2026-05',
    records: [
      { date: '06/05', day: 'Thứ Ba', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '05/05', day: 'Thứ Hai', shiftType: 'S', hours: 8, status: 'LATE' },
      { date: '03/05', day: 'Thứ Bảy', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '02/05', day: 'Thứ Sáu', shiftType: 'C', hours: 8, status: 'ON_TIME' },
    ]
  },
  {
    month: 'Tháng 4, 2026',
    monthKey: '2026-04',
    records: [
      { date: '29/04', day: 'Thứ Ba', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '28/04', day: 'Thứ Hai', shiftType: 'S', hours: 0, status: 'ABSENT' },
      { date: '26/04', day: 'Thứ Bảy', shiftType: 'C', hours: 8, status: 'ON_TIME' },
      { date: '25/04', day: 'Thứ Sáu', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '24/04', day: 'Thứ Năm', shiftType: 'S', hours: 8, status: 'LATE' },
      { date: '23/04', day: 'Thứ Tư', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '22/04', day: 'Thứ Ba', shiftType: 'C', hours: 8, status: 'ON_TIME' },
      { date: '21/04', day: 'Thứ Hai', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '19/04', day: 'Thứ Bảy', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '18/04', day: 'Thứ Sáu', shiftType: 'S', hours: 8, status: 'LATE' },
      { date: '17/04', day: 'Thứ Năm', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '16/04', day: 'Thứ Tư', shiftType: 'S', hours: 8, status: 'ON_TIME' },
      { date: '15/04', day: 'Thứ Ba', shiftType: 'S', hours: 8, status: 'ON_TIME' },
    ]
  }
];

function calculatePayslip(records: DayRecord[]) {
  let totalHours = 0;
  let grossPay = 0;
  let deduction = 0;
  let onTimeDays = 0;
  let lateDays = 0;
  let absentDays = 0;

  records.forEach(r => {
    if (r.status === 'OFF') return;
    
    const dailyPay = r.hours * HOURLY_RATE;
    
    if (r.status === 'ON_TIME') {
      totalHours += r.hours;
      grossPay += dailyPay;
      onTimeDays++;
    } else if (r.status === 'LATE') {
      totalHours += r.hours;
      grossPay += dailyPay;
      deduction += dailyPay * 0.5; // Trừ 50% lương ngày trễ
      lateDays++;
    } else if (r.status === 'ABSENT') {
      deduction += 0; // Không tính gì cả, đã không có grossPay
      absentDays++;
    }
  });

  const netPay = grossPay - deduction;

  return { totalHours, grossPay, deduction, netPay, onTimeDays, lateDays, absentDays };
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

export default function PayslipScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedMonth, setSelectedMonth] = useState(0);

  const currentPayslip = PAYSLIP_DATA[selectedMonth];
  const calc = calculatePayslip(currentPayslip.records);

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ title: 'Phiếu báo lương', headerShown: false }} />
      
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
        <Pressable 
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1E293B" />
        </Pressable>
        <Text className="text-[20px] font-inter-bold text-[#1E293B] ml-4">Phiếu báo lương</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Month Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, marginBottom: 20 }}>
          {PAYSLIP_DATA.map((p, idx) => (
            <Pressable 
              key={p.monthKey}
              onPress={() => setSelectedMonth(idx)}
              className="px-5 py-3 rounded-2xl"
              style={{ backgroundColor: selectedMonth === idx ? '#16A34A' : '#fff' }}
            >
              <Text 
                className="text-[14px] font-inter-bold"
                style={{ color: selectedMonth === idx ? '#fff' : '#475569' }}
              >
                {p.month}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Net Pay Summary */}
        <View className="px-5 mb-6">
          <Card className="rounded-[32px] p-6 bg-[#16A34A] border-0 shadow-lg overflow-hidden">
            <View className="flex-row items-center mb-2">
              <DollarSign size={22} color="#fff" />
              <Text className="text-[15px] font-inter text-white/80 ml-2">Thực nhận tháng này</Text>
            </View>
            <Text className="text-[36px] font-inter-bold text-white mt-1">
              {formatVND(calc.netPay)}
            </Text>
            <View className="h-[1px] bg-white/20 my-4" />
            <View className="flex-row justify-between">
              <View>
                <Text className="text-[12px] font-inter text-white/60">Tổng giờ làm</Text>
                <Text className="text-[18px] font-inter-bold text-white">{calc.totalHours}h</Text>
              </View>
              <View>
                <Text className="text-[12px] font-inter text-white/60">Đơn giá</Text>
                <Text className="text-[18px] font-inter-bold text-white">30.000đ/h</Text>
              </View>
              <View>
                <Text className="text-[12px] font-inter text-white/60">Ngày làm</Text>
                <Text className="text-[18px] font-inter-bold text-white">{calc.onTimeDays + calc.lateDays}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Breakdown */}
        <View className="px-5 mb-6">
          <Text className="text-[14px] font-inter-bold text-[#64748B] mb-3 ml-1 uppercase tracking-wider">Chi tiết lương</Text>
          <Card className="rounded-[28px] p-2 bg-white shadow-sm border-0">
            <PayRow 
              icon={TrendingUp}
              iconBg="#DCFCE7"
              iconColor="#16A34A"
              label="Lương cơ bản (giờ × đơn giá)"
              value={formatVND(calc.grossPay)}
              valueColor="#16A34A"
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-5" />
            <PayRow 
              icon={TrendingDown}
              iconBg="#FEF2F2"
              iconColor="#DC2626"
              label={`Khấu trừ trễ giờ (${calc.lateDays} ngày × 50%)`}
              value={`-${formatVND(calc.deduction)}`}
              valueColor="#DC2626"
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-5" />
            <PayRow 
              icon={XCircle}
              iconBg="#FFF7ED"
              iconColor="#EA580C"
              label={`Vắng mặt (${calc.absentDays} ngày)`}
              value="Không tính lương"
              valueColor="#EA580C"
            />
          </Card>
        </View>

        {/* Attendance Summary */}
        <View className="px-5 mb-6">
          <Text className="text-[14px] font-inter-bold text-[#64748B] mb-3 ml-1 uppercase tracking-wider">Tổng kết chấm công</Text>
          <Card className="rounded-[28px] p-2 bg-white shadow-sm border-0">
            <SummaryRow 
              icon={CheckCircle2}
              iconColor="#16A34A"
              iconBg="#DCFCE7"
              label="Đúng giờ"
              value={`${calc.onTimeDays} ngày`}
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-5" />
            <SummaryRow 
              icon={AlertTriangle}
              iconColor="#EA580C"
              iconBg="#FFF7ED"
              label="Trễ giờ"
              value={`${calc.lateDays} ngày`}
            />
            <View className="h-[1px] bg-[#F8FAFC] mx-5" />
            <SummaryRow 
              icon={XCircle}
              iconColor="#DC2626"
              iconBg="#FEF2F2"
              label="Vắng mặt"
              value={`${calc.absentDays} ngày`}
            />
          </Card>
        </View>

        {/* Salary Policy */}
        <View className="px-5">
          <Card className="rounded-[24px] p-5 bg-[#EFF6FF] border-0">
            <Text className="text-[14px] font-inter-bold text-[#1E40AF] mb-2">📋 Chính sách lương</Text>
            <View style={{ gap: 6 }}>
              <Text className="text-[13px] font-inter text-[#1E40AF]">• Lương cơ bản: 30.000đ / giờ</Text>
              <Text className="text-[13px] font-inter text-[#1E40AF]">• Trễ giờ: Trừ 50% lương ngày hôm đó</Text>
              <Text className="text-[13px] font-inter text-[#1E40AF]">• Vắng mặt: Không tính lương ngày đó</Text>
              <Text className="text-[13px] font-inter text-[#1E40AF]">• Lương được tính dựa trên chấm công thực tế</Text>
            </View>
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function PayRow({ icon: Icon, iconBg, iconColor, label, value, valueColor }: any) {
  return (
    <View className="flex-row items-center p-4">
      <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: iconBg }}>
        <Icon size={22} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text className="text-[13px] font-inter text-[#64748B]">{label}</Text>
        <Text className="text-[17px] font-inter-bold mt-0.5" style={{ color: valueColor }}>{value}</Text>
      </View>
    </View>
  );
}

function SummaryRow({ icon: Icon, iconColor, iconBg, label, value }: any) {
  return (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: iconBg }}>
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        <Text className="text-[15px] font-inter text-[#475569]">{label}</Text>
      </View>
      <Text className="text-[16px] font-inter-bold text-[#1E293B]">{value}</Text>
    </View>
  );
}
