import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, LogIn, LogOut, Clock } from 'lucide-react-native';
import { useStaffAttendanceStore, CheckResult } from '../../../src/store/staffAttendanceStore';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const STATUS_COLORS: Record<string, string> = {
  ON_TIME: '#16A34A',
  LATE: '#F59E0B',
  ABSENT: '#EF4444',
  SCHEDULED: '#3B82F6',
  OFF: '#FFFFFF',
  NO_SCHEDULE: '#FFFFFF',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  ON_TIME: '#FFFFFF',
  LATE: '#FFFFFF',
  ABSENT: '#FFFFFF',
  SCHEDULED: '#FFFFFF',
  OFF: '#94A3B8',
  NO_SCHEDULE: '#94A3B8',
};

const getStatusColor = (status?: string) =>
  STATUS_COLORS[status ?? ''] ?? STATUS_COLORS.OFF;
const getStatusTextColor = (status?: string) =>
  STATUS_TEXT_COLORS[status ?? ''] ?? STATUS_TEXT_COLORS.OFF;

const SHIFT_LABELS: Record<string, string> = {
  S: 'Ca Sáng',
  C: 'Ca Chiều',
  G: 'Ca Gãy',
};

const SHIFT_REQUEST_OPTIONS = [
  { shiftType: 'S' as const, label: 'Ca Sáng', detail: '06:30 – 14:30' },
  { shiftType: 'C' as const, label: 'Ca Chiều', detail: '14:30 – 22:30' },
  { shiftType: 'G' as const, label: 'Ca Gãy', detail: 'Chọn 2 block không liền kề' },
];

const SHIFT_BLOCKS = [
  { blockNumber: 1, label: 'G1: 06:30 – 10:30' },
  { blockNumber: 2, label: 'G2: 10:30 – 14:30' },
  { blockNumber: 3, label: 'G3: 14:30 – 18:30' },
  { blockNumber: 4, label: 'G4: 18:30 – 22:30' },
];

const NON_ADJACENT_G_COMBOS = new Set(['1,3', '1,4', '2,4']);

const normalizeSelectedBlocks = (blocks: number[]) => [...new Set(blocks)].sort((a, b) => a - b);

const getSelectedBlocksKey = (blocks: number[]) => normalizeSelectedBlocks(blocks).join(',');

const isValidGSelection = (blocks: number[]) => {
  const normalized = normalizeSelectedBlocks(blocks);
  if (normalized.length !== 2) return false;
  if (normalized.some((n) => n < 1 || n > 4)) return false;
  return NON_ADJACENT_G_COMBOS.has(normalized.join(','));
};

const formatTime = (isoString: string | null) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const toIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const formatDateVi = (isoDate: string) => {
  const [y, m, d] = String(isoDate).split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
};

const formatRequestBlocks = (value: string | null) => {
  if (!value) return '';
  const blocks = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (blocks.length === 0) return '';
  return blocks.map((block) => `G${block}`).join(' + ');
};

export default function StaffAttendanceScreen() {
  const {
    todayShift,
    todayRecords,
    isLoading,
    error,
    calendarData,
    selectedDate,
    fetchTodayStatus,
    fetchCalendar,
    performCheckIn,
    performCheckOut,
    requestShift,
    cancelShiftRequest,
    setSelectedDate,
    clearError,
  } = useStaffAttendanceStore();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [confirmModal, setConfirmModal] = useState<'check-in' | 'check-out' | null>(null);
  const [shiftRequestModal, setShiftRequestModal] = useState<null | 'S' | 'C' | 'G'>(null);
  const [selectedGBlocks, setSelectedGBlocks] = useState<number[]>([]);
  const [resultModal, setResultModal] = useState<CheckResult | null>(null);

  const openShiftRequestModal = (shiftType: 'S' | 'C' | 'G') => {
    setSelectedGBlocks([]);
    setShiftRequestModal(shiftType);
  };

  // Animation for result modal
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showResultModal = useCallback(
    (result: CheckResult) => {
      setResultModal(result);
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [scaleAnim, opacityAnim],
  );

  const closeResultModal = useCallback(() => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setResultModal(null));
  }, [opacityAnim]);

  useEffect(() => {
    fetchTodayStatus();
  }, [fetchTodayStatus]);

  useEffect(() => {
    fetchCalendar(currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [currentDate.getFullYear(), currentDate.getMonth(), fetchCalendar]);

  // Derived button state
  const { canCheckIn, canCheckOut, currentBlockLabel } = useMemo(() => {
    const todayStrLocal = toIsoDate(new Date());
    if (selectedDate !== todayStrLocal) {
      return { canCheckIn: false, canCheckOut: false, currentBlockLabel: '' };
    }
    if (!todayShift || todayShift === 'OFF' || todayShift === 'P') {
      return { canCheckIn: false, canCheckOut: false, currentBlockLabel: '' };
    }

    const expectedBlocks = todayShift === 'G' ? 2 : 1;
    const activeRecord = todayRecords.find((r) => r.checkInAt && !r.checkOutAt);

    if (activeRecord) {
      const blockInfo = todayShift === 'G' ? ` Block ${activeRecord.blockNumber}` : '';
      return {
        canCheckIn: false,
        canCheckOut: true,
        currentBlockLabel: blockInfo,
      };
    }

    const completedBlocks = todayRecords.filter((r) => r.checkInAt && r.checkOutAt).length;
    if (completedBlocks >= expectedBlocks) {
      return { canCheckIn: false, canCheckOut: false, currentBlockLabel: '' };
    }

    const nextBlock = completedBlocks + 1;
    const blockInfo = todayShift === 'G' ? ` Block ${nextBlock}` : '';
    return { canCheckIn: true, canCheckOut: false, currentBlockLabel: blockInfo };
  }, [selectedDate, todayShift, todayRecords]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const todayStr = toIsoDate(new Date());
  const isSelectedToday = selectedDate === todayStr;
  const selectedData = calendarData.get(selectedDate);
  const selectedShiftType = isSelectedToday
    ? todayShift ?? 'OFF'
    : (selectedData?.shiftType ?? 'OFF');
  const selectedDayStatus = selectedData?.dayStatus ?? (isSelectedToday ? (todayShift ? 'SCHEDULED' : 'NO_SCHEDULE') : 'NO_SCHEDULE');
  const selectedRequestStatus = selectedData?.requestStatus ?? null;
  const selectedRequestId = selectedData?.requestId ?? null;
  const selectedRequestShiftType = selectedData?.requestShiftType ?? null;
  const selectedRequestAdminNote = selectedData?.requestAdminNote ?? null;
  const selectedRecords = isSelectedToday ? todayRecords : (selectedData?.records ?? []);
  const selectedRequestBlocks = selectedData?.selectedBlocks ?? null;
  const isSelectedFuture = selectedDate > todayStr;
  const isSelectedPast = selectedDate < todayStr;

  const handleSubmitShiftRequest = useCallback(async () => {
    if (!shiftRequestModal) return;
    try {
      if (selectedDayStatus === 'OFF') {
        Alert.alert('Ngày nghỉ', 'Ngày này là ngày nghỉ của bạn. Hãy nghỉ ngơi thật tốt.');
        return;
      }

      // NO_SCHEDULE vẫn cho phép đăng ký ca, nên không chặn ở đây.

      if (shiftRequestModal === 'G') {
        const normalized = normalizeSelectedBlocks(selectedGBlocks);
        if (normalized.length !== 2) {
          Alert.alert('Thiếu block', 'Ca Gãy phải chọn đúng 2 khung giờ.');
          return;
        }
        if (!isValidGSelection(normalized)) {
          Alert.alert(
            'Block không hợp lệ',
            'Ca Gãy chỉ cho phép các tổ hợp: G1 + G3, G1 + G4 hoặc G2 + G4. Không được chọn hai block liền kề.',
          );
          return;
        }
        await requestShift(selectedDate, 'G', normalized);
        Alert.alert('Thành công', 'Đã gửi yêu cầu đăng ký Ca Gãy.');
        setShiftRequestModal(null);
        setSelectedGBlocks([]);
        return;
      }

      const shiftName = shiftRequestModal === 'S' ? 'Ca Sáng' : 'Ca Chiều';
      await requestShift(selectedDate, shiftRequestModal);
      Alert.alert('Thành công', `Đã gửi yêu cầu đăng ký ${shiftName}.`);
      setShiftRequestModal(null);
    } catch (err: any) {
      console.error('[shift-request] submit failed', {
        shiftType: shiftRequestModal,
        selectedDate,
        selectedGBlocks,
        error: err?.message,
      });
      Alert.alert('Thất bại', err?.message || 'Lỗi khi đăng ký ca');
    }
  }, [requestShift, selectedDate, selectedGBlocks, shiftRequestModal, selectedDayStatus]);

  // Confirm → Execute → Show Result
  const handleConfirm = useCallback(async () => {
    const action = confirmModal;
    setConfirmModal(null);
    if (!action) return;

    const result =
      action === 'check-in' ? await performCheckIn() : await performCheckOut();

    showResultModal(result);
  }, [confirmModal, performCheckIn, performCheckOut, showResultModal]);

  const shiftLabel = todayShift ? SHIFT_LABELS[todayShift] ?? todayShift : null;

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="items-center justify-center py-4 border-b border-gray-100">
        <Text className="text-2xl font-outfit-bold text-slate-900">Chấm công</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        <View className="bg-slate-50 rounded-2xl px-4 py-3 mb-5">
          <View className="flex-row items-center mb-1">
            <Clock size={16} color="#16A34A" />
            <Text className="text-[15px] font-inter-bold text-slate-800 ml-2">
              {isSelectedToday ? 'Hôm nay' : `Chi tiết ngày ${formatDateVi(selectedDate)}`}
            </Text>
          </View>

          {isSelectedPast ? (
            <>
              {selectedDayStatus === 'NO_SCHEDULE' ? (
                <Text className="text-[14px] font-inter text-slate-500 mt-1">Không có lịch làm việc.</Text>
              ) : selectedShiftType === 'OFF' ? (
                <Text className="text-[14px] font-inter text-slate-500 mt-1">Off.</Text>
              ) : (
                <Text className="text-[14px] font-inter text-slate-500 mt-1">
                  {SHIFT_LABELS[String(selectedShiftType)] ?? String(selectedShiftType)}
                  {selectedShiftType === 'G' && selectedData?.selectedBlocks ? ` (${formatRequestBlocks(selectedData.selectedBlocks)})` : ''}
                </Text>
              )}

              {selectedRecords.length > 0 ? (
                selectedRecords.map((r) => (
                  <View key={r.id} className="flex-row items-center mt-1">
                    <Text className="text-[14px] font-inter text-slate-500 w-16">
                      {r.shiftType === 'G' ? `Block ${r.blockNumber}` : 'Ca'}:
                    </Text>
                    <Text className="text-[14px] font-inter text-slate-700">
                      Vào {formatTime(r.checkInAt)}
                      {r.checkInStatus === 'LATE' && (
                        <Text className="text-[14px] text-amber-500"> (Trễ)</Text>
                      )}
                    </Text>
                    <Text className="text-[14px] font-inter text-slate-700 ml-3">
                      — Ra {formatTime(r.checkOutAt)}
                      {r.checkOutStatus === 'EARLY' && (
                        <Text className="text-[14px] text-amber-500"> (Sớm)</Text>
                      )}
                      {r.checkOutStatus === 'LATE' && (
                        <Text className="text-[14px] text-red-500"> (Về trễ)</Text>
                      )}
                    </Text>
                  </View>
                ))
              ) : null}
            </>
          ) : isSelectedToday ? (
            <>
              <Text className="text-[14px] font-inter text-slate-500 mt-1">
                {todayShift && todayShift !== 'OFF' && todayShift !== 'P'
                  ? `${SHIFT_LABELS[String(todayShift)] ?? String(todayShift)}${todayShift === 'G' && selectedData?.selectedBlocks ? ` (${formatRequestBlocks(selectedData.selectedBlocks)})` : ''}`
                  : 'Không có ca hôm nay.'}
              </Text>

              {selectedRecords.length > 0 ? (
                selectedRecords.map((r) => (
                  <View key={r.id} className="flex-row items-center mt-1">
                    <Text className="text-[14px] font-inter text-slate-500 w-16">
                      {r.shiftType === 'G' ? `Block ${r.blockNumber}` : 'Ca'}:
                    </Text>
                    <Text className="text-[14px] font-inter text-slate-700">
                      Vào {formatTime(r.checkInAt)}
                      {r.checkInStatus === 'LATE' && (
                        <Text className="text-[14px] text-amber-500"> (Trễ)</Text>
                      )}
                    </Text>
                    <Text className="text-[14px] font-inter text-slate-700 ml-3">
                      — Ra {formatTime(r.checkOutAt)}
                      {r.checkOutStatus === 'EARLY' && (
                        <Text className="text-[14px] text-amber-500"> (Sớm)</Text>
                      )}
                      {r.checkOutStatus === 'LATE' && (
                        <Text className="text-[14px] text-red-500"> (Về trễ)</Text>
                      )}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-[12px] font-inter text-slate-400 mt-1">Chưa chấm công hôm nay</Text>
              )}
            </>
          ) : (
            <>
              {selectedDayStatus === 'SCHEDULED' && selectedShiftType !== 'OFF' ? (
                <Text className="text-[12px] font-inter text-slate-700 mt-1">
                  ✅ {(SHIFT_LABELS[String(selectedShiftType)] ?? String(selectedShiftType))} (Chưa tới ngày chấm công)
                </Text>
              ) : selectedRequestStatus === 'PENDING' ? (
                <>
                  <Text className="text-[14px] font-inter text-amber-600 mt-1">
                    ⏳ Đang chờ Admin duyệt đăng ký {SHIFT_LABELS[String(selectedRequestShiftType ?? '')] ?? String(selectedRequestShiftType ?? '')}
                  </Text>
                  {selectedRequestBlocks ? (
                    <Text className="text-[14px] font-inter text-slate-500 mt-1">
                      Block đã chọn: {formatRequestBlocks(selectedRequestBlocks)}
                    </Text>
                  ) : null}
                  <Pressable
                    disabled={isLoading || !selectedRequestId}
                    onPress={() => {
                      if (!selectedRequestId) return;
                      Alert.alert('Hủy đăng ký', 'Xác nhận hủy đơn đăng ký ca?', [
                        { text: 'Không', style: 'cancel' },
                        { text: 'Hủy', style: 'destructive', onPress: () => void cancelShiftRequest(Number(selectedRequestId)) },
                      ]);
                    }}
                    className="mt-3 px-4 py-2 rounded-xl bg-white border border-red-500 items-center"
                  >
                    <Text className="text-[13px] font-inter-bold text-red-500">Hủy đăng ký</Text>
                  </Pressable>
                </>
              ) : selectedShiftType === 'OFF' && selectedDayStatus === 'OFF' ? (
                <Text className="text-[14px] font-inter text-slate-500 mt-1">
                  Ngày này là ngày nghỉ của bạn. Hãy nghỉ ngơi thật tốt.
                </Text>
              ) : selectedDayStatus === 'NO_SCHEDULE' ? (
                <>
                  <Text className="text-[12px] font-inter text-slate-500 mt-1">
                    Ngày này chưa được phân lịch. Hãy thực hiện đăng ký ca.
                  </Text>
                  <View className="flex-row gap-2 mt-3">
                    {SHIFT_REQUEST_OPTIONS.map((option) => (
                      <Pressable
                        key={option.shiftType}
                        disabled={isLoading || !isSelectedFuture}
                        onPress={() => openShiftRequestModal(option.shiftType)}
                        className="flex-1 py-2 rounded-xl bg-white border border-[#16A34A] items-center"
                        style={{ opacity: isSelectedFuture ? 1 : 0.4 }}
                      >
                        <Text className="text-[15px] font-inter-bold text-[#16A34A]">{option.label}</Text>
                        <Text className="text-[11px] font-inter text-[#64748B] mt-0.5" numberOfLines={1}>
                          {option.detail}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  {selectedRequestStatus === 'REJECTED' ? (
                    <>
                      <Text className="text-[12px] font-inter text-red-600 mt-1">
                        ❌ Admin đã từ chối đơn đăng ký.
                      </Text>
                      {selectedRequestAdminNote ? (
                        <Text className="text-[12px] font-inter text-slate-500 mt-1">{selectedRequestAdminNote}</Text>
                      ) : null}
                    </>
                  ) : null}
                  <Text className="text-[14px] font-inter text-slate-500 mt-2">
                    Chưa có lịch. Bạn có thể đăng ký ca cho ngày này:
                  </Text>
                  <View className="flex-row gap-2 mt-3">
                    {SHIFT_REQUEST_OPTIONS.map((option) => (
                      <Pressable
                        key={option.shiftType}
                        disabled={isLoading || !isSelectedFuture}
                        onPress={() => openShiftRequestModal(option.shiftType)}
                        className="flex-1 py-2 rounded-xl bg-white border border-[#16A34A] items-center"
                        style={{ opacity: isSelectedFuture ? 1 : 0.4 }}
                      >
                        <Text className="text-[13px] font-inter-bold text-[#16A34A]">{option.label}</Text>
                        <Text className="text-[11px] font-inter text-[#64748B] mt-0.5" numberOfLines={1}>
                          {option.detail}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>

        {/* Calendar navigation */}
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

        {/* Calendar grid */}
        <View className="mb-6">
          <View className="flex-row mb-2">
            {WEEKDAYS.map((day) => (
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
              const dateStr = toIsoDate(date);
              const data = calendarData.get(dateStr);
              const status = data?.dayStatus || 'NO_SCHEDULE';
              const shiftType = String(data?.shiftType ?? 'OFF').toUpperCase();

              const isSelected = dateStr === selectedDate;
              const isOffOutline = status === 'OFF' || status === 'NO_SCHEDULE';
              const isAbsent = status === 'ABSENT';
              const isBlueScheduled = status === 'SCHEDULED' && shiftType !== 'OFF' && shiftType !== 'P';
              const bgColor = isOffOutline ? '#FFFFFF' : isBlueScheduled ? '#3B82F6' : getStatusColor(status);
              const textColor = isOffOutline ? '#94A3B8' : getStatusTextColor(status);
              const borderColor = isSelected ? '#0F172A' : isOffOutline ? '#E2E8F0' : isAbsent ? '#EF4444' : bgColor;
              const borderWidth = isSelected ? 2 : (isOffOutline || isAbsent) ? 1 : 0;

              return (
                <View key={dateStr} style={{ width: '14.28%', height: 56, padding: 3 }}>
                  <Pressable
                    className="flex-1 rounded-[10px] items-center justify-center"
                    style={{
                      backgroundColor: bgColor,
                      borderColor,
                      borderWidth,
                    }}
                    onPress={() => setSelectedDate(dateStr)}
                    hitSlop={6}
                  >
                    <Text
                      className="text-[13px] font-inter-bold"
                      style={{
                        color: textColor,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                    <Text
                      className="text-[11px] font-inter"
                      style={{
                        color: isOffOutline ? '#CBD5E1' : textColor,
                      }}
                    >
                      {isOffOutline ? 'Off' : shiftType}
                    </Text>
                    {shiftType === 'G' && data?.selectedBlocks && !isOffOutline ? (
                      <Text
                        className="text-[9px] font-inter leading-none"
                        style={{ color: textColor, opacity: 0.8 }}
                      >
                        {formatRequestBlocks(data.selectedBlocks).replace(/\s\+\s/g, '+')}
                      </Text>
                    ) : null}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Legend */}
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
            <View className="w-[14px] h-[14px] rounded-sm mr-2 bg-white border border-[#E2E8F0]" />
            <Text className="text-[13px] font-inter text-slate-800">Off / Không lịch</Text>
          </View>
        </View>

        <View className="h-px bg-slate-200 w-full mb-4" />

        <View className="flex-row flex-wrap mb-8">
          <Text className="w-1/3 text-[13px] font-inter text-slate-800 mb-2">S: Ca Sáng</Text>
          <Text className="w-1/3 text-[13px] font-inter text-slate-800 mb-2">C: Ca Chiều</Text>
          <Text className="w-1/3 text-[13px] font-inter text-slate-800 mb-2">G: Ca Gãy</Text>
          <Text className="w-1/3 text-[13px] font-inter text-slate-800">P: Phép/Công tác</Text>
          <Text className="w-2/3 text-[13px] font-inter text-slate-800">Gãy: chọn các block linh hoạt theo lịch</Text>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-4 pb-12">
          <Pressable
            disabled={!canCheckIn || isLoading}
            onPress={() => setConfirmModal('check-in')}
            className="flex-1 py-[14px] rounded-xl items-center flex-row justify-center gap-2 bg-[#16A34A]"
            style={{ opacity: canCheckIn ? 1 : 0.4 }}
          >
            {isLoading && canCheckIn ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LogIn size={18} color="#fff" />
                <Text className="text-[15px] font-inter-bold text-white">Vào ca</Text>
              </>
            )}
          </Pressable>

          <Pressable
            disabled={!canCheckOut || isLoading}
            onPress={() => setConfirmModal('check-out')}
            className="flex-1 py-[14px] rounded-xl items-center flex-row justify-center gap-2 border border-[#16A34A] bg-white"
            style={{ opacity: canCheckOut ? 1 : 0.4 }}
          >
            {isLoading && canCheckOut ? (
              <ActivityIndicator color="#16A34A" />
            ) : (
              <>
                <LogOut size={18} color="#16A34A" />
                <Text className="text-[15px] font-inter-bold text-[#16A34A]">Ra ca</Text>
              </>
            )}
          </Pressable>
        </View>

        {error ? (
          <Pressable onPress={clearError}>
            <Text className="text-xs text-red-500 text-center mb-6">{error}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal visible={shiftRequestModal !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white rounded-2xl w-full px-6 py-6">
            <Text className="text-[17px] font-inter-bold text-slate-900 mb-2 text-center">
              {shiftRequestModal === 'G' ? 'Chọn khung giờ Ca Gãy' : `Xác nhận đăng ký ${shiftRequestModal === 'S' ? 'Ca Sáng' : 'Ca Chiều'}`}
            </Text>

            <Text className="text-[13px] font-inter text-slate-500 text-center mb-4">
              {shiftRequestModal === 'G'
                ? `Chọn đúng 2 khung giờ cho ngày ${formatDateVi(selectedDate)}`
                : `${shiftRequestModal === 'S' ? 'Ca Sáng' : 'Ca Chiều'} cho ngày ${formatDateVi(selectedDate)}`}
            </Text>

            {shiftRequestModal === 'G' ? (
              <View className="gap-3 mb-5">
                {SHIFT_BLOCKS.map((block) => {
                  const checked = selectedGBlocks.includes(block.blockNumber);
                  return (
                    <Pressable
                      key={block.blockNumber}
                      onPress={() => {
                        setSelectedGBlocks((prev) =>
                          prev.includes(block.blockNumber)
                            ? prev.filter((n) => n !== block.blockNumber)
                            : prev.length >= 2
                              ? prev
                              : [...prev, block.blockNumber],
                        );
                      }}
                      className="flex-row items-center justify-between px-4 py-3 rounded-xl border"
                      style={{
                        borderColor: checked ? '#16A34A' : '#E2E8F0',
                        backgroundColor: checked ? '#DCFCE7' : '#FFFFFF',
                      }}
                    >
                      <Text className="text-[14px] font-inter text-slate-800">{block.label}</Text>
                      <Text className="text-[18px]">{checked ? '☑' : '☐'}</Text>
                    </Pressable>
                  );
                })}
                <Text className="text-[12px] font-inter text-slate-500 text-center">Đã chọn {selectedGBlocks.length}/2</Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 py-3 rounded-xl items-center border border-slate-200"
                onPress={() => {
                  setShiftRequestModal(null);
                  setSelectedGBlocks([]);
                }}
              >
                <Text className="text-[14px] font-inter-bold text-slate-600">Hủy</Text>
              </Pressable>
              <Pressable
                disabled={shiftRequestModal === 'G' && selectedGBlocks.length !== 2}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: '#16A34A',
                  opacity: shiftRequestModal === 'G' && selectedGBlocks.length !== 2 ? 0.4 : 1,
                }}
                onPress={() => void handleSubmitShiftRequest()}
              >
                <Text className="text-[14px] font-inter-bold text-white">Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Confirmation Modal ─── */}
      <Modal visible={confirmModal !== null} transparent animationType="fade">
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <View className="bg-white rounded-2xl w-full px-6 py-6 items-center">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-4"
              style={{
                backgroundColor:
                  confirmModal === 'check-in' ? '#DCFCE7' : '#FEF3C7',
              }}
            >
              {confirmModal === 'check-in' ? (
                <LogIn size={28} color="#16A34A" />
              ) : (
                <LogOut size={28} color="#F59E0B" />
              )}
            </View>

            <Text className="text-[17px] font-inter-bold text-slate-900 mb-1">
              {confirmModal === 'check-in' ? 'Xác nhận VÀO CA' : 'Xác nhận RA CA'}
            </Text>

            <Text className="text-[13px] font-inter text-slate-500 text-center mb-1">
              {shiftLabel ?? 'Không có ca'}
              {currentBlockLabel ? ` — ${currentBlockLabel}` : ''}
            </Text>

            <Text className="text-[13px] font-inter text-slate-500 mb-5">
              Thời gian: {timeStr}
            </Text>

            <View className="flex-row gap-3 w-full">
              <Pressable
                className="flex-1 py-3 rounded-xl items-center border border-slate-200"
                onPress={() => setConfirmModal(null)}
              >
                <Text className="text-[14px] font-inter-bold text-slate-600">Huỷ</Text>
              </Pressable>
              <Pressable
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor:
                    confirmModal === 'check-in' ? '#16A34A' : '#F59E0B',
                }}
                onPress={handleConfirm}
              >
                <Text className="text-[14px] font-inter-bold text-white">Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Result Modal (Success / Error) ─── */}
      <Modal visible={resultModal !== null} transparent animationType="none">
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <Animated.View
            style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}
            className="bg-white rounded-2xl w-full px-6 py-6 items-center"
          >
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-4"
              style={{
                backgroundColor: resultModal?.success ? '#DCFCE7' : '#FEE2E2',
              }}
            >
              <Text className="text-[28px]">
                {resultModal?.success ? '✅' : '❌'}
              </Text>
            </View>

            <Text className="text-[17px] font-inter-bold text-slate-900 mb-2 text-center">
              {resultModal?.success ? 'Thành công' : 'Thất bại'}
            </Text>

            <Text className="text-[14px] font-inter text-slate-600 text-center mb-5 leading-5">
              {resultModal?.message}
            </Text>

            <Pressable
              className="w-full py-3 rounded-xl items-center"
              style={{
                backgroundColor: resultModal?.success ? '#16A34A' : '#EF4444',
              }}
              onPress={closeResultModal}
            >
              <Text className="text-[14px] font-inter-bold text-white">Đóng</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
