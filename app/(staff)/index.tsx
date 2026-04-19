import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View, Text, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '../../src/store/authStore';
import { useSLAStore } from '../../src/store/slaStore';
import { useFulfillment } from '../../src/hooks/useFulfillment';
import { AssignmentStatus, OrderAssignment } from '../../src/types/fulfillment';
import OrderCard from '../../src/components/staff/OrderCard';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { Bell, AlertTriangle, ClipboardList, RefreshCw } from 'lucide-react-native';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';

type AssignmentFilter = 'ALL' | AssignmentStatus.PENDING | AssignmentStatus.IN_PROGRESS;

const getRemainingMinutes = (assignedAt: string, now: number) => {
  const assignedTime = new Date(assignedAt).getTime();
  const expiryTime = assignedTime + 30 * 60 * 1000;
  return Math.max(0, Math.floor((expiryTime - now) / 60000));
};

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const now = useSLAStore((s) => s.now);
  const { assignments, isLoading, refetch } = useFulfillment();
  const router = useRouter();
  const [filter, setFilter] = useState<AssignmentFilter>('ALL');
  const [onlyUrgent, setOnlyUrgent] = useState(false);

  const stats = useMemo(() => {
    const total = assignments.length;
    const urgent = assignments.filter((o) => getRemainingMinutes(o.assignedAt, now) <= 5).length;
    const pending = assignments.filter((o) => o.status === AssignmentStatus.PENDING).length;
    return { total, urgent, pending };
  }, [assignments, now]);

  const filteredAssignments = useMemo(() => {
    const base = assignments.filter((a) => {
      if (filter !== 'ALL' && a.status !== filter) return false;
      if (onlyUrgent && getRemainingMinutes(a.assignedAt, now) > 5) return false;
      return true;
    });

    const statusWeight = (s: AssignmentStatus) => {
      if (s === AssignmentStatus.IN_PROGRESS) return 0;
      if (s === AssignmentStatus.PENDING) return 1;
      return 2;
    };

    return [...base].sort((a, b) => {
      const ra = getRemainingMinutes(a.assignedAt, now);
      const rb = getRemainingMinutes(b.assignedAt, now);
      if (ra !== rb) return ra - rb;
      const wa = statusWeight(a.status);
      const wb = statusWeight(b.status);
      if (wa !== wb) return wa - wb;
      return new Date(a.assignedAt).getTime() - new Date(b.assignedAt).getTime();
    });
  }, [assignments, filter, now, onlyUrgent]);

  const handleOpenAssignment = useCallback(
    (ord: OrderAssignment) => {
      router.push(`/(staff)/orders/${ord.id}` as never);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: OrderAssignment }) => (
      <OrderCard
        order={item}
        remainingMinutes={getRemainingMinutes(item.assignedAt, now)}
        onAction={handleOpenAssignment}
      />
    ),
    [handleOpenAssignment, now]
  );

  const keyExtractor = useCallback((item: OrderAssignment) => String(item.id), []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-6 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-slate-500 font-inter">Khu vực: Fulfillment Center A</Text>
          <Text className="text-2xl font-outfit-bold text-slate-900">Chào, {user?.fullName}</Text>
        </View>
        <Button 
          label="" 
          variant="ghost" 
          onPress={() => refetch()} 
          icon={<RefreshCw size={24} color="#64748B" />} 
        />
      </View>

      {/* Metrics Row */}
      <View className="px-6 py-4 flex-row gap-x-3">
        <MetricCard 
          icon={<ClipboardList size={20} color="#2563EB" />} 
          label="Cần xử lý" 
          value={stats.pending} 
          subLabel="Đơn mới gán"
        />
        <MetricCard 
          icon={<AlertTriangle size={20} color="#DC2626" />} 
          label="Sắp trễ" 
          value={stats.urgent} 
          subLabel="Dưới 5 phút"
          isDanger={stats.urgent > 0}
        />
        <MetricCard 
          icon={<Bell size={20} color="#F59E0B" />} 
          label="Tổng gán" 
          value={stats.total} 
          subLabel="Đang quản lý"
        />
      </View>

      <View className="px-6 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row bg-slate-100 rounded-2xl p-1">
            <FilterPill
              label="Tất cả"
              active={filter === 'ALL'}
              onPress={() => setFilter('ALL')}
            />
            <FilterPill
              label="Mới"
              active={filter === AssignmentStatus.PENDING}
              onPress={() => setFilter(AssignmentStatus.PENDING)}
            />
            <FilterPill
              label="Đang làm"
              active={filter === AssignmentStatus.IN_PROGRESS}
              onPress={() => setFilter(AssignmentStatus.IN_PROGRESS)}
            />
          </View>

          <Pressable
            onPress={() => setOnlyUrgent((v) => !v)}
            className={clsx(
              'px-3 py-2 rounded-xl border',
              onlyUrgent ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
            )}
          >
            <Text className={clsx('text-xs font-inter-bold', onlyUrgent ? 'text-red-700' : 'text-slate-600')}>
              SLA ≤ 5p
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Priority Queue Section */}
      <View className="flex-1 px-6">
        <View className="flex-row justify-between items-center mb-4 mt-2">
          <Text className="text-lg font-outfit-bold text-slate-800">Hàng đợi ưu tiên</Text>
          <Text className="text-xs text-slate-400 font-inter italic">Cập nhật mỗi phút</Text>
        </View>
        
        <FlashList
          data={filteredAssignments}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={210}
          onRefresh={refetch}
          refreshing={isLoading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <ClipboardList size={64} color="#CBD5E1" />
              <Text className="text-slate-400 mt-4 font-inter">
                {onlyUrgent || filter !== 'ALL' ? 'Không có đơn phù hợp bộ lọc' : 'Hiện chưa có đơn hàng nào được gán'}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx(
        'px-3 py-2 rounded-xl',
        active ? 'bg-white' : 'bg-transparent'
      )}
    >
      <Text className={clsx('text-xs font-inter-bold', active ? 'text-slate-900' : 'text-slate-500')}>
        {label}
      </Text>
    </Pressable>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  subLabel, 
  isDanger, 
  isWarning 
}: { 
  icon: React.ReactNode, 
  label: string, 
  value: number, 
  subLabel: string,
  isDanger?: boolean,
  isWarning?: boolean
}) {
  return (
    <Card 
      className={clsx(
        'flex-1 p-3 border border-slate-100',
        isDanger && 'bg-red-50 border-red-100',
        isWarning && 'bg-amber-50 border-amber-100'
      )}
    >
      <View className="flex-row items-center mb-1">
        {icon}
        <Text className="text-[10px] font-inter-bold text-slate-500 ml-1.5 uppercase">{label}</Text>
      </View>
      <Text className={clsx('text-xl font-outfit-bold', isDanger ? 'text-danger' : 'text-slate-900')}>
        {value}
      </Text>
      <Text className="text-[9px] text-slate-400 font-inter">{subLabel}</Text>
    </Card>
  );
}
