import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { FulfillmentItem, AssignmentStatus } from '../../types/fulfillment';
import PickingItemCard from './PickingItemCard';
import BarcodeScanner from './BarcodeScanner';
import { ScanBarcode, CheckCircle, PackageSearch } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { clsx } from 'clsx';

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const listRef = useRef<{ scrollToIndex: (params: { index: number; animated?: boolean; viewPosition?: number }) => void } | null>(null);
  const [manualFocusItemId, setManualFocusItemId] = useState<number | null>(null);

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onIncrement(item.id);
      } else if (item.pickedQuantity < item.quantity) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setIsScannerOpen(false);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Lỗi', `Mã vạch ${barcode} không thuộc đơn hàng này.`);
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

  return (
    <View className="flex-1">
      {/* Search / Scan Header */}
      <View className="px-6 py-4 bg-white border-b border-slate-100 flex-row justify-between items-center">
        <View>
          <Text className="text-xs font-inter-bold text-slate-400 uppercase">Tiến độ soạn hàng</Text>
          <Text className="text-xl font-outfit-bold text-slate-900">
            {progress.completed} / {progress.total} sản phẩm
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => setIsScannerOpen(true)}
          className="bg-primary px-4 py-3 rounded-2xl flex-row items-center"
        >
          <ScanBarcode size={20} color="#FFF" />
          <Text className="text-white font-inter-bold ml-2">Quét mã</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-4">
        <FlashList
          ref={listRef as unknown as never}
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={164}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View className="h-20" />}
        />
      </View>

      {/* Completion Footer */}
      <View className="p-6 bg-white border-t border-slate-100 shadow-lg">
        <TouchableOpacity 
          onPress={() => onUpdateStatus(AssignmentStatus.COMPLETED)}
          disabled={!progress.isAllDone}
          className={clsx(
            'w-full py-4 rounded-2xl flex-row justify-center items-center',
            progress.isAllDone ? 'bg-success' : 'bg-slate-200'
          )}
        >
          {progress.isAllDone ? (
            <CheckCircle size={24} color="#FFF" />
          ) : (
            <PackageSearch size={24} color="#94A3B8" />
          )}
          <Text className={clsx(
            'text-lg font-outfit-bold ml-2',
            progress.isAllDone ? 'text-white' : 'text-slate-400'
          )}>
            {progress.isAllDone ? 'Hoàn tất soạn hàng' : 'Chưa đủ sản phẩm'}
          </Text>
        </TouchableOpacity>
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
