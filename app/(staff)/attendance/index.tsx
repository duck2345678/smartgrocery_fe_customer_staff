import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useStaffAttendanceStore } from '../../../src/store/staffAttendanceStore';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Colors based on DayStatus
const STATUS_COLORS = {
  ON_TIME: '#16A34A', // Green
  LATE: '#F59E0B',    // Amber/Orange
  ABSENT: '#EF4444',  // Red
  SCHEDULED: '#3B82F6',// Blue
  OFF: '#FFFFFF',     // White
};

const STATUS_TEXT_COLORS = {
  ON_TIME: '#FFFFFF',
  LATE: '#FFFFFF',
  ABSENT: '#FFFFFF',
  SCHEDULED: '#FFFFFF',
  OFF: '#94A3B8',     // Muted text
};

const getStatusColor = (status?: string) => STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.OFF;
const getStatusTextColor = (status?: string) => STATUS_TEXT_COLORS[status as keyof typeof STATUS_TEXT_COLORS] || STATUS_TEXT_COLORS.OFF;

export default function StaffAttendanceScreen() {
  const { 
    todayShift, todayRecords, isLoading, error,
    calendarData, calendarMonth, calendarYear,
    fetchTodayStatus, fetchCalendar, performCheckIn, performCheckOut
  } = useStaffAttendanceStore();

  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  useEffect(() => {
    fetchCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate.getFullYear(), currentDate.getMonth(), fetchCalendar]);

  const { canCheckIn, canCheckOut } = useMemo(() => {
    if (!todayShift || todayShift === 'OFF' || todayShift === 'P' || todayShift === 'F') {
      return { canCheckIn: false, canCheckOut: false };
    }
    
    const expectedBlocks = todayShift === 'G' ? 2 : 1;
    const activeRecord = todayRecords.find(r => r.checkInAt && !r.checkOutAt);
    
    if (activeRecord) {
      return { canCheckIn: false, canCheckOut: true };
    }
    
    const completedBlocks = todayRecords.filter(r => r.checkInAt && r.checkOutAt).length;
    if (completedBlocks >= expectedBlocks) {
       return { canCheckIn: false, canCheckOut: false };
    }
    
    return { canCheckIn: true, canCheckOut: false };
  }, [todayShift, todayRecords]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Create YYYY-MM-DD correctly for local timezone
  const getLocalDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const todayStr = getLocalDateString(new Date());

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="items-center justify-center py-4 border-b border-gray-100">
        <Text className="text-lg font-outfit-bold text-slate-900">Chấm công</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-4">
          <Pressable onPress={handlePrevMonth} className="p-2" hitSlop={10}>
            <ChevronLeft size={20} color="#64748B" />
          </Pressable>
          <Text className="text-base font-inter-bold text-slate-800">
            Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
          </Text>
          <Pressable onPress={handleNextMonth} className="p-2" hitSlop={10}>
            <ChevronRight size={20} color="#64748B" />
          </Pressable>
        </View>

        <View className="mb-6">
          <View className="flex-row mb-2">
            {WEEKDAYS.map(day => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-[13px] font-inter text-slate-800">{day}</Text>
              </View>
            ))}
          </View>
          
          <View className="flex-row flex-wrap gap-y-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={{ width: '14.28%', height: 48 }} />;
              }
              const dateStr = getLocalDateString(date);
              const data = calendarData.get(dateStr);
              const status = data?.dayStatus || 'OFF';
              const shiftType = data?.shiftType || 'Off';
              
              const isToday = dateStr === todayStr;
              const bgColor = getStatusColor(status);
              const textColor = getStatusTextColor(status);
              
              const isOff = status === 'OFF';
              const isRed = status === 'ABSENT';

              return (
                <View key={dateStr} style={{ width: '14.28%', height: 56, padding: 3 }}>
                  <View 
                    className="flex-1 rounded-[10px] items-center justify-center"
                    style={{ 
                      backgroundColor: bgColor,
                      borderColor: isRed ? '#EF4444' : (isOff ? '#E2E8F0' : bgColor),
                      borderWidth: isOff || isRed ? 1 : 0
                    }}
                  >
                    <Text 
                      className="text-[13px] font-inter-bold"
                      style={{ color: isRed ? '#EF4444' : (isOff ? '#334155' : textColor) }}
                    >
                      {date.getDate()}
                    </Text>
                    <Text 
                      className="text-[11px] font-inter"
                      style={{ color: isRed ? '#EF4444' : (isOff ? '#94A3B8' : textColor) }}
                    >
                      {shiftType}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className="flex-row flex-wrap gap-y-3 mb-6">
          <View className="w-1/2 flex-row items-center">
            <View className="w-[14px] h-[14px] rounded-sm mr-2 bg-[#16A34A]" />
            <Text className="text-[13px] font-inter text-slate-800">Đúng giờ đầy đủ</Text>
          </View>
          <View className="w-1/2 flex-row items-center">
            <View className="w-[14px] h-[14px] rounded-sm mr-2 bg-[#F59E0B]" />
            <Text className="text-[13px] font-inter text-slate-800">Đi trễ / Về sớm</Text>
          </View>
          <View className="w-1/2 flex-row items-center">
            <View className="w-[14px] h-[14px] rounded-sm mr-2 bg-[#EF4444]" />
            <Text className="text-[13px] font-inter text-slate-800">Vắng Mặt</Text>
          </View>
          <View className="w-1/2 flex-row items-center">
            <View className="w-[14px] h-[14px] rounded-sm mr-2 bg-[#3B82F6]" />
            <Text className="text-[13px] font-inter text-slate-800">Có lịch làm việc</Text>
          </View>
          <View className="w-1/2 flex-row items-center">
            <View className="w-[14px] h-[14px] rounded-sm mr-2 bg-[#E2E8F0]" />
            <Text className="text-[13px] font-inter text-slate-800">Không lịch làm việc</Text>
          </View>
        </View>

        <View className="h-px bg-slate-200 w-full mb-4" />

        <View className="flex-row flex-wrap mb-8">
          <Text className="w-1/3 text-[13px] font-inter text-slate-800 mb-2">S: Ca Sáng</Text>
          <Text className="w-1/3 text-[13px] font-inter text-slate-800 mb-2">C: Ca Chiều</Text>
          <Text className="w-1/3 text-[13px] font-inter text-slate-800 mb-2">G: Ca Gãy</Text>
          <Text className="w-1/3 text-[13px] font-inter text-slate-800">P: Phép/Công tác</Text>
          <Text className="w-2/3 text-[13px] font-inter text-slate-800">F: Flex/Fle2/Fle3</Text>
        </View>

        <View className="flex-row gap-4 pb-12">
          <Pressable 
            disabled={!canCheckIn || isLoading}
            onPress={performCheckIn}
            className={`flex-1 py-[14px] rounded-xl items-center border border-transparent ${canCheckIn ? 'bg-[#16A34A]' : 'bg-[#16A34A]'}`}
            style={{ opacity: canCheckIn ? 1 : 0.4 }}
          >
            {isLoading && canCheckIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className={`text-[15px] font-inter-bold text-white`}>
                Vào ca
              </Text>
            )}
          </Pressable>

          <Pressable 
            disabled={!canCheckOut || isLoading}
            onPress={performCheckOut}
            className={`flex-1 py-[14px] rounded-xl items-center border ${canCheckOut ? 'border-[#16A34A] bg-white' : 'border-[#16A34A] bg-white'}`}
            style={{ opacity: canCheckOut ? 1 : 0.4 }}
          >
            {isLoading && canCheckOut ? (
              <ActivityIndicator color="#16A34A" />
            ) : (
              <Text className={`text-[15px] font-inter-bold text-[#16A34A]`}>
                Ra ca
              </Text>
            )}
          </Pressable>
        </View>
        
        {error ? <Text className="text-xs text-red-500 text-center mb-6">{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
