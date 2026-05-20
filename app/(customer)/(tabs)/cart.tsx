import { View, Text, Pressable, Alert, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShoppingCart, RefreshCw, Sparkles, Check } from 'lucide-react-native';
import Button from '../../../src/components/ui/Button';
import { useCart } from '../../../src/hooks/useCart';
import { CartItem } from '../../../src/types/cart';

export default function CartScreen() {
  const router = useRouter();
  const { items, isLoading, isError, refetch, updateQuantity, removeItem, isUpdating } =
    useCart();
  
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  // Auto-initialize: select all items by default on initial load
  useEffect(() => {
    if (items.length > 0 && !hasInitializedSelection) {
      setSelectedIds(new Set(items.map(i => i.cartItemId as number).filter(Boolean)));
      setHasInitializedSelection(true);
    }
  }, [items, hasInitializedSelection]);

  // Compute selected items and subtotal
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(item.cartItemId as number));
  }, [items, selectedIds]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }, [selectedItems]);

  const sections = useMemo(() => {
    const manual = items.filter((item) => item.source !== 'AI');
    const aiGroups = new Map<string, CartItem[]>();
    items.filter((item) => item.source === 'AI').forEach((item) => {
      const key = item.aiListCode || 'AI-GENERATED';
      aiGroups.set(key, [...(aiGroups.get(key) ?? []), item]);
    });

    return [
      ...(manual.length ? [{ key: 'manual', title: 'Giỏ hàng thủ công', subtitle: 'Sản phẩm bạn tự thêm', type: 'MANUAL' as const, data: manual }] : []),
      ...Array.from(aiGroups.entries()).map(([key, data], index) => ({
        key,
        title: data[0]?.aiListName || `Danh sách AI ${index + 1}`,
        subtitle: `${data.length} sản phẩm do AI gợi ý`,
        type: 'AI' as const,
        data,
      })),
    ];
  }, [items]);

  const toggleProcessing = (id: number, active: boolean) => {
    setProcessingIds(prev => {
      const next = new Set(prev);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Section checkbox helpers
  const isSectionAllSelected = useCallback((sectionData: CartItem[]) => {
    const ids = sectionData.map(i => i.cartItemId as number).filter(Boolean);
    if (ids.length === 0) return false;
    return ids.every(id => selectedIds.has(id));
  }, [selectedIds]);

  const toggleSection = useCallback((sectionData: CartItem[]) => {
    const ids = sectionData.map(i => i.cartItemId as number).filter(Boolean);
    const allSel = isSectionAllSelected(sectionData);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSel) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }, [isSectionAllSelected]);

  // Overall select all helpers
  const allItemsSelected = items.length > 0 && items.every(i => selectedIds.has(i.cartItemId as number));
  const toggleSelectAll = () => {
    if (allItemsSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.cartItemId as number).filter(Boolean)));
    }
  };

  const renderSectionHeader = ({ section }: { section: { title: string; subtitle: string; type: 'MANUAL' | 'AI'; data: CartItem[] } }) => {
    const allSel = isSectionAllSelected(section.data);
    return (
      <View className="mb-3 mt-4 rounded-3xl border border-slate-100 bg-white px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Section Checkbox */}
          <Pressable
            onPress={() => toggleSection(section.data)}
            className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${
              allSel 
                ? 'bg-primary border-primary' 
                : 'border-slate-300 bg-white'
            }`}
          >
            {allSel && <Check size={11} color="#FFF" />}
          </Pressable>

          <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${section.type === 'AI' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
            {section.type === 'AI' ? <Sparkles size={18} color="#059669" /> : <ShoppingBag size={18} color="#475569" />}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-outfit-bold text-slate-900">{section.title}</Text>
            <Text className="text-xs font-inter text-slate-500 mt-0.5">{section.subtitle}</Text>
          </View>
        </View>
        {section.type === 'AI' ? (
          <View className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <Text className="text-[10px] font-inter-bold text-emerald-700">GỢI Ý AI</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const handleUpdate = async (cid: number, newQty: number) => {
    if (processingIds.has(cid)) return;
    toggleProcessing(cid, true);
    try {
      await updateQuantity({ cartItemId: cid, quantity: newQty });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('not found') || msg.includes('404')) {
        await refetch();
      } else {
        Alert.alert('Thông báo', 'Không thể cập nhật số lượng. Vui lòng thử lại.');
      }
    } finally {
      toggleProcessing(cid, false);
    }
  };

  const handleRemove = async (item: CartItem) => {
    const cid = item.cartItemId as number;
    if (processingIds.has(cid)) return;

    Alert.alert(
      'Xác nhận xoá',
      `Bạn có chắc chắn muốn xoá "${item.name}" khỏi giỏ hàng?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            toggleProcessing(cid, true);
            try {
              await removeItem({ cartItemId: cid });
              setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(cid);
                return next;
              });
            } catch (e) {
              const msg = e instanceof Error ? e.message : '';
              if (msg.includes('not found') || msg.includes('404')) {
                await refetch();
              } else {
                Alert.alert('Thông báo', 'Không thể xoá sản phẩm này.');
              }
            } finally {
              toggleProcessing(cid, false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const isAtMax = item.quantity >= (item.stock ?? 999);
    const isAtMin = item.quantity <= 1;
    const cid = item.cartItemId as number;
    const isProcessing = cid ? processingIds.has(cid) : false;
    const isDisabled = !cid || isProcessing || isUpdating;
    const isSelected = selectedIds.has(cid);

    const toggleSelectItem = () => {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(cid)) next.delete(cid);
        else next.add(cid);
        return next;
      });
    };

    return (
      <View 
        className="mb-4 bg-white rounded-[28px] p-4 border border-slate-50 flex-row items-center"
        style={{ 
          opacity: isDisabled ? 0.6 : 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2
        }}
      >
        {/* Item Checkbox */}
        <Pressable
          onPress={toggleSelectItem}
          disabled={isDisabled}
          className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${
            isSelected 
              ? 'bg-primary border-primary' 
              : 'border-slate-300 bg-white'
          }`}
        >
          {isSelected && <Check size={11} color="#FFF" />}
        </Pressable>

        {/* Product Image */}
        <View className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100">
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="disk"
            transition={200}
          />
        </View>

        {/* Product Details */}
        <View className="flex-1 ml-4 justify-between">
          <View>
            <View className="flex-row justify-between items-start">
              <Text className="flex-1 text-base font-outfit-bold text-slate-900 pr-2" numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable
                onPress={() => handleRemove(item)}
                className="p-1"
                hitSlop={8}
                disabled={isDisabled}
              >
                <Trash2 size={16} color={isDisabled ? "#E2E8F0" : "#94A3B8"} />
              </Pressable>
            </View>
            <Text className="text-xs font-inter text-slate-500 mt-1">
              Đơn vị: {item.unit}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View>
              <View className="flex-row items-center">
                <Text className="text-lg font-outfit-bold text-primary">
                  {item.price.toLocaleString('vi-VN')}₫
                </Text>
                {item.originalPrice && (
                  <Text className="text-[11px] font-inter text-slate-400 line-through ml-2">
                    {item.originalPrice.toLocaleString('vi-VN')}₫
                  </Text>
                )}
              </View>
              {item.discountPercent && (
                <View className="bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 self-start mt-0.5">
                   <Text className="text-[9px] font-outfit-bold text-red-600">TIẾT KIỆM {item.discountPercent}%</Text>
                </View>
              )}
            </View>

            {/* Quantity Controls */}
            <View className="flex-row items-center bg-slate-50 rounded-xl px-1 py-1 border border-slate-100">
              <Pressable
                onPress={() => handleUpdate(cid, item.quantity - 1)}
                className="w-8 h-8 items-center justify-center rounded-lg"
                style={[
                  { backgroundColor: '#FFF' },
                  (isAtMin || isDisabled) ? { opacity: 0.3 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }
                ]}
                disabled={isAtMin || isDisabled}
              >
                <Minus size={16} color="#0F172A" />
              </Pressable>

              <View className="px-3 min-w-[36px] items-center">
                <Text className="text-sm font-outfit-bold text-slate-900">{item.quantity}</Text>
              </View>

              <Pressable
                onPress={() => handleUpdate(cid, item.quantity + 1)}
                className="w-8 h-8 items-center justify-center rounded-lg"
                style={[
                  { backgroundColor: '#FFF' },
                  (isAtMax || isDisabled) ? { opacity: 0.3 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }
                ]}
                disabled={isAtMax || isDisabled}
              >
                <Plus size={16} color="#0F172A" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#FBFBFC]">
      {/* Custom Header */}
      <View className="px-6 pt-14 pb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-outfit-bold text-slate-900">Giỏ hàng</Text>
          <Text className="text-xs font-inter text-slate-500 mt-0.5">
            Bạn có {items.length} mặt hàng
          </Text>
        </View>
        <Pressable 
          onPress={() => refetch()}
          className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-sm border border-slate-100"
        >
          {isLoading ? (
             <RefreshCw size={22} color="#16A34A" className="animate-spin" />
          ) : (
            <ShoppingBag size={22} color="#16A34A" />
          )}
        </Pressable>
      </View>

      {/* Select All Row */}
      {items.length > 0 && (
        <Pressable
          onPress={toggleSelectAll}
          className="flex-row items-center px-6 py-3 bg-white border-b border-slate-100"
        >
          <View
            className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${
              allItemsSelected 
                ? 'bg-primary border-primary' 
                : 'border-slate-300 bg-white'
            }`}
          >
            {allItemsSelected && <Check size={11} color="#FFF" />}
          </View>
          <Text className="text-sm font-inter-semibold text-slate-700">Chọn tất cả ({items.length} sản phẩm)</Text>
        </Pressable>
      )}

      <View className="flex-1 px-6">
        {items.length > 0 ? (
          <SectionList
            sections={sections}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.cartItemId ?? item.productId)}
            renderSectionHeader={renderSectionHeader}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isLoading}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center pb-20">
            <View className="w-32 h-32 bg-slate-100 rounded-full items-center justify-center mb-6">
              <ShoppingCart size={50} color="#CBD5E1" />
            </View>
            <Text className="text-xl font-outfit-bold text-slate-900">Giỏ hàng đang trống</Text>
            <Text className="text-sm font-inter text-slate-500 text-center mt-2 px-10">
              Hãy dạo quanh cửa hàng và chọn những sản phẩm tươi ngon nhất cho mình nhé!
            </Text>
            <Pressable 
              onPress={() => router.push('/(customer)/(tabs)/shop' as never)}
              className="mt-8 px-8 py-4 bg-primary rounded-2xl flex-row items-center"
              style={{ shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
            >
              <Text className="text-white font-inter-bold mr-2">Khám phá ngay</Text>
              <ArrowRight size={18} color="#FFF" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom Summary & Checkout */}
      {items.length > 0 && (
        <View 
          className="px-6 pt-6 pb-10 bg-white rounded-t-[40px] border-t border-slate-50"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 20 }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-sm font-inter text-slate-500">Tổng cộng ({selectedItems.length} món)</Text>
              <Text className="text-[28px] font-outfit-bold text-slate-900">
                {selectedSubtotal.toLocaleString('vi-VN')}₫
              </Text>
            </View>
            <View className="bg-slate-50 px-4 py-2 rounded-xl">
              <Text className="text-xs font-inter-bold text-slate-500 uppercase">Tạm tính</Text>
            </View>
          </View>
          
          <Button
            label={selectedItems.length === 0 ? "Chọn sản phẩm" : "Thanh toán ngay"}
            onPress={() => {
              if (selectedIds.size === 0) {
                Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.');
                return;
              }
              router.push({
                pathname: '/(customer)/checkout',
                params: { selectedIds: Array.from(selectedIds).join(',') }
              } as never);
            }}
            disabled={selectedIds.size === 0 || isUpdating}
            loading={isUpdating}
            className="h-14 rounded-2xl"
          />
        </View>
      )}

      {isError && !isLoading && (
        <Pressable onPress={() => refetch()} className="absolute top-32 left-0 right-0 items-center">
          <View className="bg-red-50 px-4 py-2 rounded-full border border-red-100">
            <Text className="text-red-500 text-xs font-inter-bold">Lỗi tải dữ liệu. Bấm để thử lại.</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
