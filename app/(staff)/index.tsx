import React, { useMemo } from 'react';
import { Pressable, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { Bell, ClipboardList, RefreshCw, Settings, Siren, UploadCloud } from 'lucide-react-native';
import { clsx } from 'clsx';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { staffIssuesApi } from '../../src/api/staffIssues';
import { staffOrdersApi } from '../../src/api/staffOrders';
import { useStaffPickingStore } from '../../src/store/staffPickingStore';
import BrandMark from '../../src/components/ui/BrandMark';

export default function StaffDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const outboxCount = useStaffPickingStore((s) => s.outbox.length);

  const queueQuery = useQuery({
    queryKey: ['staff-order-queue'],
    queryFn: () => staffOrdersApi.getQueue(),
    enabled: user?.role === 'STAFF' || user?.role === 'ADMIN',
    staleTime: 5000,
  });

  const issuesQuery = useQuery({
    queryKey: ['staff-issues-my'],
    queryFn: () => staffIssuesApi.my(),
    staleTime: 5000,
  });

  const openIssuesCount = useMemo(() => {
    const list = issuesQuery.data ?? [];
    return list.filter((x) => (x.status ?? '').toUpperCase() === 'OPEN').length;
  }, [issuesQuery.data]);

  const queueCount = queueQuery.data?.length ?? 0;
  const queuePreview = useMemo(() => (queueQuery.data ?? []).slice(0, 3), [queueQuery.data]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-6 pb-2 flex-row justify-between items-center">
        <View>
          <BrandMark size={34} />
          <Text className="text-muted font-inter">Trung tâm vận hành</Text>
          <Text className="text-2xl font-outfit-bold text-text">Chào, {user?.fullName}</Text>
        </View>
        <View className="flex-row" style={{ gap: 10 }}>
          <Button
            label=""
            variant="ghost"
            onPress={() => router.push('/(staff)/notifications' as never)}
            icon={<Bell size={24} color="#64748B" />}
          />
          <Button
            label=""
            variant="ghost"
            onPress={() => router.push('/(staff)/settings' as never)}
            icon={<Settings size={24} color="#64748B" />}
          />
          <Button
            label=""
            variant="ghost"
            onPress={() => {
              void queueQuery.refetch();
              void issuesQuery.refetch();
            }}
            icon={<RefreshCw size={24} color="#64748B" />}
          />
        </View>
      </View>

      <View className="px-6 pb-4">
        <View className="mb-3 p-4 rounded-3xl border border-border bg-surface">
          <Text className="text-sm font-inter text-muted">Tổng quan ca làm</Text>
          <Text className="text-lg font-outfit-bold text-text mt-1">
            {queueCount > 0 ? `${queueCount} đơn đang chờ xử lý` : 'Chưa có đơn cần xử lý'}
          </Text>
        </View>
        <View style={{ gap: 12 }}>
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-outfit-bold text-text">Hàng chờ nhận đơn</Text>
                <Text className="text-xs font-inter text-muted mt-1">{queueCount} đơn sẵn sàng để nhận</Text>
              </View>
              <Pressable onPress={() => router.push('/(staff)/lease-queue' as never)} hitSlop={8}>
                <Text className="text-sm font-inter-bold text-primary">Mở</Text>
              </Pressable>
            </View>
            {queueQuery.isError ? (
              <Text className="text-xs font-inter text-danger mt-3">Không tải được hàng chờ.</Text>
            ) : queuePreview.length > 0 ? (
              <View className="mt-3" style={{ gap: 8 }}>
                {queuePreview.map((o) => (
                  <View key={o.id} className="flex-row items-center justify-between">
                    <Text className="text-sm font-inter text-text" numberOfLines={1}>
                      {o.orderNumber || `ID nội bộ #${o.id}`}
                    </Text>
                    <Text className="text-xs font-inter text-muted">
                      {o.totalItems != null ? `${o.totalItems} món` : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-xs font-inter text-muted mt-3">Chưa có đơn mới.</Text>
            )}
          </Card>

          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-outfit-bold text-text">Sự cố vận hành</Text>
                <Text className="text-xs font-inter text-muted mt-1">{openIssuesCount > 0 ? `${openIssuesCount} sự cố đang mở` : 'Chưa có sự cố'}</Text>
              </View>
              <Pressable onPress={() => router.push('/(staff)/issues' as never)} hitSlop={8}>
                <Text className="text-sm font-inter-bold text-primary">Xem</Text>
              </Pressable>
            </View>
          </Card>

          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-outfit-bold text-text">Hàng chờ offline</Text>
                <Text className="text-xs font-inter text-muted mt-1">
                  {outboxCount > 0 ? `${outboxCount} bản ghi đang chờ đồng bộ` : 'Không có bản ghi chờ đồng bộ'}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(staff)/settings' as never)} hitSlop={8}>
                <Text className="text-sm font-inter-bold text-primary">Cài đặt</Text>
              </Pressable>
            </View>
          </Card>

        </View>
      </View>

      <View className="px-6 py-4 flex-row gap-x-3">
        <MetricCard 
          icon={<ClipboardList size={20} color="#2563EB" />} 
          label="Hàng chờ" 
          value={queueCount} 
          subLabel="Đơn sẵn sàng"
        />
        <MetricCard 
          icon={<UploadCloud size={20} color="#F59E0B" />} 
          label="Offline" 
          value={outboxCount} 
          subLabel="Chờ đồng bộ"
          isWarning={outboxCount > 0}
        />
        <MetricCard 
          icon={<Siren size={20} color="#F43F5E" />} 
          label="Sự cố" 
          value={openIssuesCount} 
          subLabel="Đang mở"
          isWarning={openIssuesCount > 0}
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
        'flex-1 p-3 rounded-2xl',
        isDanger && 'border border-danger bg-surface',
        isWarning && 'border border-border bg-surface'
      )}
    >
      <View className="flex-row items-center mb-1">
        {icon}
        <Text className="text-[10px] font-inter-bold text-muted ml-1.5 uppercase">{label}</Text>
      </View>
      <Text className={clsx('text-xl font-outfit-bold', isDanger ? 'text-danger' : 'text-text')}>
        {value}
      </Text>
      <Text className="text-[9px] text-muted font-inter">{subLabel}</Text>
    </Card>
  );
}
