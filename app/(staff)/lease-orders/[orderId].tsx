import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
// BottomSheet removed — incompatible with Expo Go (requires react-native-worklets TurboModule)
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Skeleton from '../../../src/components/ui/Skeleton';
import BarcodeScanner from '../../../src/components/staff/BarcodeScanner';
import { staffOrdersApi } from '../../../src/api/staffOrders';
import { staffIssuesApi } from '../../../src/api/staffIssues';
import { useStaffPickingStore } from '../../../src/store/staffPickingStore';
import { clampInt } from '../../../src/utils/staffPickingUtils';
import { safeNotification, safeImpact, NotificationFeedbackType, ImpactFeedbackStyle } from '../../../src/utils/safeHaptics';
import { Audio } from 'expo-av';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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
  const setIssueReported = useStaffPickingStore((s) => s.setIssueReported);
  const buildPayload = useStaffPickingStore((s) => s.buildPayload);
  const enqueueComplete = useStaffPickingStore((s) => s.enqueueComplete);

  const [payloadOpen, setPayloadOpen] = useState(false);
  const [subOpenFor, setSubOpenFor] = useState<number | null>(null);
  const [issueOpenFor, setIssueOpenFor] = useState<number | null>(null);
  const [issueDraftReason, setIssueDraftReason] = useState('');
  const [disableControls, setDisableControls] = useState(false);
  const [now, setNow] = useState(Date.now());
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<{ scrollToIndex: (params: { index: number; animated?: boolean; viewPosition?: number }) => void } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const lastFeedbackAtRef = useRef(0);
  const successSoundRef = useRef<Audio.Sound | null>(null);
  const errorSoundRef = useRef<Audio.Sound | null>(null);
  const [issueSheetVisible, setIssueSheetVisible] = useState(false);
  // issueSnapPoints removed — no longer needed with Modal

  const pickListQuery = useQuery({
    queryKey: ['staff-pick-list', orderId],
    queryFn: () => staffOrdersApi.getPickList(orderId),
    enabled: orderId > 0,
    staleTime: 0,
  });

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: 1,
          playsInSilentModeIOS: true,
          interruptionModeAndroid: 1,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const success = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg' },
          { shouldPlay: false, volume: 0.9 }
        );
        const error = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
          { shouldPlay: false, volume: 1.0 }
        );

        if (!mounted) {
          await success.sound.unloadAsync();
          await error.sound.unloadAsync();
          return;
        }
        successSoundRef.current = success.sound;
        errorSoundRef.current = error.sound;
      } catch (e) {
        void e;
      }
    };
    void init();
    return () => {
      mounted = false;
      const s1 = successSoundRef.current;
      const s2 = errorSoundRef.current;
      successSoundRef.current = null;
      errorSoundRef.current = null;
      if (s1) void s1.unloadAsync();
      if (s2) void s2.unloadAsync();
    };
  }, []);

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
      Alert.alert('Lease hết hạn', err.message || 'Lease đã hết hạn hoặc bạn không còn quyền với đơn này.', [{ text: 'Đóng' }]);
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
    onError: (e) => Alert.alert('Lỗi', (e as Error).message, [{ text: 'Đóng' }]),
  });

  const completeMutation = useMutation({
    mutationFn: (payload: unknown) => staffOrdersApi.completePicking(orderId, payload as never),
    onSuccess: () => {
      setDisableControls(true);
      clearSession();
      setPayloadOpen(false);
      Alert.alert('Thành công', 'Đã chốt nhặt hàng.', [{ text: 'Đóng' }]);
      router.replace('/(staff)/lease-queue' as never);
    },
    onError: (e) => {
      const err = e as Error;
      const out = enqueueComplete();
      setPayloadOpen(false);
      if (out) {
        Alert.alert('Đã lưu offline', `Không gửi được lên máy chủ. Dữ liệu đã được lưu và sẽ đồng bộ lại từ Hàng chờ.\n\n${err.message}`, [{ text: 'Đóng' }]);
        router.replace('/(staff)/lease-queue' as never);
      } else {
        Alert.alert('Lỗi', err.message, [{ text: 'Đóng' }]);
      }
    },
  });

  const items = useMemo(() => {
    const data = pickListQuery.data;
    return data?.items ?? [];
  }, [pickListQuery.data]);

  const sessionItems = useMemo(() => session?.itemsById ?? {}, [session?.itemsById]);
  const hasIssues = useMemo(() => Object.values(sessionItems).some((x) => Boolean(x.issueReported)), [sessionItems]);

  const payload = useMemo(() => buildPayload(), [buildPayload]);
  const payloadJson = useMemo(() => (payload ? JSON.stringify(payload, null, 2) : ''), [payload]);

  const substitutionsQuery = useQuery({
    queryKey: ['staff-substitutions', orderId, subOpenFor],
    queryFn: () => staffOrdersApi.getSubstitutions(orderId, subOpenFor as number),
    enabled: orderId > 0 && typeof subOpenFor === 'number',
    staleTime: 0,
  });

  const issueMutation = useMutation({
    mutationFn: (input: { orderItemId: number; reason: string }) =>
      staffIssuesApi.create({
        orderId,
        orderItemId: input.orderItemId,
        issueType: 'OUT_OF_STOCK',
        details: { reason: input.reason },
      }),
    onSuccess: () => {
      clearSession();
      setIssueSheetVisible(false);
      setIssueOpenFor(null);
      setIssueDraftReason('');
      Alert.alert('Đã gửi', 'Sự cố đã được ghi nhận. Đơn đã được chuyển sang ON_HOLD.', [{ text: 'Đóng' }]);
      router.replace('/(staff)/lease-queue' as never);
    },
    onError: (e) => Alert.alert('Lỗi', (e as Error).message, [{ text: 'Đóng' }]),
  });

  const bottomBarHeight = 92 + insets.bottom;

  const playFeedback = useCallback(
    (kind: 'success' | 'error' | 'light') => {
      const nowTs = Date.now();
      if (nowTs - lastFeedbackAtRef.current < 500) return;
      lastFeedbackAtRef.current = nowTs;

      if (kind === 'success') {
        void safeNotification(NotificationFeedbackType.Success);
        void successSoundRef.current?.replayAsync();
        return;
      }
      if (kind === 'error') {
        void safeNotification(NotificationFeedbackType.Error);
        void errorSoundRef.current?.replayAsync();
        return;
      }
      void safeImpact(ImpactFeedbackStyle.Light);
      void successSoundRef.current?.replayAsync();
    },
    []
  );

  const openIssueSheet = useCallback(
    (orderItemId: number) => {
      const st = useStaffPickingStore.getState().session?.itemsById?.[orderItemId];
      setIssueOpenFor(orderItemId);
      setIssueDraftReason(st?.reason ?? '');
      setIssueSheetVisible(true);
    },
    []
  );

  const handleBarcodeScanned = useCallback(
    (code: string) => {
      const uiStart =
        typeof globalThis !== 'undefined' &&
        'performance' in globalThis &&
        typeof (globalThis as { performance?: { now?: () => number } }).performance?.now === 'function'
          ? (globalThis as { performance: { now: () => number } }).performance.now()
          : Date.now();
      const clean = String(code ?? '').trim();
      if (!clean) return;
      const index = items.findIndex((it) => it.sku === clean || (it.barcode ? it.barcode === clean : false));
      if (index < 0) {
        playFeedback('error');
        Alert.alert('Sai mã', `Mã ${clean} không thuộc danh sách nhặt.`, [{ text: 'Đóng' }]);
        return;
      }

      const it = items[index];
      const st = useStaffPickingStore.getState().session?.itemsById?.[it.orderItemId];
      const picked = st ? st.pickedQuantity : 0;
      const ordered = st ? st.orderedQuantity : it.orderedQuantity;

      try {
        (listRef.current as unknown as { scrollToIndex?: (p: { index: number; animated?: boolean; viewPosition?: number }) => void })?.scrollToIndex?.({
          index,
          animated: true,
          viewPosition: 0.2,
        });
      } catch (e) {
        void e;
      }

      if (picked < ordered) {
        playFeedback('success');
        setPickedQuantity(it.orderItemId, clampInt(picked + 1, 0, ordered));
      } else {
        playFeedback('light');
      }

      setIsScannerOpen(false);

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        const uiEnd =
          typeof globalThis !== 'undefined' &&
          'performance' in globalThis &&
          typeof (globalThis as { performance?: { now?: () => number } }).performance?.now === 'function'
            ? (globalThis as { performance: { now: () => number } }).performance.now()
            : Date.now();
        console.log(`[UI] scan->update ${Math.round(uiEnd - uiStart)}ms`);
      }
    },
    [items, playFeedback, setPickedQuantity]
  );

  const handleComplete = useCallback(() => {
    if (!payload) {
      Alert.alert('Thiếu dữ liệu', 'Không có dữ liệu để gửi.', [{ text: 'Đóng' }]);
      return;
    }
    setPayloadOpen(true);
  }, [payload]);

  const handlePark = useCallback(() => {
    Alert.alert('Tạm gác đơn', 'Thả lease để quay lại Hàng chờ nhận đơn khác?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Tạm gác', style: 'destructive', onPress: () => releaseMutation.mutate() },
    ]);
  }, [releaseMutation]);

  if (orderId === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center p-6">
        <Text className="font-outfit-bold text-slate-900 text-lg">ID đơn hàng không hợp lệ</Text>
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
          title: `Danh sách nhặt #${orderId}`,
          headerRight: () => (
            <Button
              label="Thả đơn"
              variant="ghost"
              onPress={() => {
                Alert.alert('Thả đơn', 'Bạn muốn thả đơn này?', [
                  { text: 'Hủy', style: 'cancel' },
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
        <FlashList
          ref={listRef as unknown as never}
          data={items}
          keyExtractor={(it) => String(it.orderItemId)}
          estimatedItemSize={196}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomBarHeight }}
          renderItem={({ item: it }) => {
            const st = sessionItems[it.orderItemId];
            const picked = st ? st.pickedQuantity : 0;
            const ordered = st ? st.orderedQuantity : it.orderedQuantity;
            const canSub = st ? st.allowSubstitution : it.allowSubstitution;
            const showSubToggle = picked < ordered;
            const isSub = Boolean(st?.isSubstituted);

            return (
              <Card className="p-4 border border-slate-100 bg-white mb-3">
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

                    <View className="mt-3 flex-row" style={{ gap: 10 }}>
                      <TouchableOpacity
                        disabled={disableControls}
                        onPress={() => openIssueSheet(it.orderItemId)}
                        className="px-3 py-2 rounded-full bg-amber-50 border border-amber-200"
                      >
                        <Text className="text-xs font-inter-bold text-amber-700">Báo thiếu hàng</Text>
                      </TouchableOpacity>
                      {st?.reason?.trim() ? (
                        <View className="flex-1 justify-center">
                          <Text className="text-[11px] font-inter text-slate-500" numberOfLines={1}>
                            Note: {st.reason}
                          </Text>
                        </View>
                      ) : null}
                    </View>
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

                    <View className="mt-2 flex-row" style={{ gap: 8 }}>
                      <Pressable
                        disabled={disableControls}
                        onPress={() => {
                          setPickedQuantity(it.orderItemId, ordered);
                          playFeedback('success');
                        }}
                        className="px-3 py-2 rounded-full bg-slate-100"
                      >
                        <Text className="text-[11px] font-inter-bold text-slate-700">Đủ</Text>
                      </Pressable>
                      <Pressable
                        disabled={disableControls}
                        onPress={() => {
                          setPickedQuantity(it.orderItemId, 0);
                          if (!st?.reason?.trim()) setReason(it.orderItemId, 'Hủy dòng');
                          playFeedback('light');
                        }}
                        className="px-3 py-2 rounded-full bg-slate-100"
                      >
                        <Text className="text-[11px] font-inter-bold text-slate-700">0</Text>
                      </Pressable>
                    </View>

                    {picked > 0 && picked < ordered ? (
                      <Text className="mt-2 text-[11px] font-inter text-amber-700">Giao một phần</Text>
                    ) : picked === 0 ? (
                      <Text className="mt-2 text-[11px] font-inter text-slate-500">Nhập 0 để hủy dòng</Text>
                    ) : null}
                  </View>
                </View>

                {showSubToggle ? (
                  <View className="mt-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-inter-bold text-slate-800">Thay thế</Text>
                      <Pressable
                        disabled={disableControls || !canSub}
                        onPress={() => {
                          const next = !isSub;
                          setSubstitution(it.orderItemId, next);
                          if (next) setSubOpenFor(it.orderItemId);
                        }}
                        className={`px-3 py-2 rounded-full ${isSub ? 'bg-primary' : 'bg-slate-100'}`}
                      >
                        <Text className={`text-xs font-inter-bold ${isSub ? 'text-white' : 'text-slate-700'}`}>
                          {isSub ? 'BẬT' : 'TẮT'}
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
                          placeholder="Lý do"
                          placeholderTextColor="#94A3B8"
                          className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-inter text-slate-900"
                        />
                      </View>
                    ) : (
                      <TextInput
                        editable={!disableControls}
                        value={st?.reason ?? ''}
                        onChangeText={(v) => setReason(it.orderItemId, v)}
                        placeholder="Lý do (không bắt buộc)"
                        placeholderTextColor="#94A3B8"
                        className="mt-3 px-4 py-3 rounded-2xl border border-border bg-surface font-inter text-text"
                      />
                    )}
                  </View>
                ) : null}
              </Card>
            );
          }}
        />
      )}

      <View
        className="absolute left-0 right-0 bottom-0 bg-surface border-t border-border"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="px-4 pt-4 pb-4 flex-row" style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => setIsScannerOpen(true)}
            className="flex-1 bg-primary py-4 rounded-2xl flex-row justify-center items-center"
          >
            <Text className="text-white font-outfit-bold text-base">Quét mã vạch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={hasIssues ? handlePark : handleComplete}
            disabled={disableControls || completeMutation.isPending}
            className={`flex-1 py-4 rounded-2xl items-center justify-center ${
              disableControls || completeMutation.isPending
                ? 'bg-slate-200'
                : hasIssues
                  ? 'bg-amber-500'
                  : 'bg-primary'
            }`}
          >
            <Text
              className={`font-outfit-bold text-base ${
                disableControls || completeMutation.isPending ? 'text-slate-500' : 'text-white'
              }`}
            >
              {completeMutation.isPending ? 'Đang gửi…' : hasIssues ? 'Tạm gác' : 'Hoàn tất'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-4 pb-2">
          <Button
            label={hasIssues ? 'Hoàn tất (override)' : 'Tạm gác (thả lease)'}
            variant="ghost"
            onPress={() => {
              if (hasIssues) {
                handleComplete();
                return;
              }
              Alert.alert('Tạm gác đơn', 'Thả lease để quay lại Hàng chờ nhận đơn khác?', [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Thả', style: 'destructive', onPress: () => releaseMutation.mutate() },
              ]);
            }}
          />
        </View>
      </View>

      <Modal
        visible={issueSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIssueSheetVisible(false);
          setIssueOpenFor(null);
          setIssueDraftReason('');
        }}
      >
        <Pressable className="flex-1 bg-black/40" onPress={() => {
          setIssueSheetVisible(false);
          setIssueOpenFor(null);
          setIssueDraftReason('');
        }} />
        <View className="bg-surface rounded-t-3xl px-5 pt-4 pb-8">
          <Text className="font-outfit-bold text-text text-lg">Báo cáo thiếu hàng</Text>
          <Text className="text-xs font-inter text-muted mt-1">Ghi chú sẽ được gửi kèm khi hoàn tất nhặt hàng.</Text>

          <View className="mt-4 flex-row flex-wrap" style={{ gap: 10 }}>
            {['Hết hàng', 'Hư hỏng', 'Sai kệ / Sai mã', 'Khác'].map((x) => (
              <Pressable
                key={x}
                onPress={() => setIssueDraftReason((prev) => (prev?.trim() ? prev : x))}
                className="px-3 py-2 rounded-full bg-slate-100"
              >
                <Text className="text-xs font-inter-bold text-slate-700">{x}</Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-4">
            <TextInput
              value={issueDraftReason}
              onChangeText={setIssueDraftReason}
              placeholder="Mô tả nhanh (vd: hết hàng ở kệ A3, còn 0...)"
              placeholderTextColor="#94A3B8"
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-white font-inter text-slate-900"
              multiline
              style={{ minHeight: 92, textAlignVertical: 'top' }}
            />
          </View>

          <View className="mt-4 flex-row" style={{ gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button label="Đóng" variant="outline" onPress={() => {
                setIssueSheetVisible(false);
                setIssueOpenFor(null);
                setIssueDraftReason('');
              }} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="Lưu"
                onPress={() => {
                  if (issueOpenFor != null) {
                    setReason(issueOpenFor, issueDraftReason);
                    setIssueReported(issueOpenFor, Boolean(issueDraftReason.trim()));
                    playFeedback(issueDraftReason.trim() ? 'success' : 'light');
                  }
                  setIssueSheetVisible(false);
                  setIssueOpenFor(null);
                  setIssueDraftReason('');
                }}
              />
            </View>
          </View>

          <View className="mt-3">
            <Button
              label={issueMutation.isPending ? 'Đang gửi…' : 'Gửi báo cáo (ON_HOLD)'}
              onPress={() => {
                if (issueOpenFor == null) return;
                if (!issueDraftReason.trim()) {
                  Alert.alert('Thiếu thông tin', 'Vui lòng nhập lý do để gửi báo cáo.', [{ text: 'Đóng' }]);
                  return;
                }
                issueMutation.mutate({ orderItemId: issueOpenFor, reason: issueDraftReason.trim() });
              }}
              disabled={issueMutation.isPending}
            />
          </View>

          {issueOpenFor != null ? (
            <View className="mt-3">
              <Button
                label="Bỏ đánh dấu sự cố"
                variant="outline"
                onPress={() => {
                  setIssueReported(issueOpenFor, false);
                  setIssueDraftReason('');
                  playFeedback('light');
                  setIssueSheetVisible(false);
                  setIssueOpenFor(null);
                }}
              />
            </View>
          ) : null}

          <View className="mt-3">
            <Button
              label="Gợi ý hàng thay thế"
              variant="ghost"
              onPress={() => {
                if (issueOpenFor == null) return;
                setSubstitution(issueOpenFor, true);
                setSubOpenFor(issueOpenFor);
                setIssueSheetVisible(false);
                setIssueOpenFor(null);
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={payloadOpen} transparent animationType="fade" onRequestClose={() => setPayloadOpen(false)}>
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white rounded-3xl w-full p-5">
            <Text className="font-outfit-bold text-slate-900 text-lg">Dữ liệu gửi lên</Text>
            <Text className="text-xs font-inter text-slate-500 mt-1">Đây là dữ liệu sẽ gửi lên máy chủ khi chốt.</Text>

            <View className="mt-4 max-h-[320px] border border-slate-200 rounded-2xl p-3 bg-slate-50">
              <ScrollView>
                <Text className="text-[11px] font-inter text-slate-700">{payloadJson}</Text>
              </ScrollView>
            </View>

            <View className="mt-4 flex-row" style={{ gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button label="Hủy" variant="outline" onPress={() => setPayloadOpen(false)} />
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

      {isScannerOpen && (
        <View className="absolute inset-0 z-50">
          <BarcodeScanner onScan={handleBarcodeScanned} onClose={() => setIsScannerOpen(false)} />
        </View>
      )}

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
