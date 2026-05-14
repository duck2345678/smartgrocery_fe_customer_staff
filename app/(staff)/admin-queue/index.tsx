import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../src/components/ui/Card';
import { adminOrdersApi, type OpsOrder } from '../../../src/api/adminOrdersApi';
import { orderApi } from '../../../src/api/orders';
import { type Order } from '../../../src/types/order';

type Tab = 'ALL' | 'OPS';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  ASSIGNED: 'Đã giao NV',
  PICKING: 'Đang nhặt',
  ON_HOLD: 'Tạm dừng',
  READY: 'Sẵn sàng',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:    { bg: '#fef3c7', text: '#b45309' },
  PROCESSING: { bg: '#dbeafe', text: '#1d4ed8' },
  ASSIGNED:   { bg: '#ede9fe', text: '#7c3aed' },
  PICKING:    { bg: '#e0f2fe', text: '#0369a1' },
  ON_HOLD:    { bg: '#fee2e2', text: '#dc2626' },
  READY:      { bg: '#dcfce7', text: '#15803d' },
  DELIVERED:  { bg: '#f0fdf4', text: '#166534' },
  CANCELLED:  { bg: '#f1f5f9', text: '#64748b' },
};

function formatMoney(v: number) {
  return Number.isFinite(v) ? v.toLocaleString('vi-VN') + ' ₫' : '—';
}

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: '#f1f5f9', text: '#64748b' };
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: colors.bg }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text }}>
        {STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

// ─── Override modal (force-release / emergency-assign) ────────────────────────
type OverrideModal =
  | { type: 'release'; order: OpsOrder }
  | { type: 'assign'; order: OpsOrder };

function OverrideModalSheet({
  modal,
  onClose,
  onForceRelease,
  onEmergencyAssign,
  isPending,
}: {
  modal: OverrideModal | null;
  onClose: () => void;
  onForceRelease: (orderId: number, reason: string) => void;
  onEmergencyAssign: (orderId: number, staffId: number, reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');
  const [staffId, setStaffId] = useState('');

  const handleSubmit = () => {
    if (!modal) return;
    if (!reason.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do.');
      return;
    }
    if (modal.type === 'release') {
      onForceRelease(modal.order.orderId, reason.trim());
    } else {
      const sid = Number(staffId);
      if (!Number.isFinite(sid) || sid <= 0) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập ID nhân viên hợp lệ.');
        return;
      }
      onEmergencyAssign(modal.order.orderId, sid, reason.trim());
    }
  };

  return (
    <Modal
      visible={!!modal}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View className="bg-background" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-outfit-bold text-text text-base">
              {modal?.type === 'release' ? '🔓 Force Release' : '⚡ Giao khẩn cấp'}
            </Text>
            <Pressable onPress={onClose}>
              <Text className="font-inter text-muted">Đóng</Text>
            </Pressable>
          </View>

          {modal ? (
            <Text className="text-xs font-inter text-muted mb-4">
              Đơn #{modal.order.orderNumber} • {modal.order.assigneeName ?? 'Chưa có NV'}
            </Text>
          ) : null}

          {modal?.type === 'assign' ? (
            <View className="mb-3">
              <Text className="text-xs font-inter-bold text-muted uppercase mb-1.5">ID Nhân viên *</Text>
              <TextInput
                value={staffId}
                onChangeText={setStaffId}
                placeholder="Nhập ID nhân viên"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
                style={{ paddingVertical: 11, fontSize: 15 }}
              />
            </View>
          ) : null}

          <View className="mb-5">
            <Text className="text-xs font-inter-bold text-muted uppercase mb-1.5">Lý do *</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Nhập lý do can thiệp..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
              style={{ paddingVertical: 11, fontSize: 15, textAlignVertical: 'top', minHeight: 80 }}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={isPending}
            style={{
              paddingVertical: 15,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: isPending ? '#e2e8f0' : modal?.type === 'release' ? '#f97316' : '#dc2626',
            }}
          >
            {isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ fontWeight: '700', fontSize: 15, color: '#ffffff' }}>
                {modal?.type === 'release' ? 'Xác nhận Force Release' : 'Xác nhận Giao khẩn cấp'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── OPS order card ───────────────────────────────────────────────────────────
function OpsOrderCard({
  order,
  label,
  onRelease,
  onAssign,
}: {
  order: OpsOrder;
  label: string;
  onRelease: () => void;
  onAssign: () => void;
}) {
  const slaColor = order.minutesToSla != null && order.minutesToSla < 15 ? '#dc2626' : '#b45309';
  return (
    <Card className="p-4" style={{ borderLeftWidth: 4, borderLeftColor: slaColor }}>
      <View className="flex-row items-start justify-between mb-2">
        <View style={{ flex: 1 }}>
          <Text className="font-outfit-bold text-text">#{order.orderNumber}</Text>
          <Text className="text-xs font-inter text-muted mt-0.5">{label}</Text>
          {order.assigneeName ? (
            <Text className="text-xs font-inter text-muted mt-0.5">NV: {order.assigneeName}</Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <StatusBadge status={order.status} />
          {order.minutesToSla != null ? (
            <Text style={{ fontSize: 11, color: slaColor, fontWeight: '700' }}>
              SLA: {order.minutesToSla} phút
            </Text>
          ) : null}
          {order.minutesSinceUpdate != null ? (
            <Text className="text-xs font-inter text-muted">
              Cập nhật: {order.minutesSinceUpdate} phút trước
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row mt-2" style={{ gap: 8 }}>
        <Pressable
          onPress={onRelease}
          style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#ea580c' }}>🔓 Force Release</Text>
        </Pressable>
        <Pressable
          onPress={onAssign}
          style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626' }}>⚡ Giao khẩn</Text>
        </Pressable>
      </View>
    </Card>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
const ALL_STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'ASSIGNED', 'PICKING', 'ON_HOLD', 'DELIVERED', 'CANCELLED'];

export default function AdminQueueScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [overrideModal, setOverrideModal] = useState<OverrideModal | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const allOrdersQuery = useQuery({
    queryKey: ['admin-all-orders'],
    queryFn: () => orderApi.getAllOrders(),
    staleTime: 30_000,
    enabled: tab === 'ALL',
  });

  const opsQuery = useQuery({
    queryKey: ['admin-ops-monitor'],
    queryFn: () => adminOrdersApi.getOpsMonitor(),
    staleTime: 30_000,
    enabled: tab === 'OPS',
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    if (tab === 'ALL') await allOrdersQuery.refetch();
    else await opsQuery.refetch();
    setRefreshing(false);
  };

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['admin-all-orders'] });
    void qc.invalidateQueries({ queryKey: ['admin-ops-monitor'] });
  }, [qc]);

  const releaseMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
      adminOrdersApi.forceRelease(orderId, reason),
    onSuccess: () => {
      setOverrideModal(null);
      invalidate();
      Alert.alert('Thành công', 'Đã force release đơn hàng.');
    },
    onError: (e) => Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể thực hiện.'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, staffId, reason }: { orderId: number; staffId: number; reason: string }) =>
      adminOrdersApi.emergencyAssign(orderId, staffId, reason),
    onSuccess: () => {
      setOverrideModal(null);
      invalidate();
      Alert.alert('Thành công', 'Đã giao đơn khẩn cấp.');
    },
    onError: (e) => Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể thực hiện.'),
  });

  const isPending = releaseMutation.isPending || assignMutation.isPending;

  const filteredOrders: Order[] = (allOrdersQuery.data ?? []).filter(
    (o) => statusFilter === 'ALL' || o.status === statusFilter,
  );

  const opsData = opsQuery.data;
  const stagnant = opsData?.stagnantOrders ?? [];
  const stalled = opsData?.stalledStaffOrders ?? [];
  const totalOps = stagnant.length + stalled.length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-outfit-bold text-text">Quản lý đơn hàng</Text>
        <Text className="text-xs font-inter text-muted mt-1">Xem tất cả đơn hoặc can thiệp đơn có vấn đề.</Text>

        <View className="flex-row mt-3" style={{ gap: 10 }}>
          <Pressable
            onPress={() => setTab('ALL')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
              backgroundColor: tab === 'ALL' ? '#22c55e' : '#f1f5f9',
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 14, color: tab === 'ALL' ? '#fff' : '#475569' }}>
              Tất cả đơn
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('OPS')}
            style={{
              flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
              backgroundColor: tab === 'OPS' ? '#dc2626' : '#f1f5f9',
              flexDirection: 'row', justifyContent: 'center', gap: 6,
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 14, color: tab === 'OPS' ? '#fff' : '#475569' }}>
              Cần can thiệp
            </Text>
            {totalOps > 0 ? (
              <View style={{ backgroundColor: tab === 'OPS' ? '#fff' : '#dc2626', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: tab === 'OPS' ? '#dc2626' : '#fff' }}>{totalOps}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {tab === 'ALL' ? (
        <>
          {/* Status filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
            {ALL_STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatusFilter(s)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
                  backgroundColor: statusFilter === s ? '#22c55e' : '#f1f5f9',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: statusFilter === s ? '#fff' : '#475569' }}>
                  {s === 'ALL' ? 'Tất cả' : (STATUS_LABELS[s] ?? s)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {allOrdersQuery.isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#22C55E" />
            </View>
          ) : allOrdersQuery.isError ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-muted font-inter text-center">Không tải được đơn hàng.</Text>
              <Pressable onPress={() => void allOrdersQuery.refetch()} className="mt-4 px-6 py-3 rounded-2xl bg-primary">
                <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 10 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
              {filteredOrders.length === 0 ? (
                <View className="items-center py-16">
                  <Text className="text-muted font-inter">Không có đơn nào.</Text>
                </View>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <View className="flex-row items-start justify-between mb-2">
                      <View style={{ flex: 1 }}>
                        <Text className="font-outfit-bold text-text">#{order.orderNumber || order.id}</Text>
                        <Text className="text-xs font-inter text-muted mt-0.5">{formatDate(order.createdAt)}</Text>
                        <Text className="text-xs font-inter text-muted mt-0.5">
                          {order.items?.length ?? 0} món • {formatMoney(order.totalAmount)}
                        </Text>
                      </View>
                      <StatusBadge status={order.status} />
                    </View>
                    {order.paymentMethod ? (
                      <Text className="text-xs font-inter text-muted">Thanh toán: {order.paymentMethod}</Text>
                    ) : null}
                  </Card>
                ))
              )}
            </ScrollView>
          )}
        </>
      ) : (
        <>
          {opsQuery.isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#dc2626" />
            </View>
          ) : opsQuery.isError ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-muted font-inter text-center">Không tải được dữ liệu OPS.</Text>
              <Pressable onPress={() => void opsQuery.refetch()} className="mt-4 px-6 py-3 rounded-2xl bg-primary">
                <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
              </Pressable>
            </View>
          ) : totalOps === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text style={{ fontSize: 40 }}>✅</Text>
              <Text className="font-outfit-bold text-text text-lg mt-4">Mọi thứ ổn định</Text>
              <Text className="text-sm font-inter text-muted mt-2 text-center">Không có đơn nào cần can thiệp lúc này.</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
              {stagnant.length > 0 ? (
                <>
                  <Text className="text-xs font-inter-bold text-muted uppercase">
                    Đơn tồn đọng ({stagnant.length})
                  </Text>
                  {stagnant.map((o) => (
                    <OpsOrderCard
                      key={o.orderId}
                      order={o}
                      label="Không tiến triển"
                      onRelease={() => setOverrideModal({ type: 'release', order: o })}
                      onAssign={() => setOverrideModal({ type: 'assign', order: o })}
                    />
                  ))}
                </>
              ) : null}

              {stalled.length > 0 ? (
                <>
                  <Text className="text-xs font-inter-bold text-muted uppercase mt-2">
                    NV bị kẹt ({stalled.length})
                  </Text>
                  {stalled.map((o) => (
                    <OpsOrderCard
                      key={o.orderId}
                      order={o}
                      label={o.assigneeName ? `NV ${o.assigneeName} đang kẹt` : 'Nhân viên bị kẹt'}
                      onRelease={() => setOverrideModal({ type: 'release', order: o })}
                      onAssign={() => setOverrideModal({ type: 'assign', order: o })}
                    />
                  ))}
                </>
              ) : null}
            </ScrollView>
          )}
        </>
      )}

      <OverrideModalSheet
        modal={overrideModal}
        onClose={() => setOverrideModal(null)}
        onForceRelease={(orderId, reason) => releaseMutation.mutate({ orderId, reason })}
        onEmergencyAssign={(orderId, staffId, reason) => assignMutation.mutate({ orderId, staffId, reason })}
        isPending={isPending}
      />
    </SafeAreaView>
  );
}
