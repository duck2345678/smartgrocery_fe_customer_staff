import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Card from '../../../src/components/ui/Card';
import { useStaffHomeStore } from '../../../src/store/staffHomeStore';
import { staffOrdersApi, type StaffCompletedOrderItem } from '../../../src/api/staffOrders';

type Period = 'DAY' | 'WEEK' | 'MONTH';

export default function StaffPerformanceScreen() {
  const router = useRouter();
  const selectedDateIso = useStaffHomeStore((s) => s.selectedDateIso);
  const setSelectedDateIso = useStaffHomeStore((s) => s.setSelectedDateIso);
  const [period, setPeriod] = useState<Period>('DAY');

  const fetchRangePerformance = useCallback(async (fromIso: string, toIso: string) => {
    const dates = listIsoDates(fromIso, toIso);
    const daily = await Promise.all(dates.map((d) => staffOrdersApi.getPerformanceDaily(d)));
    const orders = daily
      .flatMap((x) => x.orders ?? [])
      .filter((o): o is StaffCompletedOrderItem => Boolean(o && Number.isFinite(o.orderId)))
      .reduce(
        (acc, o) => {
          if (!acc.map.has(o.orderId)) {
            acc.map.set(o.orderId, o);
            acc.list.push(o);
          }
          return acc;
        },
        { map: new Map<number, StaffCompletedOrderItem>(), list: [] as StaffCompletedOrderItem[] },
      )
      .list.slice()
      .sort((a, b) => String(b.completedAt ?? '').localeCompare(String(a.completedAt ?? '')));
    return { completedCount: orders.length, orders };
  }, []);

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

  const summary = performanceSummaryQuery.data ?? null;

  const weekRangeQuery = useQuery({
    queryKey: ['staff-performance-week-range', summary?.weekFrom, summary?.weekTo],
    enabled: Boolean(summary?.weekFrom && summary?.weekTo),
    queryFn: () => fetchRangePerformance(summary!.weekFrom, summary!.weekTo),
    staleTime: 30 * 1000,
  });

  const monthRangeQuery = useQuery({
    queryKey: ['staff-performance-month-range', summary?.monthFrom, summary?.monthTo],
    enabled: Boolean(summary?.monthFrom && summary?.monthTo),
    queryFn: () => fetchRangePerformance(summary!.monthFrom, summary!.monthTo),
    staleTime: 30 * 1000,
  });

  const range = useMemo(() => {
    if (period === 'WEEK' && summary?.weekFrom && summary?.weekTo) {
      return {
        from: summary.weekFrom,
        to: summary.weekTo,
        label: 'Tuần',
        hint: `${formatIsoToDmy(summary.weekFrom)} → ${formatIsoToDmy(summary.weekTo)}`,
      };
    }
    if (period === 'MONTH' && summary?.monthFrom && summary?.monthTo) {
      return {
        from: summary.monthFrom,
        to: summary.monthTo,
        label: 'Tháng',
        hint: `${formatIsoToDmy(summary.monthFrom)} → ${formatIsoToDmy(summary.monthTo)}`,
      };
    }
    return { from: selectedDateIso, to: selectedDateIso, label: 'Ngày', hint: selectedDateIso };
  }, [period, selectedDateIso, summary]);

  const rangeQuery = useQuery({
    queryKey: ['staff-performance-range', period, range.from, range.to],
    enabled: period !== 'DAY' && Boolean(range.from) && Boolean(range.to),
    queryFn: () => fetchRangePerformance(range.from, range.to),
    staleTime: 30 * 1000,
  });

  const refreshPerformance = useCallback(() => {
    void performanceDailyQuery.refetch();
    void performanceSummaryQuery.refetch();
    if (period === 'WEEK') void weekRangeQuery.refetch();
    if (period === 'MONTH') void monthRangeQuery.refetch();
    void rangeQuery.refetch();
  }, [period, performanceDailyQuery.refetch, performanceSummaryQuery.refetch, weekRangeQuery.refetch, monthRangeQuery.refetch, rangeQuery.refetch]);

  useFocusEffect(
    useCallback(() => {
      // Reset to today whenever entering this screen
      setSelectedDateIso(toIsoLocal(new Date()));
      refreshPerformance();
    }, [refreshPerformance, setSelectedDateIso])
  );

  const listTitle = useMemo(() => {
    if (period === 'WEEK') return 'Đơn đã hoàn thành (tuần)';
    if (period === 'MONTH') return 'Đơn đã hoàn thành (tháng)';
    return 'Đơn đã hoàn thành (ngày)';
  }, [period]);

  const listLoading = period === 'DAY' ? performanceDailyQuery.isLoading : rangeQuery.isLoading || performanceSummaryQuery.isLoading;
  const listError = period === 'DAY' ? performanceDailyQuery.isError : Boolean(rangeQuery.isError || performanceSummaryQuery.isError);
  const listOrders = useMemo(() => {
    if (period === 'DAY') return performanceDailyQuery.data?.orders ?? [];
    return rangeQuery.data?.orders ?? [];
  }, [period, performanceDailyQuery.data?.orders, rangeQuery.data?.orders]);

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
            <KpiBox label="Ngày" value={performanceDailyQuery.data ? String(performanceDailyQuery.data.completedCount) : '—'} isLoading={performanceDailyQuery.isLoading} />
            <KpiBox label="Tuần" value={weekRangeQuery.data ? String(weekRangeQuery.data.completedCount) : '—'} isLoading={performanceSummaryQuery.isLoading || weekRangeQuery.isLoading} />
            <KpiBox label="Tháng" value={monthRangeQuery.data ? String(monthRangeQuery.data.completedCount) : '—'} isLoading={performanceSummaryQuery.isLoading || monthRangeQuery.isLoading} />
          </View>

          <View className="mt-4 flex-row" style={{ gap: 10 }}>
            {['DAY', 'WEEK', 'MONTH'].map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p as Period)}
                className={period === p ? 'flex-1 px-3 py-3 rounded-2xl bg-primary' : 'flex-1 px-3 py-3 rounded-2xl bg-background border border-border'}
              >
                <Text className={period === p ? 'text-center font-inter-bold text-primary-fg' : 'text-center font-inter-bold text-text'}>
                  {p === 'DAY' ? 'Ngày' : p === 'WEEK' ? 'Tuần' : 'Tháng'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-4">
            <Text className="text-xs font-inter text-muted">
              {listTitle} • {period === 'DAY' ? formatIsoToDmy(selectedDateIso) : range.hint}
            </Text>
            {listLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator />
                <Text className="text-xs font-inter text-muted mt-2">Đang tải hiệu suất…</Text>
              </View>
            ) : listError ? (
              <View className="py-4">
                <Text className="text-sm font-inter text-danger">Không tải được hiệu suất. Vui lòng thử lại.</Text>
                <Pressable onPress={refreshPerformance} className="mt-3 px-4 py-3 rounded-2xl bg-primary items-center">
                  <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
                </Pressable>
              </View>
            ) : listOrders.length === 0 ? (
              <View className="py-6">
                <Text className="text-sm font-inter text-muted">Chưa có đơn hoàn thành trong thời gian này.</Text>
              </View>
            ) : (
              <View className="mt-3" style={{ gap: 10 }}>
                {listOrders.map((o) => (
                  <Pressable
                    key={o.orderId}
                    onPress={() => router.push(`/(staff)/performance/order/${o.orderId}`)}
                    className="px-4 py-3 rounded-2xl bg-surface border border-border"
                  >
                    <View className="flex-row items-start justify-between">
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text className="font-inter-bold text-text" numberOfLines={1}>#{o.orderNumber || o.orderId}</Text>
                        <Text className="text-xs font-inter text-muted mt-1" numberOfLines={1}>Hoàn tất lúc {formatTime(o.completedAt)}</Text>
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

function CalendarPicker({ selectedDateIso, onSelectDateIso }: { selectedDateIso: string; onSelectDateIso: (v: string) => void }) {
  const selected = useMemo(() => fromIsoLocal(selectedDateIso), [selectedDateIso]);
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const monthLabel = useMemo(() => cursor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }), [cursor]);
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const grid = buildMonthGrid(cursor);
  const todayIso = toIsoLocal(new Date());

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="w-10 h-10 rounded-2xl bg-background border border-border items-center justify-center">
          <ChevronLeft size={18} color="#0F172A" />
        </Pressable>
        <Text className="font-inter-bold text-text">{monthLabel}</Text>
        <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="w-10 h-10 rounded-2xl bg-background border border-border items-center justify-center">
          <ChevronRight size={18} color="#0F172A" />
        </Pressable>
      </View>
      <View className="mt-3 flex-row justify-between">{weekDays.map((d) => (<Text key={d} className="w-10 text-center text-[11px] font-inter text-muted">{d}</Text>))}</View>
      <View className="mt-2" style={{ gap: 8 }}>
        {grid.map((row, r) => (
          <View key={r} className="flex-row justify-between">
            {row.map((cell, c) => {
              if (!cell) return <View key={c} style={{ width: 40, height: 40 }} />;
              const iso = toIsoLocal(cell);
              const isSelected = iso === selectedDateIso;
              return (
                <Pressable key={c} onPress={() => onSelectDateIso(iso)} className={isSelected ? 'w-10 h-10 rounded-2xl bg-primary items-center justify-center' : 'w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center'}>
                  <Text className={isSelected ? 'font-inter-bold text-primary-fg' : 'font-inter text-text'}>{cell.getDate()}</Text>
                  {iso === todayIso && !isSelected && <View className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function KpiBox({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) {
  return (
    <View className="flex-1 bg-background border border-border rounded-2xl px-3 py-3">
      <Text className="text-[11px] font-inter text-muted">{label}</Text>
      <View className="mt-1 flex-row items-center" style={{ gap: 8 }}>
        {isLoading && <ActivityIndicator size="small" />}
        <Text className="text-lg font-outfit-bold text-text">{value}</Text>
      </View>
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = String(status || '').toUpperCase() === 'PICKED' ? 'Hoàn tất' : status || '—';
  return (
    <View className="px-3 py-2 rounded-full bg-background border border-border">
      <Text className="text-xs font-inter-bold text-text">{label}</Text>
    </View>
  );
}

function buildMonthGrid(cursor: Date): Array<Array<Date | null>> {
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const firstDay = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells: Array<Date | null> = Array(firstDay).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d));
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  while (rows.length < 6) rows.push(Array(7).fill(null));
  return rows;
}

function listIsoDates(fromIso: string, toIso: string): string[] {
  const dates: string[] = [];
  const start = fromIsoLocal(fromIso);
  const end = fromIsoLocal(toIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return dates;
  let current = start;
  let maxDays = 100; // prevent infinite loops
  while (current <= end && maxDays > 0) {
    dates.push(toIsoLocal(current));
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
    maxDays--;
  }
  return dates;
}

function toIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromIsoLocal(iso: string): Date {
  const parts = iso.split('-').map(Number);
  return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
}

function formatIsoToDmy(iso: string): string {
  const parts = String(iso || '').split('-');
  if (parts.length < 3) return '—';
  return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
