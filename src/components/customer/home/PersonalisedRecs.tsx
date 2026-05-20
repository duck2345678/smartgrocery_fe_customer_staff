import { ScrollView, Text, Pressable, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Sparkles } from 'lucide-react-native';
import { aiApi } from '../../../api/ai';
import { useAuthStore } from '../../../store/authStore';

export default function PersonalisedRecs() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.id;

  const recsQuery = useQuery({
    queryKey: ['personalised-recs', userId],
    queryFn: () => aiApi.getPersonalisedRecs(userId!),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
  });

  if (recsQuery.isLoading) {
    return (
      <View className="px-6 pb-4">
        <View className="h-8 mb-3 flex-row items-center" style={{ gap: 6 }}>
          <Sparkles size={14} color="#22C55E" />
          <View className="h-4 w-32 bg-slate-100 rounded-full" />
        </View>
        <View className="flex-row" style={{ gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} className="w-32 h-44 bg-slate-100 rounded-3xl" />
          ))}
        </View>
      </View>
    );
  }

  const recs = recsQuery.data ?? [];
  if (recsQuery.isError || recs.length === 0) return null;

  return (
    <View className="pb-4">
      <View className="px-6 mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Sparkles size={14} color="#22C55E" />
          <Text className="text-sm font-outfit-bold text-text">Gợi ý cho bạn</Text>
        </View>
        <Text className="text-xs font-inter text-muted">Dựa trên lịch sử mua hàng</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
      >
        {recs.slice(0, 8).map((rec) => (
          <Pressable
            key={rec.id}
            onPress={() => router.push(`/(customer)/products/${rec.productId}` as never)}
            className="w-32 rounded-3xl border border-border bg-white overflow-hidden"
          >
            <View className="w-full h-24 bg-surface2">
              {rec.productImage ? (
                <Image
                  source={{ uri: rec.productImage }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={200}
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Sparkles size={20} color="#CBD5E1" />
                </View>
              )}
            </View>
            <View className="p-2.5">
              <Text className="text-xs font-inter-bold text-text" numberOfLines={2} style={{ lineHeight: 16 }}>
                {rec.productName}
              </Text>
              {rec.price > 0 ? (
                <Text className="text-xs font-outfit-bold text-primary mt-1">
                  {rec.price.toLocaleString('vi-VN')}₫
                </Text>
              ) : null}
              {rec.reasonText ? (
                <Text className="text-[10px] font-inter text-muted mt-1" numberOfLines={2}>
                  {rec.reasonText}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
