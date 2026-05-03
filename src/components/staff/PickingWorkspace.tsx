import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FulfillmentItem, AssignmentStatus } from '../../types/fulfillment';
import PickingItemCard from './PickingItemCard';
import BarcodeScanner from './BarcodeScanner';
import { ScanBarcode, CheckCircle, PackageSearch } from 'lucide-react-native';
import { safeNotification, safeImpact, NotificationFeedbackType, ImpactFeedbackStyle } from '../../utils/safeHaptics';
import { Audio } from 'expo-av';
import { clsx } from 'clsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PickingWorkspaceProps {
  items: FulfillmentItem[];
  onIncrement: (itemId: number) => void;
  onDecrement: (itemId: number) => void;
  onUpdateStatus: (status: AssignmentStatus) => void;
}

export default function PickingWorkspace({ 
  items, 
  onIncrement,
  onDecrement,
  onUpdateStatus 
}: PickingWorkspaceProps) {
  const insets = useSafeAreaInsets();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const listRef = useRef<{ scrollToIndex: (params: { index: number; animated?: boolean; viewPosition?: number }) => void } | null>(null);
  const [manualFocusItemId, setManualFocusItemId] = useState<number | null>(null);
  const lastFeedbackAtRef = useRef(0);
  const successSoundRef = useRef<Audio.Sound | null>(null);
  const errorSoundRef = useRef<Audio.Sound | null>(null);

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

  // Stats for the "Complete Picking" button visibility
  const progress = useMemo(() => {
    const total = items.length;
    const completed = items.filter(i => i.pickedQuantity >= i.quantity).length;
    return { total, completed, isAllDone: total === completed };
  }, [items]);

  const defaultFocusItemId = useMemo(() => {
    const firstPending = items.find((i) => i.pickedQuantity < i.quantity);
    return firstPending?.id ?? null;
  }, [items]);

  const focusItemId = useMemo(() => {
    if (manualFocusItemId !== null) {
      const item = items.find((i) => i.id === manualFocusItemId);
      if (item && item.pickedQuantity < item.quantity) return manualFocusItemId;
    }
    return defaultFocusItemId;
  }, [defaultFocusItemId, items, manualFocusItemId]);

  useEffect(() => {
    if (focusItemId === null) return;
    const index = items.findIndex((i) => i.id === focusItemId);
    if (index === -1) return;
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
  }, [focusItemId, items]);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    const itemIndex = items.findIndex(item => item.sku === barcode || item.barcode === barcode);
    
    if (itemIndex > -1) {
      const item = items[itemIndex];
      setManualFocusItemId(item.id);

      if (!item.isUnlocked && item.pickedQuantity < item.quantity) {
        const now = Date.now();
        if (now - lastFeedbackAtRef.current >= 500) {
          lastFeedbackAtRef.current = now;
          void safeNotification(NotificationFeedbackType.Success);
          void successSoundRef.current?.replayAsync();
        }
        onIncrement(item.id);
      } else if (item.pickedQuantity < item.quantity) {
        const now = Date.now();
        if (now - lastFeedbackAtRef.current >= 500) {
          lastFeedbackAtRef.current = now;
          void safeImpact(ImpactFeedbackStyle.Light);
          void successSoundRef.current?.replayAsync();
        }
      }

      setIsScannerOpen(false);
    } else {
      const now = Date.now();
      if (now - lastFeedbackAtRef.current >= 500) {
        lastFeedbackAtRef.current = now;
        void safeNotification(NotificationFeedbackType.Error);
        void errorSoundRef.current?.replayAsync();
      }
      Alert.alert('Lỗi', `Mã vạch ${barcode} không thuộc đơn hàng này.`, [{ text: 'Đóng' }]);
    }
  }, [items, onIncrement]);

  const renderItem = useCallback(
    ({ item }: { item: FulfillmentItem }) => (
      <PickingItemCard
        item={item}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onReportProblem={() => {}}
      />
    ),
    [onDecrement, onIncrement]
  );

  const keyExtractor = useCallback((item: FulfillmentItem) => String(item.id), []);

  const bottomBarHeight = 88 + insets.bottom;

  return (
    <View className="flex-1">
      {/* Progress Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row justify-between items-center">
        <View>
          <Text className="text-xs font-inter-bold text-slate-400 uppercase">Tiến độ soạn hàng</Text>
          <Text className="text-xl font-outfit-bold text-slate-900">
            {progress.completed} / {progress.total} sản phẩm
          </Text>
        </View>
      </View>

      <View className="flex-1 px-6 pt-4">
        <FlashList
          ref={listRef as unknown as never}
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={164}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: bottomBarHeight }} />}
        />
      </View>

      <View
        className="absolute left-0 right-0 bottom-0 bg-white border-t border-slate-100"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="px-6 pt-4 pb-4 flex-row" style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => setIsScannerOpen(true)}
            className="flex-1 bg-primary py-4 rounded-2xl flex-row justify-center items-center"
          >
            <ScanBarcode size={22} color="#FFF" />
            <Text className="text-white font-outfit-bold ml-2 text-base">Quét Barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onUpdateStatus(AssignmentStatus.COMPLETED)}
            disabled={!progress.isAllDone}
            className={clsx(
              'flex-1 py-4 rounded-2xl flex-row justify-center items-center',
              progress.isAllDone ? 'bg-success' : 'bg-slate-200'
            )}
          >
            {progress.isAllDone ? (
              <CheckCircle size={22} color="#FFF" />
            ) : (
              <PackageSearch size={22} color="#94A3B8" />
            )}
            <Text className={clsx(
              'font-outfit-bold ml-2 text-base',
              progress.isAllDone ? 'text-white' : 'text-slate-400'
            )}>
              {progress.isAllDone ? 'Hoàn tất' : 'Chưa đủ'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen Scanner Overlay */}
      {isScannerOpen && (
        <View className="absolute inset-0 z-50">
          <BarcodeScanner 
            onScan={handleBarcodeScanned} 
            onClose={() => setIsScannerOpen(false)} 
          />
        </View>
      )}
    </View>
  );
}
