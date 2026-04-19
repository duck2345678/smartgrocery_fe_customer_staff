import { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { useMealPlanStore } from '../../src/store/aiMealPlanStore';
import { useCart } from '../../src/hooks/useCart';
import { productApi } from '../../src/api/products';
import { useQueries } from '@tanstack/react-query';
import { CheckCircle2, Circle, RefreshCw, ShoppingCart } from 'lucide-react-native';
import { clsx } from 'clsx';

type RowItem = {
  productId: number;
  name: string;
  unit: string;
  quantity: number;
};

export default function AiMealReviewScreen() {
  const router = useRouter();
  const { title, items, actions } = useMealPlanStore();
  const clear = useMealPlanStore((s) => s.clear);
  const { addProduct } = useCart();
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const ingredientRows: RowItem[] = useMemo(() => {
    const byId: Record<number, RowItem> = {};
    actions.forEach((a) => {
      if (a.type !== 'ADD_TO_CART') return;
      byId[a.productId] = {
        productId: a.productId,
        name: items.find((x) => x.productId === a.productId)?.name ?? a.label,
        unit: items.find((x) => x.productId === a.productId)?.unit ?? '',
        quantity: (byId[a.productId]?.quantity ?? 0) + a.quantity,
      };
    });
    return Object.values(byId);
  }, [actions, items]);

  const productQueries = useQueries({
    queries: ingredientRows.map((r) => ({
      queryKey: ['product', r.productId],
      queryFn: () => productApi.getProductById(r.productId),
      staleTime: 2 * 60 * 1000,
    })),
  });

  const productsById = useMemo(() => {
    const map = new Map<number, { stock: number }>();
    ingredientRows.forEach((r, idx) => {
      const data = productQueries[idx]?.data;
      if (data) map.set(r.productId, { stock: data.stock });
    });
    return map;
  }, [ingredientRows, productQueries]);

  const hasLoading = productQueries.some((q) => q.isLoading);
  const hasError = productQueries.some((q) => q.isError);

  const selectedCount = useMemo(
    () => ingredientRows.filter((r) => (selected[r.productId] ?? true)).length,
    [ingredientRows, selected]
  );

  const handleApply = async () => {
    const picked = ingredientRows.filter((r) => (selected[r.productId] ?? true));
    if (picked.length === 0) {
      Alert.alert('Thông báo', 'Bạn chưa chọn nguyên liệu nào.');
      return;
    }

    for (const row of picked) {
      const product = await productApi.getProductById(row.productId);
      if (product.stock <= 0) continue;
      await addProduct({ product, quantity: row.quantity });
    }

    clear();
    router.push('/(customer)/cart' as never);
  };

  const renderItem = ({ item }: { item: RowItem }) => {
    const isChecked = selected[item.productId] ?? true;
    const stock = productsById.get(item.productId)?.stock;
    const isOut = typeof stock === 'number' ? stock <= 0 : false;

    return (
      <Pressable
        onPress={() => setSelected((s) => ({ ...s, [item.productId]: !(s[item.productId] ?? true) }))}
        className="mb-3"
      >
        <Card className={clsx('p-4 border', isChecked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white')}>
          <View className="flex-row items-start">
            <View className="mt-0.5">
              {isChecked ? <CheckCircle2 size={20} color="#22C55E" /> : <Circle size={20} color="#94A3B8" />}
            </View>
            <View className="flex-1 ml-3">
              <Text className={clsx('text-base font-outfit-bold', isOut ? 'text-slate-500' : 'text-slate-900')} numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs font-inter text-slate-500 mt-1">
                Số lượng: <Text className="font-inter-bold text-slate-700">{item.quantity}</Text>
                {item.unit ? ` • ${item.unit}` : ''}
              </Text>
              {typeof stock === 'number' ? (
                <Text className={clsx('text-xs font-inter mt-1', isOut ? 'text-red-600' : 'text-emerald-700')}>
                  {isOut ? 'Hết hàng' : `Còn ${stock}`}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Duyệt nguyên liệu',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
        }}
      />

      <View className="px-6 pt-4">
        <Text className="text-xs font-inter-bold text-slate-400 uppercase">Meal Planner</Text>
        <Text className="text-xl font-outfit-bold text-slate-900 mt-1">{title || 'Danh sách nguyên liệu'}</Text>
        <Text className="text-xs font-inter text-slate-500 mt-2">
          Chọn nguyên liệu cần mua. Những món hết hàng sẽ không được thêm vào giỏ.
        </Text>
      </View>

      <View className="flex-1 px-6 pt-4">
        <FlashList
          data={ingredientRows}
          renderItem={renderItem}
          keyExtractor={(i) => String(i.productId)}
          estimatedItemSize={92}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-24">
              <Text className="text-slate-500 font-inter">Chưa có dữ liệu thực đơn.</Text>
            </View>
          }
        />
        {hasError ? (
          <View className="pt-4 items-center">
            <Text className="text-slate-400 font-inter">Không tải được tồn kho. Bạn vẫn có thể thử áp dụng.</Text>
          </View>
        ) : null}
        {hasLoading ? (
          <View className="pt-3 items-center">
            <View className="flex-row items-center">
              <RefreshCw size={14} color="#94A3B8" />
              <Text className="text-xs font-inter text-slate-500 ml-2">Đang kiểm tra tồn kho…</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View className="p-6 bg-white border-t border-slate-100">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-inter text-slate-500">Đã chọn</Text>
          <Text className="text-sm font-inter-bold text-slate-900">{selectedCount}/{ingredientRows.length}</Text>
        </View>
        <Button
          label="Thêm vào giỏ"
          onPress={() => void handleApply()}
          icon={<ShoppingCart size={18} color="#fff" />}
          hapticVariant="success"
        />
      </View>
    </View>
  );
}
