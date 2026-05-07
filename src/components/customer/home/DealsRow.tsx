import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../api/products';
import Skeleton from '../../ui/Skeleton';
import { pickTopDiscounted } from '../../../utils/homeUtils';
import { useRouter } from 'expo-router';

export default function DealsRow() {
  const router = useRouter();
  const productsQuery = useQuery({
    queryKey: ['home-deals'],
    queryFn: () => productApi.getProducts({ page: 0, size: 50 }),
    staleTime: 2 * 60 * 1000,
  });

  const deals = useMemo(() => {
    return pickTopDiscounted(productsQuery.data ?? [], 10);
  }, [productsQuery.data]);

  return (
    <View className="pb-4">
      <View className="px-6 flex-row items-center justify-between mb-3">
        <Text className="text-base font-outfit-bold text-slate-900">Giảm giá hot</Text>
        <Pressable onPress={() => router.push('/(customer)/shop' as never)} hitSlop={8}>
          <Text className="text-sm font-inter-bold text-primary">Xem thêm</Text>
        </Pressable>
      </View>

      {productsQuery.isLoading ? (
        <View className="px-6 flex-row" style={{ gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-40 rounded-2xl" />
          ))}
        </View>
      ) : productsQuery.isError ? (
        <View className="px-6">
          <View className="bg-white border border-slate-100 rounded-2xl p-4">
            <Text className="text-sm font-inter text-slate-600">Không tải được sản phẩm giảm giá.</Text>
          </View>
        </View>
      ) : deals.length === 0 ? (
        <View className="px-6">
          <View className="bg-white border border-slate-100 rounded-2xl p-4">
            <Text className="text-sm font-inter text-slate-600">Hiện chưa có sản phẩm giảm giá.</Text>
          </View>
        </View>
      ) : (
        <View style={{ height: 280 }}>
          <FlashList
            data={deals}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            estimatedItemSize={170}
            keyExtractor={(i) => String(i.id)}
            renderItem={({ item }) => {
              const stockRatio = Math.min(item.stock / 50, 1);
              return (
                <Pressable
                  onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
                  style={{ width: 160, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', overflow: 'hidden' }}
                >
                  <View style={{ width: '100%', height: 120, backgroundColor: '#F8FAFC' }}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      cachePolicy="disk"
                      transition={200}
                    />
                    <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderBottomLeftRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'Inter-Bold' }}>-{item.discountPercent}%</Text>
                    </View>
                  </View>
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Outfit-Bold', color: '#0F172A' }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter-Regular', color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                      {item.category}
                    </Text>
                    
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontFamily: 'Outfit-Bold', color: '#0F172A' }}>{item.price.toLocaleString('vi-VN')}₫</Text>
                      {typeof item.originalPrice === 'number' ? (
                        <Text style={{ fontSize: 10, fontFamily: 'Inter-Regular', color: '#94A3B8', textDecorationLine: 'line-through', marginLeft: 6 }}>
                          {item.originalPrice.toLocaleString('vi-VN')}₫
                        </Text>
                      ) : null}
                    </View>

                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter-Medium', color: '#334155' }}>Còn {item.stock}</Text>
                      <View style={{ width: '100%', height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 4 }}>
                        <View style={{ width: `${stockRatio * 100}%`, height: '100%', backgroundColor: '#16A34A', borderRadius: 2 }} />
                      </View>
                    </View>

                    <View style={{ marginTop: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#16A34A', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontFamily: 'Inter-Bold', color: '#16A34A' }}>Xem</Text>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      )}
    </View>
  );
}

