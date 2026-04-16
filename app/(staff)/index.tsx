import React, { useMemo } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useAuthStore } from '../../src/store/authStore';
import { useSLA } from './_layout';
import { MOCK_ASSIGNMENTS } from '../../src/utils/mockFulfillmentData';
import { AssignmentStatus, OrderAssignment } from '../../src/types/fulfillment';
import OrderCard from '../../src/components/staff/OrderCard';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { LogOut, Bell, AlertTriangle, Clock as ClockIcon, ClipboardList } from 'lucide-react-native';
import { clsx } from 'clsx';

export default function StaffDashboard() {
  const { user, logout } = useAuthStore();
  const { now } = useSLA();

  // Helper to calculate remaining SLA minutes
  const getRemainingMinutes = (assignedAt: string) => {
    const assignedTime = new Date(assignedAt).getTime();
    const expiryTime = assignedTime + 30 * 60 * 1000; // 30 min SLA
    return Math.max(0, Math.floor((expiryTime - now) / 60000));
  };

  // Memoized stats to prevent recalculation on every tick
  const stats = useMemo(() => {
    const total = MOCK_ASSIGNMENTS.length;
    const urgent = MOCK_ASSIGNMENTS.filter(o => getRemainingMinutes(o.assignedAt) <= 5).length;
    const issues = MOCK_ASSIGNMENTS.filter(o => o.status === AssignmentStatus.CANCELLED).length;
    return { total, urgent, issues };
  }, [now]);

  const renderItem = ({ item }: { item: OrderAssignment }) => (
    <OrderCard 
      order={item} 
      remainingMinutes={getRemainingMinutes(item.assignedAt)}
      onAction={(ord) => console.log('Action on order:', ord.id)}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-6 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-slate-500 font-inter">Cửa hàng: Quận 1, TP.HCM</Text>
          <Text className="text-2xl font-outfit-bold text-slate-900">Chào, {user?.fullName}</Text>
        </View>
        <Button 
          label="" 
          variant="ghost" 
          onPress={() => logout()} 
          icon={<LogOut size={24} color="#64748B" />} 
        />
      </View>

      <View className="px-6 py-4 flex-row gap-x-3">
        <MetricCard 
          icon={<ClipboardList size={20} color="#2563EB" />} 
          label="Cần làm" 
          value={stats.total} 
          subLabel="Đơn đã nhận"
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
          label="Sự cố" 
          value={stats.issues} 
          subLabel="Cần xử lý"
          isWarning={stats.issues > 0}
        />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-lg font-outfit-bold text-slate-800 mb-4 mt-2">Hàng đợi ưu tiên</Text>
        <FlashList
          data={MOCK_ASSIGNMENTS}
          renderItem={renderItem}
          estimatedItemSize={200}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <ClipboardList size={64} color="#CBD5E1" />
              <Text className="text-slate-400 mt-4 font-inter">Hiện chưa có đơn hàng nào được gán</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
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
        <Text className="text-xs font-inter-bold text-slate-500 ml-1.5 uppercase">{label}</Text>
      </View>
      <Text className={clsx('text-2xl font-outfit-bold', isDanger ? 'text-danger' : 'text-slate-900')}>
        {value}
      </Text>
      <Text className="text-[10px] text-slate-400 font-inter">{subLabel}</Text>
    </Card>
  );
}
