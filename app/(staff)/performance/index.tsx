import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { useStaffHomeStore } from '../../../src/store/staffHomeStore';
import { staffOrdersApi } from '../../../src/api/staffOrders';

export default function StaffPerformanceScreen() {
  const router = useRouter();
  const selectedDateIso = useStaffHomeStore((s) => s.selectedDateIso);
  const setSelectedDateIso = useStaffHomeStore((s) => s.setSelectedDateIso);

  const performanceDailyQuery = useQuery({
    queryKey: ['staff-performance-daily', selectedDateIso],
    queryFn: () => staffOrdersApi.getPerformanceDaily(selectedDateIso),
    staleTime: 30 * 1000,
  });

  const performanceSummaryQuery = useQuery({
    queryKey: ['staff-performance-summary', selectedDateIso],
    queryFn: () => staffOrdersApi.getPerformanceSummary(selectedDateIso),
    staleTime: 30 * 1000,
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4 pt-4 pb-2 flex-row items-center">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center mr-3">
          <ChevronLeft size={20} color="#0F172A" />
        </Pressable>
        <View>
          <Text className="text-xl font-outfit-bold text-text">Hiệu suất công việc</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">Theo dõi đơn hoàn thành theo ngày/tuần/tháng.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Card className="p-4">
          <CalendarPicker selectedDateIso={selectedDateIso} onSelectDateIso={setSelectedDateIso} />

          <View className="mt-4 flex-row" style={{ gap: 12 }}>
            <KpiBox
              label="Hoàn thành (ngày)"
              value={performanceDailyQuery.data ? String(performanceDailyQuery.data.completedCount) : '—'}
              isLoading={performanceDailyQuery.isLoading}
            />
            <KpiBox
              label="Tuần"
              value={performanceSummaryQuery.data ? String(performanceSummaryQuery.data.weekCompletedCount) : '—'}
              isLoading={performanceSummaryQuery.isLoading}
              hint={performanceSummaryQuery.data ? `${performanceSummaryQuery.data.weekFrom} → ${performanceSummaryQuery.data.weekTo}` : undefined}
            />
            <KpiBox
              label="Tháng"
              value={performanceSummaryQuery.data ? String(performanceSummaryQuery.data.monthCompletedCount) : '—'}
              isLoading={performanceSummaryQuery.isLoading}
              hint={performanceSummaryQuery.data ? `${performanceSummaryQuery.data.monthFrom} → ${performanceSummaryQuery.data.monthTo}` : undefined}
            />
          </View>

          <View className="mt-4">
            <Text className="text-xs font-inter text-muted">Đơn đã hoàn thành</Text>
            {performanceDailyQuery.isLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator />
                <Text className="text-xs font-inter text-muted mt-2">Đang tải hiệu suất…</Text>
              </View>
            ) : performanceDailyQuery.isError ? (
              <View className="py-4">
                <Text className="text-sm font-inter text-danger">Không tải được hiệu suất. Vui lòng thử lại.</Text>
                <Pressable
                  onPress={() => void performanceDailyQuery.refetch()}
                  className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center"
                >
                  <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
                </Pressable>
              </View>
            ) : (performanceDailyQuery.data?.orders ?? []).length === 0 ? (
              <View className="py-6">
                <Text className="text-sm font-inter text-muted">Chưa có đơn hoàn thành trong ngày này.</Text>
              </View>
            ) : (
              <View className="mt-3" style={{ gap: 10 }}>
                {(performanceDailyQuery.data?.orders ?? []).map((o) => (
                  <Pressable
                    key={o.orderId}
                    onPress={() => router.push(`/(staff)/orders/${o.orderId}` as never)}
                    className="px-4 py-3 rounded-2xl bg-surface border border-border"
                  >
                    <View className="flex-row items-start justify-between">
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text className="font-inter-bold text-text" numberOfLines={1}>
                          #{o.orderNumber || o.orderId}
                        </Text>
                        <Text className="text-xs font-inter text-muted mt-1" numberOfLines={1}>
                          Hoàn tất lúc {formatTime(o.completedAt)}
                        </Text>
                      </View>
                      <StatusPill status={o.status} />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function CalendarPicker({
  selectedDateIso,
  onSelectDateIso,
}: {
  selectedDateIso: string;
  onSelectDateIso: (value: string) => void;
}) {
  const selected = useMemo(() => fromIsoLocal(selectedDateIso), [selectedDateIso]);
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  const monthLabel = useMemo(
    () => cursor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
    [cursor]
  );

  const weekDays = useMemo(() => ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], []);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const todayIso = useMemo(() => toIsoLocal(new Date()), []);

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Pressable
          testID="calendar-prev"
          onPress={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="w-10 h-10 rounded-2xl bg-background border border-border items-center justify-center"
        >
          <ChevronLeft size={18} color="#0F172A" />
        </Pressable>
        <Text className="font-inter-bold text-text">{capitalize(monthLabel)}</Text>
        <Pressable
          testID="calendar-next"
          onPress={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="w-10 h-10 rounded-2xl bg-background border border-border items-center justify-center"
        >
          <ChevronRight size={18} color="#0F172A" />
        </Pressable>
      </View>

      <View className="mt-3 flex-row justify-between">
        {weekDays.map((d) => (
          <Text key={d} className="w-10 text-center text-[11px] font-inter text-muted">
            {d}
          </Text>
        ))}
      </View>

      <View className="mt-2" style={{ gap: 8 }}>
        {grid.map((row, r) => (
          <View key={`r-${r}`} className="flex-row justify-between">
            {row.map((cell, c) => {
              if (!cell) return <View key={`c-${c}`} style={{ width: 40, height: 40 }} />;
              const iso = toIsoLocal(cell);
              const isSelected = iso === selectedDateIso;
              const isToday = iso === todayIso;
              return (
                <Pressable
                  key={`c-${c}`}
                  testID={`calendar-day-${iso}`}
                  onPress={() => onSelectDateIso(iso)}
                  className={
                    isSelected
                      ? 'w-10 h-10 rounded-2xl bg-primary items-center justify-center'
                      : 'w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center'
                  }
                >
                  <Text className={isSelected ? 'font-inter-bold text-primary-fg' : 'font-inter text-text'}>
                    {cell.getDate()}
                  </Text>
                  {isToday && !isSelected ? <View className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function KpiBox({ label, value, isLoading, hint }: { label: string; value: string; isLoading: boolean; hint?: string }) {
  return (
    <View className="flex-1 bg-background border border-border rounded-2xl px-3 py-3">
      <Text className="text-[11px] font-inter text-muted">{label}</Text>
      <View className="mt-1 flex-row items-center" style={{ gap: 8 }}>
        {isLoading ? <ActivityIndicator size="small" /> : null}
        <Text className="text-lg font-outfit-bold text-text">{value}</Text>
      </View>
      {hint ? (
        <Text className="text-[10px] font-inter text-muted mt-1" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = String(status || '').toUpperCase();
  const label = s === 'PICKED' ? 'Hoàn tất' : status || '—';
  return (
    <View className="px-3 py-2 rounded-full bg-background border border-border">
      <Text className="text-xs font-inter-bold text-text">{label}</Text>
    </View>
  );
}

function buildMonthGrid(monthCursor: Date): Array<Array<Date | null>> {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const first = new Date(year, month, 1);
  const firstDay = ((first.getDay() + 6) % 7) as number;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));

  const rows: Array<Array<Date | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  while (rows.length < 6) rows.push(new Array(7).fill(null));
  return rows;
}

function toIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatTime(isoOrDateTime: string): string {
  const d = new Date(isoOrDateTime);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function capitalize(v: string) {
  if (!v) return v;
  return v.slice(0, 1).toUpperCase() + v.slice(1);
}
