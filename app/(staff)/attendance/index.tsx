import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import { useStaffAttendanceStore } from '../../../src/store/staffAttendanceStore';

export default function StaffAttendanceScreen() {
  const checkInAt = useStaffAttendanceStore((s) => s.checkInAt);
  const checkOutAt = useStaffAttendanceStore((s) => s.checkOutAt);
  const note = useStaffAttendanceStore((s) => s.note);
  const setNote = useStaffAttendanceStore((s) => s.setNote);
  const checkIn = useStaffAttendanceStore((s) => s.checkIn);
  const checkOut = useStaffAttendanceStore((s) => s.checkOut);
  const resetToday = useStaffAttendanceStore((s) => s.resetToday);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCheckIn = !checkInAt && !isSubmitting;
  const canCheckOut = Boolean(checkInAt) && !checkOutAt && !isSubmitting;

  const shiftLabel = useMemo(() => {
    if (!checkInAt) return 'Chưa vào ca';
    const inStr = new Date(checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (!checkOutAt) return `Đang trong ca • Vào lúc ${inStr}`;
    const outStr = new Date(checkOutAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `Đã kết thúc ca • ${inStr} → ${outStr}`;
  }, [checkInAt, checkOutAt]);

  const validate = (): string | null => {
    if (note.trim().length > 200) return 'Ghi chú tối đa 200 ký tự.';
    return null;
  };

  const simulate = async (fn: () => void) => {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 550));
      fn();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Chấm công', headerShown: false }} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}>
        <View>
          <Text className="text-xl font-outfit-bold text-text">Chấm công</Text>
          <Text className="text-xs font-inter text-muted mt-1">{shiftLabel}</Text>
        </View>

        <Card className="p-4">
          <Text className="font-inter-bold text-text">Ghi chú ca làm</Text>
          <Text className="text-xs font-inter text-muted mt-1">Không bắt buộc. Dùng để ghi chú bàn giao hoặc phát sinh.</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="VD: Hỗ trợ quầy 2, bàn giao cho ca tối…"
            placeholderTextColor="#94A3B8"
            multiline
            className="mt-3 px-4 py-3 rounded-2xl border border-border bg-surface font-inter text-text"
            style={{ minHeight: 96 }}
          />
          <Text className="text-[11px] font-inter text-muted mt-2">{note.trim().length}/200</Text>
          {error ? <Text className="text-xs font-inter text-danger mt-2">{error}</Text> : null}
        </Card>

        <Card className="p-4">
          <View className="flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Pressable
                disabled={!canCheckIn}
                onPress={() => simulate(() => checkIn(Date.now()))}
                className={canCheckIn ? 'px-4 py-4 rounded-2xl bg-primary items-center' : 'px-4 py-4 rounded-2xl bg-surface border border-border items-center'}
              >
                <Text className={canCheckIn ? 'font-outfit-bold text-primary-fg' : 'font-outfit-bold text-text'}>
                  {isSubmitting ? 'Đang xử lý…' : 'Vào ca'}
                </Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Pressable
                disabled={!canCheckOut}
                onPress={() =>
                  Alert.alert('Ra ca', 'Xác nhận kết thúc ca làm?', [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Ra ca', style: 'destructive', onPress: () => void simulate(() => checkOut(Date.now())) },
                  ])
                }
                className={canCheckOut ? 'px-4 py-4 rounded-2xl bg-surface border border-border items-center' : 'px-4 py-4 rounded-2xl bg-surface border border-border items-center'}
              >
                <Text className="font-outfit-bold text-text">{isSubmitting ? 'Đang xử lý…' : 'Ra ca'}</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert('Xoá trạng thái', 'Xoá dữ liệu chấm công hôm nay trên thiết bị?', [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xoá', style: 'destructive', onPress: () => resetToday() },
              ])
            }
            className="mt-3 px-4 py-3 rounded-2xl bg-transparent items-center"
          >
            <Text className="text-sm font-inter-bold text-muted">Xoá trạng thái hôm nay</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
