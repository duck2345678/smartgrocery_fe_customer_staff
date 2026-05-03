import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Card from '../../ui/Card';
import Skeleton from '../../ui/Skeleton';
import { aiApi } from '../../../api/ai';
import { Sparkles } from 'lucide-react-native';
import { useCart } from '../../../hooks/useCart';
import { productApi } from '../../../api/products';

export default function AiNudge() {
  const { items: cartItems, addProduct } = useCart();

  const nudgeQuery = useQuery({
    queryKey: ['home-ai-nudge'],
    queryFn: () => aiApi.getNudges(),
    staleTime: 2 * 60 * 1000,
  });

  const nudges = useMemo(() => {
    const picked = nudgeQuery.data ?? [];
    const cartProductIds = new Set(cartItems.map((i) => i.productId));
    return picked.filter((p) => !cartProductIds.has(p.productId)).slice(0, 2);
  }, [cartItems, nudgeQuery.data]);

  if (nudgeQuery.isLoading) {
    return (
      <View className="px-6 pb-4">
        <Skeleton className="h-20 w-full rounded-3xl" />
      </View>
    );
  }

  if (nudgeQuery.isError || nudges.length === 0) return null;

  const title =
    nudges.length >= 2
      ? `Có vẻ bạn sắp hết ${nudges[0].name.toLowerCase()} và ${nudges[1].name.toLowerCase()}.`
      : `Có vẻ bạn sắp hết ${nudges[0].name.toLowerCase()}.`;

  const handleAdd = async () => {
    for (const p of nudges) {
      const product = await productApi.getProductById(p.productId);
      await addProduct({ product, quantity: 1 });
    }
  };

  return (
    <View className="px-6 pb-4">
      <Card className="p-4 border border-emerald-200 bg-emerald-50">
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-2xl bg-white items-center justify-center border border-emerald-100">
            <Sparkles size={18} color="#22C55E" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-sm font-inter-bold text-slate-900">Trợ lý AI nhắc nhở</Text>
            <Text className="text-xs font-inter text-slate-600 mt-1">{title}</Text>
            <Text className="text-[11px] font-inter text-slate-500 mt-1">Gợi ý dựa trên chu kỳ mua hàng thực tế của bạn.</Text>
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row" style={{ gap: 8 }}>
            {nudges.map((p) => (
              <View key={p.productId} className="flex-1 min-w-0 px-3 py-2 rounded-2xl bg-white border border-slate-100">
                <Text className="text-xs font-inter-bold text-slate-700" numberOfLines={1}>
                  {p.name}
                </Text>
                <Text className="text-[11px] font-inter text-slate-500 mt-1" numberOfLines={1}>
                  {p.reason}
                </Text>
                <Text className="text-[11px] font-inter-bold text-emerald-700 mt-1">
                  {Math.round((p.confidenceScore ?? 0) * 100)}%
                </Text>
              </View>
            ))}
          </View>

          <Pressable onPress={() => void handleAdd()} className="mt-3 px-4 py-3 rounded-2xl bg-emerald-500 items-center" hitSlop={8}>
            <Text className="text-white font-inter-bold text-sm">Thêm ngay</Text>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}
