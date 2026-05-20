import { useMemo } from 'react';
import { Pressable, Text, View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import Card from '../../ui/Card';
import Skeleton from '../../ui/Skeleton';
import { aiApi } from '../../../api/ai';
import { Bot } from 'lucide-react-native';
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
    return picked.filter((p) => !cartProductIds.has(p.productId)).slice(0, 4);
  }, [cartItems, nudgeQuery.data]);

  if (nudgeQuery.isLoading) {
    return (
      <View className="px-6 pb-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
      </View>
    );
  }

  if (nudgeQuery.isError || nudges.length === 0) return null;

  const handleAdd = async (productId: number) => {
    try {
      const product = await productApi.getProductById(productId);
      await addProduct({ product, quantity: 1 });
    } catch (e) {
      console.error('Failed to add product from AI Nudge', e);
    }
  };

  return (
    <View className="px-6 pb-4">
      <Card style={{ padding: 16, borderColor: '#86EFAC', borderWidth: 1, backgroundColor: '#F0FDF4', borderRadius: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Bot size={18} color="#16A34A" />
          <Text style={{ marginLeft: 6, fontSize: 15, fontFamily: 'Outfit-Bold', color: '#16A34A' }}>AI Assistant</Text>
        </View>
        <Text style={{ marginTop: 4, fontSize: 13, fontFamily: 'Inter-Medium', color: '#1E293B' }}>
          Sản phẩm yêu thích của bạn đang giảm giá! 🔥
        </Text>

        <View style={{ marginTop: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {nudges.map((p) => (
              <View 
                key={p.productId} 
                style={{ 
                  width: 240, 
                  flexDirection: 'row', 
                  backgroundColor: '#FFFFFF', 
                  borderRadius: 16, 
                  padding: 8, 
                  borderWidth: 1, 
                  borderColor: '#E2E8F0',
                  alignItems: 'center'
                }}
              >
                {/* Product Image */}
                <View style={{ width: 60, height: 60, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="disk" />
                  ) : null}
                </View>
                
                {/* Details */}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: '#0F172A' }} numberOfLines={2}>
                    {p.name} - {p.reason}
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Outfit-Bold', color: '#0F172A', marginTop: 4 }}>
                    {p.price ? p.price.toLocaleString('vi-VN') : '0'}₫
                  </Text>
                  <Pressable 
                    onPress={() => void handleAdd(p.productId)} 
                    style={{ 
                      marginTop: 6, 
                      paddingVertical: 6, 
                      paddingHorizontal: 12, 
                      borderRadius: 20, 
                      borderWidth: 1, 
                      borderColor: '#16A34A', 
                      alignSelf: 'flex-start' 
                    }}
                    hitSlop={6}
                  >
                    <Text style={{ fontSize: 11, fontFamily: 'Inter-Bold', color: '#16A34A' }}>Thêm nhanh</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Card>
    </View>
  );
}
