import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Skeleton from '../../../src/components/ui/Skeleton';
import { staffOrdersApi } from '../../../src/api/staffOrders';
import { useStaffPickingStore } from '../../../src/store/staffPickingStore';
import { clampInt } from '../../../src/utils/staffPickingUtils';

const parseLease = (leaseExpiresAt: string | null): number | null => {
  if (!leaseExpiresAt) return null;
  const d = new Date(leaseExpiresAt);
  const t = d.getTime();
  if (Number.isNaN(t)) return null;
  return t;
};

const formatCountdown = (ms: number | null): string => {
  if (ms == null) return '--:--';
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function StaffPickListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = useMemo(() => {
    const raw = params.orderId;
    const n = typeof raw === 'string' ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  }, [params.orderId]);

  const session = useStaffPickingStore((s) => s.session);
  const startFromPickList = useStaffPickingStore((s) => s.startFromPickList);
  const clearSession = useStaffPickingStore((s) => s.clearSession);
  const setPickedQuantity = useStaffPickingStore((s) => s.setPickedQuantity);
  const setSubstitution = useStaffPickingStore((s) => s.setSubstitution);
  const setSubstitutedVariantId = useStaffPickingStore((s) => s.setSubstitutedVariantId);
  const setReason = useStaffPickingStore((s) => s.setReason);
  const buildPayload = useStaffPickingStore((s) => s.buildPayload);
  const enqueueComplete = useStaffPickingStore((s) => s.enqueueComplete);

  const [payloadOpen, setPayloadOpen] = useState(false);
  const [subOpenFor, setSubOpenFor] = useState<number | null>(null);
  const [disableControls, setDisableControls] = useState(false);
  const [now, setNow] = useState(Date.now());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickListQuery = useQuery({
    queryKey: ['staff-pick-list', orderId],
    queryFn: () => staffOrdersApi.getPickList(orderId),
    enabled: orderId > 0,
    staleTime: 0,
  });

  useEffect(() => {
    const data = pickListQuery.data;
    if (!data) return;
    startFromPickList(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickListQuery.data]);

  const leaseMs = useMemo(() => {
    const leaseAt = session?.leaseExpiresAt ?? pickListQuery.data?.leaseExpiresAt ?? null;
    const t = parseLease(leaseAt);
    if (!t) return null;
    return t - now;
  }, [now, pickListQuery.data?.leaseExpiresAt, session?.leaseExpiresAt]);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, []);

  const heartbeatMutation = useMutation({
    mutationFn: () => staffOrdersApi.heartbeat(orderId),
    onSuccess: (res) => {
      if (session && session.orderId === orderId) {
        useStaffPickingStore.setState({
          session: { ...session, leaseExpiresAt: res.leaseExpiresAt ?? session.leaseExpiresAt },
        });
      }
    },
    onError: (e) => {
      const err = e as Error & { status?: number };
      Alert.alert('Lease hết hạn', err.message || 'Lease đã hết hạn hoặc bạn không còn quyền với đơn này.');
      clearSession();
      router.replace('/(staff)/lease-queue' as never);
    },
  });

  useEffect(() => {
    if (!orderId) return;
    heartbeatRef.current = setInterval(() => {
      void heartbeatMutation.mutateAsync();
    }, 180000);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const releaseMutation = useMutation({
    mutationFn: () => staffOrdersApi.release(orderId),
    onSuccess: () => {
      clearSession();
      router.replace('/(staff)/lease-queue' as never);
    },
    onError: (e) => Alert.alert('Lỗi', (e as Error).message),
  });

  const completeMutation = useMutation({
    mutationFn: (payload: unknown) => staffOrdersApi.completePicking(orderId, payload as never),
    onSuccess: () => {
      setDisableControls(true);
      clearSession();
      setPayloadOpen(false);
      Alert.alert('Thành công', 'Đã chốt nhặt hàng.');
      router.replace('/(staff)/lease-queue' as never);
    },
    onError: (e) => {
      const err = e as Error;
      const out = enqueueComplete();
      setPayloadOpen(false);
      if (out) {
        Alert.alert('Đã lưu offline', `Không gửi được lên server. Payload đã được lưu và sẽ sync lại từ Queue.\n\n${err.message}`);
        router.replace('/(staff)/lease-queue' as never);
      } else {
        Alert.alert('Lỗi', err.message);
      }
    },
  });

  const items = useMemo(() => {
    const data = pickListQuery.data;
    return data?.items ?? [];
  }, [pickListQuery.data]);

  const sessionItems = session?.itemsById ?? {};

  const payload = useMemo(() => buildPayload(), [buildPayload]);
  const payloadJson = useMemo(() => (payload ? JSON.stringify(payload, null, 2) : ''), [payload]);

  const substitutionsQuery = useQuery({
    queryKey: ['staff-substitutions', orderId, subOpenFor],
    queryFn: () => staffOrdersApi.getSubstitutions(orderId, subOpenFor as number),
    enabled: orderId > 0 && typeof subOpenFor === 'number',
    staleTime: 0,
  });

  const handleComplete = useCallback(() => {
    if (!payload) {
      Alert.alert('Thiếu dữ liệu', 'Không có payload để gửi.');
      return;
    }
    setPayloadOpen(true);
  }, [payload]);

  if (orderId === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
        <Text className="font-outfit-bold text-slate-900 text-lg">Order ID không hợp lệ</Text>
        <View className="mt-4 w-full">
          <Button label="Quay lại" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: `Pick List #${orderId}`,
          headerRight: () => (
            <Button
              label="Release"
              variant="ghost"
              onPress={() => {
                Alert.alert('Thả đơn', 'Bạn muốn thả đơn này?', [
                  { text: 'Huỷ', style: 'cancel' },
                  { text: 'Thả', style: 'destructive', onPress: () => releaseMutation.mutate() },
                ]);
              }}
            />
          ),
        }}
      />

      <View className="px-4 pt-3 pb-2">
        <Card className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-inter text-slate-600">Lease</Text>
            <Text className="font-outfit-bold text-slate-900">{formatCountdown(leaseMs)}</Text>
          </View>
          <Text className="text-[11px] font-inter text-slate-500 mt-1">
            Nút +/- cập nhật LOCAL BUFFER tức thì. Chỉ "Complete Picking" mới gọi API.
          </Text>
        </Card>
      </View>

      {pickListQuery.isLoading ? (
        <View className="px-4 gap-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </View>
      ) : pickListQuery.isError ? (
        <View className="px-4">
          <Card className="p-4">
            <Text className="text-sm font-inter text-slate-700">Không tải được pick list.</Text>
            <View className="mt-3">
              <Button label="Thử lại" onPress={() => void pickListQuery.refetch()} />
            </View>
          </Card>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
          {items.map((it) => {
            const st = sessionItems[it.orderItemId];
            const picked = st ? st.pickedQuantity : 0;
            const ordered = st ? st.orderedQuantity : it.orderedQuantity;
            const canSub = st ? st.allowSubstitution : it.allowSubstitution;
            const showSubToggle = picked < ordered;
            const isSub = Boolean(st?.isSubstituted);

            return (
              <Card key={it.orderItemId} className="p-4 border border-slate-100 bg-white">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center">
                      <View className="px-2 py-1 rounded-full bg-slate-100">
                        <Text className="text-[10px] font-inter-bold text-slate-700">{it.aisleLocation || '—'}</Text>
                      </View>
                      <Text className="ml-2 text-[10px] font-inter-bold text-slate-500">{it.sku}</Text>
                    </View>
                    <Text className="mt-2 font-outfit-bold text-slate-900">{it.productName}</Text>
                    {it.variantName ? <Text className="text-xs font-inter text-slate-500 mt-1">{it.variantName}</Text> : null}

                    <Text className="text-xs font-inter text-slate-600 mt-2">
                      Ordered: {ordered} • Picked: {picked}
                    </Text>
                  </View>

                  <View className="items-end">
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <Pressable
                        disabled={disableControls}
                        onPress={() => setPickedQuantity(it.orderItemId, clampInt(picked - 1, 0, ordered))}
                        className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center"
                      >
                        <Text className="font-outfit-bold text-slate-900">-</Text>
                      </Pressable>
                      <View className="w-10 items-center">
                        <Text className="font-outfit-bold text-slate-900">{picked}</Text>
                      </View>
                      <Pressable
                        disabled={disableControls}
                        onPress={() => setPickedQuantity(it.orderItemId, clampInt(picked + 1, 0, ordered))}
                        className="w-9 h-9 rounded-xl bg-emerald-500 items-center justify-center"
                      >
                        <Text className="font-outfit-bold text-white">+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {showSubToggle ? (
                  <View className="mt-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-inter-bold text-slate-800">Substitute</Text>
                      <Pressable
                        disabled={disableControls || !canSub}
                        onPress={() => {
                          const next = !isSub;
                          setSubstitution(it.orderItemId, next);
                          if (next) setSubOpenFor(it.orderItemId);
                        }}
                        className={`px-3 py-2 rounded-full ${isSub ? 'bg-emerald-500' : 'bg-slate-100'}`}
                      >
                        <Text className={`text-xs font-inter-bold ${isSub ? 'text-white' : 'text-slate-700'}`}>
                          {isSub ? 'ON' : 'OFF'}
                        </Text>
                      </Pressable>
                    </View>
                    {!canSub ? (
                      <Text className="text-[11px] font-inter text-slate-500 mt-2">Item này không cho phép thay thế.</Text>
                    ) : isSub ? (
                      <View className="mt-3 gap-y-2">
                        <Pressable
                          disabled={disableControls}
                          onPress={() => setSubOpenFor(it.orderItemId)}
                          className="px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                        >
                          <Text className="font-inter text-slate-900">
                            {st?.substitutedVariantId ? `Variant #${st.substitutedVariantId}` : 'Chọn hàng thay thế'}
                          </Text>
                          <Text className="text-[11px] font-inter text-slate-500 mt-1">Nhấn để mở danh sách gợi ý</Text>
                        </Pressable>
                        <TextInput
                          editable={!disableControls}
                          value={st?.reason ?? ''}
                          onChangeText={(v) => setReason(it.orderItemId, v)}
                          placeholder="Reason"
                          placeholderTextColor="#94A3B8"
                          className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-inter text-slate-900"
                        />
                      </View>
                    ) : (
                      <TextInput
                        editable={!disableControls}
                        value={st?.reason ?? ''}
                        onChangeText={(v) => setReason(it.orderItemId, v)}
                        placeholder="Reason (optional)"
                        placeholderTextColor="#94A3B8"
                        className="mt-3 px-4 py-3 rounded-2xl border border-slate-200 bg-white font-inter text-slate-900"
                      />
                    )}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </ScrollView>
      )}

      <View className="absolute left-0 right-0 bottom-0 p-4 bg-white border-t border-slate-200">
        <Button
          label={completeMutation.isPending ? 'Đang gửi...' : 'Complete Picking'}
          onPress={handleComplete}
          disabled={disableControls || completeMutation.isPending}
        />
      </View>

      <Modal visible={payloadOpen} transparent animationType="fade" onRequestClose={() => setPayloadOpen(false)}>
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white rounded-3xl w-full p-5">
            <Text className="font-outfit-bold text-slate-900 text-lg">Batch Payload</Text>
            <Text className="text-xs font-inter text-slate-500 mt-1">Đây là JSON sẽ gửi lên server khi chốt.</Text>

            <View className="mt-4 max-h-[320px] border border-slate-200 rounded-2xl p-3 bg-slate-50">
              <ScrollView>
                <Text className="text-[11px] font-inter text-slate-700">{payloadJson}</Text>
              </ScrollView>
            </View>

            <View className="mt-4 flex-row" style={{ gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="Huỷ" variant="outline" onPress={() => setPayloadOpen(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Gửi"
                  onPress={() => completeMutation.mutate(payload)}
                  disabled={!payload || completeMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={subOpenFor != null} transparent animationType="slide" onRequestClose={() => setSubOpenFor(null)}>
        <Pressable className="flex-1 bg-black/30" onPress={() => setSubOpenFor(null)} />
        <View className="bg-white rounded-t-3xl p-5">
          <Text className="font-outfit-bold text-slate-900 text-lg">Gợi ý hàng thay thế</Text>
          <Text className="text-xs font-inter text-slate-500 mt-1">Đã lọc theo: cùng danh mục • giá ≤ giá gốc • còn hàng</Text>

          <View className="mt-4" style={{ maxHeight: 420 }}>
            {substitutionsQuery.isLoading ? (
              <View className="gap-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </View>
            ) : substitutionsQuery.isError ? (
              <Card className="p-4 border border-slate-100">
                <Text className="text-sm font-inter text-slate-700">Không tải được danh sách.</Text>
                <View className="mt-3">
                  <Button label="Thử lại" onPress={() => void substitutionsQuery.refetch()} />
                </View>
              </Card>
            ) : (substitutionsQuery.data ?? []).length === 0 ? (
              <Card className="p-4 border border-slate-100">
                <Text className="text-sm font-inter text-slate-700">Không có lựa chọn thay thế phù hợp.</Text>
              </Card>
            ) : (
              <ScrollView>
                <View className="gap-y-3">
                  {(substitutionsQuery.data ?? []).map((opt) => (
                    <Pressable
                      key={opt.variantId}
                      onPress={() => {
                        setSubstitutedVariantId(subOpenFor as number, opt.variantId);
                        setSubOpenFor(null);
                      }}
                    >
                      <Card className={`p-4 border ${opt.isRecommended ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <Text className="font-inter-bold text-slate-900" numberOfLines={1}>
                              {opt.name}
                            </Text>
                            <Text className="text-xs font-inter text-slate-500 mt-1" numberOfLines={1}>
                              Stock: {opt.stock}
                            </Text>
                          </View>
                          <View className="items-end">
                            {opt.isRecommended ? (
                              <View className="px-2 py-1 rounded-full bg-emerald-500">
                                <Text className="text-[10px] font-inter-bold text-white">Recommended</Text>
                              </View>
                            ) : null}
                            <Text className="font-outfit-bold text-slate-900 mt-2">{Math.round(opt.price).toLocaleString('vi-VN')}₫</Text>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          <View className="mt-4">
            <Button label="Đóng" variant="outline" onPress={() => setSubOpenFor(null)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
