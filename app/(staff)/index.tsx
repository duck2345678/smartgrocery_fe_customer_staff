import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, ClipboardList, Clock, User, TrendingUp, Inbox, AlertCircle, ChevronLeft, ChevronRight, BookOpen, CalendarDays } from 'lucide-react-native';
import Card from '../../src/components/ui/Card';
import { useAuthStore } from '../../src/store/authStore';
import { staffOrdersApi } from '../../src/api/staffOrders';
import { staffIssuesApi } from '../../src/api/staffIssues';
import { useStaffHomeStore } from '../../src/store/staffHomeStore';

export default function StaffHomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const promoIndex = useStaffHomeStore((s) => s.promoIndex);
  const setPromoIndex = useStaffHomeStore((s) => s.setPromoIndex);
  const selectedDateIso = useStaffHomeStore((s) => s.selectedDateIso);
  const setSelectedDateIso = useStaffHomeStore((s) => s.setSelectedDateIso);
  const handbookOpenCategoryIds = useStaffHomeStore((s) => s.handbookOpenCategoryIds);
  const toggleHandbookCategory = useStaffHomeStore((s) => s.toggleHandbookCategory);

  const queueQuery = useQuery({
    queryKey: ['staff-order-queue'],
    queryFn: () => staffOrdersApi.getQueue(),
    staleTime: 5000,
  });

  const myActiveQuery = useQuery({
    queryKey: ['staff-order-my-active'],
    queryFn: () => staffOrdersApi.getMyActive(),
    staleTime: 5000,
  });

  const issuesQuery = useQuery({
    queryKey: ['staff-issues-my'],
    queryFn: () => staffIssuesApi.my(),
    staleTime: 5000,
  });

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

  const openIssuesCount = useMemo(() => {
    const list = issuesQuery.data ?? [];
    return list.filter((x) => (x.status ?? '').toUpperCase() === 'OPEN').length;
  }, [issuesQuery.data]);

  const queueCount = queueQuery.data?.length ?? 0;
  const hasActive = Boolean(myActiveQuery.data);

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
            <Text className="mt-1 text-sm font-inter text-muted">Trang tổng quan ca làm và công việc.</Text>
          </View>
          <View className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center">
            <TrendingUp size={18} color="#16A34A" />
          </View>
        </View>

        <View className="mt-4 flex-row" style={{ gap: 12 }}>
          <StatPill icon={<Inbox size={16} color="#0F172A" />} label="Hàng chờ" value={String(queueCount)} />
          <StatPill icon={<ClipboardList size={16} color="#0F172A" />} label="Đang xử lý" value={hasActive ? '1' : '0'} />
          <StatPill icon={<AlertCircle size={16} color="#0F172A" />} label="Sự cố" value={String(openIssuesCount)} />
        </View>

        <View className="mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            <PromoCard
              active={promoIndex === 0}
              title="Tập trung đúng việc"
              subtitle="Giao diện mới tối giản module, chỉ giữ những gì cần cho ca làm."
              onPress={() => setPromoIndex(0)}
            />
            <PromoCard
              active={promoIndex === 1}
              title="Nhanh và rõ ràng"
              subtitle="Mỗi tab có state riêng, loading/error/validation nhất quán."
              onPress={() => setPromoIndex(1)}
            />
          </ScrollView>
        </View>

        <View className="mt-6">
          <Text className="text-sm font-inter-bold text-text">Truy cập nhanh</Text>
          <View className="mt-3" style={{ gap: 12 }}>
            <View className="flex-row" style={{ gap: 12 }}>
              <QuickAction icon={<Package size={22} color="#16A34A" />} title="Sản phẩm" subtitle="Tra cứu nhanh" onPress={() => router.push('/(staff)/products' as never)} />
              <QuickAction icon={<ClipboardList size={22} color="#16A34A" />} title="Đơn hàng" subtitle="Nhận & theo dõi" onPress={() => router.push('/(staff)/orders' as never)} />
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <QuickAction icon={<Clock size={22} color="#16A34A" />} title="Chấm công" subtitle="Vào ca / ra ca" onPress={() => router.push('/(staff)/attendance' as never)} />
              <QuickAction icon={<User size={22} color="#16A34A" />} title="Cá nhân" subtitle="Tài khoản & tuỳ chọn" onPress={() => router.push('/(staff)/profile' as never)} />
            </View>
          </View>
        </View>

        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center">
                <BookOpen size={18} color="#16A34A" />
              </View>
              <View>
                <Text className="text-sm font-inter-bold text-text">Sổ tay công việc</Text>
                <Text className="text-xs font-inter text-muted mt-0.5">Hướng dẫn nhanh theo từng nhóm tác vụ.</Text>
              </View>
            </View>
          </View>
          <Card className="p-4 mt-3">
            <HandbookCategory
              id="getting-started"
              title="Bắt đầu"
              isOpen={handbookOpenCategoryIds.includes('getting-started')}
              onToggle={() => toggleHandbookCategory('getting-started')}
              items={[
                'Đăng nhập bằng tài khoản được cấp.',
                'Kiểm tra 5 tab: Trang chủ, Sản phẩm, Đơn hàng, Chấm công, Cá nhân.',
                'Nếu không tải được dữ liệu: kiểm tra mạng và bấm Tải lại.',
              ]}
            />
            <Divider />
            <HandbookCategory
              id="orders"
              title="Đơn hàng"
              isOpen={handbookOpenCategoryIds.includes('orders')}
              onToggle={() => toggleHandbookCategory('orders')}
              items={[
                'Vào tab Đơn hàng để xem hàng chờ và đơn đang xử lý.',
                'Nhận đơn từ hàng chờ, sau đó mở chi tiết để xem danh sách mặt hàng.',
                'Hoàn tất đơn: kiểm tra đủ số lượng, tránh nhầm SKU và kệ.',
              ]}
            />
            <Divider />
            <HandbookCategory
              id="products"
              title="Sản phẩm"
              isOpen={handbookOpenCategoryIds.includes('products')}
              onToggle={() => toggleHandbookCategory('products')}
              items={[
                'Dùng ô tìm kiếm để tra cứu nhanh theo tên.',
                'Lọc theo danh mục để giảm nhiễu khi danh sách dài.',
                'Mở chi tiết để xem giá và tồn kho hiện tại.',
              ]}
            />
            <Divider />
            <HandbookCategory
              id="attendance"
              title="Chấm công"
              isOpen={handbookOpenCategoryIds.includes('attendance')}
              onToggle={() => toggleHandbookCategory('attendance')}
              items={[
                'Vào ca khi bắt đầu làm việc.',
                'Ra ca khi kết thúc ca.',
                'Ghi chú tối đa 200 ký tự (không bắt buộc).',
              ]}
            />
            <Divider />
            <HandbookCategory
              id="troubleshooting"
              title="Xử lý sự cố"
              isOpen={handbookOpenCategoryIds.includes('troubleshooting')}
              onToggle={() => toggleHandbookCategory('troubleshooting')}
              items={[
                'Nếu không thấy đơn: thử chuyển qua lại Hàng chờ/Đang xử lý và tải lại.',
                'Nếu API báo lỗi: chụp màn hình và báo quản trị.',
                'Nếu bị đăng xuất: đăng nhập lại và kiểm tra quyền tài khoản.',
              ]}
            />
          </Card>
        </View>

        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <View className="w-10 h-10 rounded-2xl bg-surface border border-border items-center justify-center">
                <CalendarDays size={18} color="#16A34A" />
              </View>
              <View>
                <Text className="text-sm font-inter-bold text-text">Hiệu suất công việc</Text>
                <Text className="text-xs font-inter text-muted mt-0.5">Theo dõi đơn hoàn thành theo ngày/tuần/tháng.</Text>
              </View>
            </View>
          </View>

          <Card className="p-4 mt-3">
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
        </View>

        {queueQuery.isError || myActiveQuery.isError || issuesQuery.isError ? (
          <Card className="p-4 mt-6">
            <Text className="font-inter-bold text-text">Không tải được dữ liệu.</Text>
            <Text className="text-xs font-inter text-muted mt-1">Kiểm tra mạng và thử lại.</Text>
            <Pressable
              onPress={() => {
                void queueQuery.refetch();
                void myActiveQuery.refetch();
                void issuesQuery.refetch();
              }}
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

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-2xl px-3 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {icon}
          <Text className="text-xs font-inter text-muted">{label}</Text>
        </View>
        <Text className="text-lg font-outfit-bold text-text">{value}</Text>
      </View>
    </View>
  );
}

function PromoCard({ title, subtitle, active, onPress }: { title: string; subtitle: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: 280 }} className={active ? 'bg-surface border border-primary rounded-3xl p-4' : 'bg-surface border border-border rounded-3xl p-4'}>
      <Text className="font-outfit-bold text-text">{title}</Text>
      <Text className="text-xs font-inter text-muted mt-1">{subtitle}</Text>
    </Pressable>
  );
}

function QuickAction({ icon, title, subtitle, onPress }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 bg-surface border border-border rounded-3xl p-4">
      <View className="w-11 h-11 rounded-2xl bg-background border border-border items-center justify-center">{icon}</View>
      <Text className="mt-3 font-outfit-bold text-text">{title}</Text>
      <Text className="mt-1 text-xs font-inter text-muted">{subtitle}</Text>
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-border my-3" />;
}

function HandbookCategory({
  id,
  title,
  isOpen,
  onToggle,
  items,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  items: string[];
}) {
  return (
    <View>
      <Pressable testID={`handbook-toggle-${id}`} onPress={onToggle} className="flex-row items-center justify-between py-1">
        <Text className="font-inter-bold text-text">{title}</Text>
        <Text className="text-xs font-inter text-muted">{isOpen ? 'Thu gọn' : 'Mở'}</Text>
      </Pressable>
      {isOpen ? (
        <View className="mt-2" style={{ gap: 8 }}>
          {items.map((t, idx) => (
            <View key={`${id}-${idx}`} className="flex-row" style={{ gap: 10 }}>
              <View className="w-6 h-6 rounded-full bg-background border border-border items-center justify-center">
                <Text className="text-[11px] font-inter-bold text-text">{idx + 1}</Text>
              </View>
              <Text className="flex-1 text-sm font-inter text-muted">{t}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
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
