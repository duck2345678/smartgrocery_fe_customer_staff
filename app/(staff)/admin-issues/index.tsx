import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../src/components/ui/Card';
import {
  adminOrdersApi,
  type AdminIssue,
  type ResolveType,
  type SubstitutionOption,
} from '../../../src/api/adminOrdersApi';

// ─── Constants ────────────────────────────────────────────────────────────────
const ISSUE_TYPE_LABELS: Record<string, string> = {
  OUT_OF_STOCK:       'Hết hàng',
  DAMAGED:            'Hàng hỏng',
  WRONG_ITEM:         'Sai sản phẩm',
  CUSTOMER_REQUEST:   'Yêu cầu KH',
  SYSTEM_ERROR:       'Lỗi hệ thống',
};

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:       { label: 'Mở',        bg: '#fef3c7', color: '#b45309' },
  RESOLVED:   { label: 'Đã giải quyết', bg: '#dcfce7', color: '#15803d' },
  CLOSED:     { label: 'Đã đóng',   bg: '#f1f5f9', color: '#64748b' },
};

const RESOLUTION_OPTIONS: { type: ResolveType; label: string; desc: string; color: string }[] = [
  { type: 'SUBSTITUTE',    label: '🔄 Thay thế',       desc: 'Dùng sản phẩm khác thay thế',     color: '#7c3aed' },
  { type: 'PARTIAL',       label: '📦 Giao một phần',  desc: 'Giao số lượng ít hơn đặt hàng',   color: '#0369a1' },
  { type: 'CANCEL_LINE',   label: '✂️ Hủy dòng',       desc: 'Hủy riêng sản phẩm này',          color: '#ea580c' },
  { type: 'CANCEL_ORDER',  label: '🚫 Hủy đơn',        desc: 'Hủy toàn bộ đơn hàng',            color: '#dc2626' },
];

function formatMoney(v: number) {
  return Number.isFinite(v) ? v.toLocaleString('vi-VN') + ' ₫' : '—';
}

function formatDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Issue card ───────────────────────────────────────────────────────────────
function IssueCard({ issue, onResolve }: { issue: AdminIssue; onResolve: () => void }) {
  const statusInfo = STATUS_LABELS[issue.status] ?? { label: issue.status, bg: '#f1f5f9', color: '#64748b' };
  const isOpen = issue.status === 'OPEN';

  return (
    <Card className="p-4">
      <View className="flex-row items-start justify-between mb-2">
        <View style={{ flex: 1 }}>
          <Text className="font-inter-bold text-text">
            {ISSUE_TYPE_LABELS[issue.issueType] ?? issue.issueType}
          </Text>
          {issue.orderNumber ? (
            <Text className="text-xs font-inter text-muted mt-0.5">Đơn #{issue.orderNumber}</Text>
          ) : null}
          {issue.reporterName ? (
            <Text className="text-xs font-inter text-muted mt-0.5">NV: {issue.reporterName}</Text>
          ) : null}
          <Text className="text-xs font-inter text-muted mt-0.5">{formatDate(issue.createdAt)}</Text>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: statusInfo.bg }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: statusInfo.color }}>{statusInfo.label}</Text>
        </View>
      </View>

      {isOpen ? (
        <Pressable
          onPress={onResolve}
          style={{
            marginTop: 8, paddingVertical: 10, borderRadius: 12,
            alignItems: 'center', backgroundColor: '#22c55e',
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 13, color: '#ffffff' }}>Giải quyết</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

// ─── Resolve modal ────────────────────────────────────────────────────────────
function ResolveModal({
  issue,
  onClose,
  onSubmit,
  isPending,
}: {
  issue: AdminIssue | null;
  onClose: () => void;
  onSubmit: (payload: {
    resolutionType: ResolveType;
    resolutionNotes: string;
    releaseOrder: boolean;
    substituteProductId?: number;
    partialQuantity?: number;
  }) => void;
  isPending: boolean;
}) {
  const [resolutionType, setResolutionType] = useState<ResolveType | null>(null);
  const [notes, setNotes] = useState('');
  const [releaseOrder, setReleaseOrder] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<SubstitutionOption | null>(null);
  const [partialQty, setPartialQty] = useState('');

  const subsQuery = useQuery({
    queryKey: ['admin-issue-substitutions', issue?.id, subSearch],
    queryFn: () => adminOrdersApi.getSubstitutions(issue!.id, subSearch || undefined),
    enabled: !!issue && resolutionType === 'SUBSTITUTE',
    staleTime: 30_000,
  });

  const handleClose = () => {
    setResolutionType(null);
    setNotes('');
    setReleaseOrder(false);
    setSubSearch('');
    setSelectedSub(null);
    setPartialQty('');
    onClose();
  };

  const handleSubmit = () => {
    if (!resolutionType) {
      Alert.alert('Chưa chọn', 'Vui lòng chọn cách giải quyết.');
      return;
    }
    if (resolutionType === 'SUBSTITUTE' && !selectedSub) {
      Alert.alert('Chưa chọn', 'Vui lòng chọn sản phẩm thay thế.');
      return;
    }
    if (resolutionType === 'PARTIAL') {
      const qty = Number(partialQty);
      if (!Number.isFinite(qty) || qty <= 0) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập số lượng giao hợp lệ.');
        return;
      }
    }

    onSubmit({
      resolutionType,
      resolutionNotes: notes.trim(),
      releaseOrder,
      substituteProductId: resolutionType === 'SUBSTITUTE' ? selectedSub?.variantId : undefined,
      partialQuantity: resolutionType === 'PARTIAL' ? Number(partialQty) : undefined,
    });
  };

  return (
    <Modal visible={!!issue} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View className="bg-background" style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border" style={{ padding: 16 }}>
            <Text className="font-outfit-bold text-text text-base">Giải quyết vấn đề</Text>
            <Pressable onPress={handleClose}>
              <Text className="font-inter text-muted">Đóng</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }} keyboardShouldPersistTaps="handled">
            {/* Issue info */}
            {issue ? (
              <View className="bg-surface border border-border rounded-2xl p-3">
                <Text className="font-inter-bold text-text">
                  {ISSUE_TYPE_LABELS[issue.issueType] ?? issue.issueType}
                </Text>
                {issue.orderNumber ? (
                  <Text className="text-xs font-inter text-muted mt-0.5">Đơn #{issue.orderNumber}</Text>
                ) : null}
              </View>
            ) : null}

            {/* Resolution type */}
            <View>
              <Text className="text-xs font-inter-bold text-muted uppercase mb-2">Cách giải quyết *</Text>
              <View style={{ gap: 8 }}>
                {RESOLUTION_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.type}
                    onPress={() => {
                      setResolutionType(opt.type);
                      setSelectedSub(null);
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', padding: 12,
                      borderRadius: 14, borderWidth: 2,
                      borderColor: resolutionType === opt.type ? opt.color : '#e2e8f0',
                      backgroundColor: resolutionType === opt.type ? opt.color + '15' : '#ffffff',
                    }}
                  >
                    <View
                      style={{
                        width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                        borderColor: resolutionType === opt.type ? opt.color : '#cbd5e1',
                        backgroundColor: resolutionType === opt.type ? opt.color : 'transparent',
                        marginRight: 12, alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {resolutionType === opt.type ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: resolutionType === opt.type ? opt.color : '#1e293b' }}>
                        {opt.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{opt.desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* SUBSTITUTE: search + pick */}
            {resolutionType === 'SUBSTITUTE' ? (
              <View>
                <Text className="text-xs font-inter-bold text-muted uppercase mb-2">Sản phẩm thay thế *</Text>
                <TextInput
                  value={subSearch}
                  onChangeText={setSubSearch}
                  placeholder="Tìm sản phẩm thay thế..."
                  placeholderTextColor="#94a3b8"
                  className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
                  style={{ paddingVertical: 11, fontSize: 15, marginBottom: 10 }}
                />
                {subsQuery.isLoading ? (
                  <ActivityIndicator color="#22C55E" />
                ) : (subsQuery.data ?? []).length === 0 ? (
                  <Text className="text-xs font-inter text-muted text-center py-4">Không tìm thấy sản phẩm.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {(subsQuery.data ?? []).map((sub) => (
                      <Pressable
                        key={sub.variantId}
                        onPress={() => setSelectedSub(sub)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                          padding: 12, borderRadius: 14, borderWidth: 2,
                          borderColor: selectedSub?.variantId === sub.variantId ? '#22c55e' : '#e2e8f0',
                          backgroundColor: selectedSub?.variantId === sub.variantId ? '#f0fdf4' : '#fff',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text className="font-inter-bold text-text" numberOfLines={2}>{sub.name}</Text>
                          <Text className="text-xs font-inter text-muted mt-0.5">
                            {formatMoney(sub.price)} • Tồn: {sub.stock}
                          </Text>
                        </View>
                        {sub.isRecommended ? (
                          <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: '#dcfce7' }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803d' }}>Gợi ý</Text>
                          </View>
                        ) : null}
                        {selectedSub?.variantId === sub.variantId ? (
                          <Text style={{ marginLeft: 8, fontSize: 18, color: '#22c55e' }}>✓</Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {/* PARTIAL: quantity input */}
            {resolutionType === 'PARTIAL' ? (
              <View>
                <Text className="text-xs font-inter-bold text-muted uppercase mb-2">Số lượng giao thực tế *</Text>
                <TextInput
                  value={partialQty}
                  onChangeText={setPartialQty}
                  placeholder="Nhập số lượng"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
                  style={{ paddingVertical: 11, fontSize: 15 }}
                />
              </View>
            ) : null}

            {/* Notes */}
            <View>
              <Text className="text-xs font-inter-bold text-muted uppercase mb-2">Ghi chú (tùy chọn)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Ghi chú thêm về cách giải quyết..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                className="bg-surface border border-border rounded-2xl px-4 font-inter text-text"
                style={{ paddingVertical: 11, fontSize: 15, textAlignVertical: 'top', minHeight: 80 }}
              />
            </View>

            {/* Release order toggle */}
            <View className="flex-row items-center justify-between">
              <View style={{ flex: 1 }}>
                <Text className="font-inter-bold text-text">Release đơn hàng</Text>
                <Text className="text-xs font-inter text-muted mt-0.5">Trả đơn về hàng chờ sau khi giải quyết</Text>
              </View>
              <Switch
                value={releaseOrder}
                onValueChange={setReleaseOrder}
                trackColor={{ true: '#22c55e', false: '#e2e8f0' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={isPending || !resolutionType}
              style={{
                paddingVertical: 15, borderRadius: 14, alignItems: 'center',
                backgroundColor: isPending || !resolutionType ? '#e2e8f0' : '#22c55e',
              }}
            >
              {isPending ? (
                <ActivityIndicator color="#22c55e" />
              ) : (
                <Text style={{ fontWeight: '700', fontSize: 15, color: !resolutionType ? '#94a3b8' : '#ffffff' }}>
                  Xác nhận giải quyết
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AdminIssuesScreen() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'OPEN' | 'ALL'>('OPEN');
  const [resolveTarget, setResolveTarget] = useState<AdminIssue | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const issuesQuery = useQuery({
    queryKey: ['admin-issues'],
    queryFn: () => adminOrdersApi.listIssues(),
    staleTime: 30_000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await issuesQuery.refetch();
    setRefreshing(false);
  };

  const resolveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof adminOrdersApi.resolveIssue>[1]) =>
      adminOrdersApi.resolveIssue(resolveTarget!.id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-issues'] });
      setResolveTarget(null);
      Alert.alert('Thành công', 'Vấn đề đã được giải quyết.');
    },
    onError: (e) => Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể giải quyết vấn đề.'),
  });

  const allIssues = issuesQuery.data ?? [];
  const displayed = filter === 'OPEN' ? allIssues.filter((i) => i.status === 'OPEN') : allIssues;
  const openCount = allIssues.filter((i) => i.status === 'OPEN').length;

  const handleClose = useCallback(() => setResolveTarget(null), []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="px-4 pt-4 pb-2">
        <Text className="text-xl font-outfit-bold text-text">Vấn đề đơn hàng</Text>
        <Text className="text-xs font-inter text-muted mt-1">
          {openCount > 0 ? `${openCount} vấn đề đang mở cần giải quyết.` : 'Không có vấn đề nào đang mở.'}
        </Text>

        <View className="flex-row mt-3" style={{ gap: 10 }}>
          {(['OPEN', 'ALL'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center',
                backgroundColor: filter === f ? '#22c55e' : '#f1f5f9',
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 13, color: filter === f ? '#fff' : '#475569' }}>
                {f === 'OPEN' ? `Đang mở (${openCount})` : `Tất cả (${allIssues.length})`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {issuesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22C55E" />
        </View>
      ) : issuesQuery.isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted font-inter text-center">Không tải được danh sách vấn đề.</Text>
          <Pressable onPress={() => void issuesQuery.refetch()} className="mt-4 px-6 py-3 rounded-2xl bg-primary">
            <Text className="font-outfit-bold text-primary-fg">Thử lại</Text>
          </Pressable>
        </View>
      ) : displayed.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text className="font-outfit-bold text-text text-lg mt-4">
            {filter === 'OPEN' ? 'Không có vấn đề nào mở' : 'Chưa có vấn đề nào'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {displayed.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onResolve={() => setResolveTarget(issue)}
            />
          ))}
        </ScrollView>
      )}

      <ResolveModal
        issue={resolveTarget}
        onClose={handleClose}
        onSubmit={(payload) => resolveMutation.mutate(payload)}
        isPending={resolveMutation.isPending}
      />
    </SafeAreaView>
  );
}
