import { useMemo, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../../src/api/products';
import CartButton from '../../../src/components/customer/CartButton';
import Button from '../../../src/components/ui/Button';
import { useCart } from '../../../src/hooks/useCart';
import { Minus, Plus, X } from 'lucide-react-native';

export default function ProductDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { addProduct, items } = useCart();
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const productId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    const parsed = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.id]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getProductById(productId),
    enabled: productId > 0,
    staleTime: 0, // Always treat as stale to force refresh on mount
    gcTime: 0,    // Don't keep in garbage collection to ensure fresh start
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Calculate remaining stock based on items already in cart
  const quantityInCart = useMemo(() => {
    const item = items.find(it => it.productId === productId);
    return item?.quantity || 0;
  }, [items, productId]);

  const remainingStock = useMemo(() => {
    if (!data) return 0;
    return Math.max(0, data.stock - quantityInCart);
  }, [data, quantityInCart]);

  const handleAdd = async () => {
    if (!data || adding) return;
    
    setAdding(true);
    try {
      // 1. Double check stock with server before adding
      const freshData = await refetch();
      const currentStock = freshData.data?.stock ?? 0;
      const currentRemaining = Math.max(0, currentStock - quantityInCart);

      if (currentRemaining <= 0) {
        Alert.alert('Hết hàng', 'Sản phẩm này hiện đã hết hàng trong kho hoặc bạn đã thêm đủ số lượng cho phép.');
        return;
      }

      if (quantity > currentRemaining) {
        Alert.alert('Số lượng không đủ', `Rất tiếc, hiện tại chỉ còn ${currentRemaining} sản phẩm có thể thêm.`);
        setQuantity(currentRemaining);
        return;
      }

      // 2. Add to cart if stock is confirmed
      await addProduct({ product: data, quantity });
      setQuantity(1); 
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng.');
    } catch (e) {
        Alert.alert('Lỗi', 'Không thể kiểm tra kho hàng. Vui lòng thử lại sau.');
    } finally {
      setAdding(false);
    }
  };

  const isAtMax = quantity >= remainingStock;
  const isAtMin = quantity <= 1;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chi tiết sản phẩm',
          headerStyle: { backgroundColor: '#FBFBFC' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
          headerRight: () => <CartButton />,
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted font-inter">Đang tải...</Text>
        </View>
      ) : isError || !data ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-muted font-inter text-center">Không tìm thấy sản phẩm.</Text>
          <Pressable onPress={() => router.back()} className="mt-6 px-6 py-3 bg-white border border-slate-200 rounded-2xl">
            <Text className="text-slate-900 font-inter-bold">Quay lại</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} tintColor="#16A34A" />
            }
          >
            <View className="w-full h-80 bg-slate-50 relative">
              <Pressable 
                onPress={() => setIsImageModalOpen(true)}
                className="w-full h-full"
                style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              >
                <Image
                  source={{ uri: data.imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  cachePolicy="disk"
                  transition={300}
                />
              </Pressable>
              {data.stock <= 0 && (
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                  <View className="bg-white px-6 py-3 rounded-full">
                    <Text className="text-slate-900 font-outfit-bold">TẠM HẾT HÀNG</Text>
                  </View>
                </View>
              )}
            </View>

            <View className="p-6 bg-white rounded-t-[40px] -mt-10">
              <View className="flex-row items-center justify-between">
                <View className="bg-primary/10 px-3 py-1 rounded-lg">
                  <Text className="text-[10px] font-inter-bold text-primary uppercase">{data.category}</Text>
                </View>
                <View className="flex-row items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  <Text className="text-[11px] font-inter-bold text-slate-500">KHO: {data.stock}</Text>
                </View>
              </View>

              <Text className="text-2xl font-outfit-bold text-slate-900 mt-4">{data.name}</Text>
              
              <View className="flex-row items-baseline mt-2">
                <Text className="text-3xl font-outfit-bold text-primary">
                  {data.price.toLocaleString('vi-VN')}₫
                </Text>
                {data.originalPrice && (
                  <Text className="text-sm font-inter text-slate-400 line-through ml-2">
                    {data.originalPrice.toLocaleString('vi-VN')}₫
                  </Text>
                )}
                <Text className="text-sm font-inter text-slate-400 ml-1">/ {data.unit}</Text>
                
                {data.discountPercent && (
                  <View className="ml-3 bg-red-100 px-2 py-0.5 rounded-lg border border-red-200">
                    <Text className="text-[10px] font-outfit-bold text-red-600">-{data.discountPercent}%</Text>
                  </View>
                )}
              </View>

              {quantityInCart > 0 && (
                <View className="mt-4 bg-orange-50 p-3 rounded-xl border border-orange-100">
                   <Text className="text-[11px] font-inter-bold text-orange-600">
                     Bạn đã có {quantityInCart} sản phẩm này trong giỏ hàng.
                   </Text>
                </View>
              )}

              <View className="mt-8">
                <Text className="text-base font-outfit-bold text-slate-900 mb-3">Số lượng mua thêm</Text>
                <View className="flex-row items-center bg-slate-50 w-40 rounded-2xl p-1 border border-slate-100">
                  <Pressable
                    onPress={() => !isAtMin && setQuantity(q => q - 1)}
                    className="w-10 h-10 items-center justify-center rounded-xl"
                    style={[
                        { backgroundColor: isAtMin ? 'transparent' : '#FFF' },
                        isAtMin ? { opacity: 0.3 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }
                    ]}
                    disabled={isAtMin}
                  >
                    <Minus size={20} color="#0F172A" />
                  </Pressable>
                  <View className="flex-1 items-center">
                    <Text className="text-lg font-outfit-bold text-slate-900">{remainingStock > 0 ? quantity : 0}</Text>
                  </View>
                  <Pressable
                    onPress={() => !isAtMax && setQuantity(q => q + 1)}
                    className="w-10 h-10 items-center justify-center rounded-xl"
                    style={[
                        { backgroundColor: isAtMax ? 'transparent' : '#FFF' },
                        isAtMax ? { opacity: 0.3 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }
                    ]}
                    disabled={isAtMax}
                  >
                    <Plus size={20} color="#0F172A" />
                  </Pressable>
                </View>
                {isAtMax && remainingStock > 0 && <Text className="text-[10px] text-orange-500 font-inter-bold mt-2">Đã đạt giới hạn tồn kho</Text>}
                {remainingStock <= 0 && <Text className="text-[10px] text-red-500 font-inter-bold mt-2">Sản phẩm hiện đã hết hàng hoặc đã đủ trong giỏ</Text>}
              </View>

              {data.description ? (
                <View className="mt-8">
                  <Text className="text-base font-outfit-bold text-slate-900 mb-2">Thông tin sản phẩm</Text>
                  <View className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <Text className="text-slate-600 font-inter leading-6">{data.description}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View className="p-6 bg-white border-t border-slate-50">
            <View className="flex-row items-center gap-x-4">
               <View className="flex-1">
                  <Text className="text-xs font-inter text-slate-400">Tổng cộng</Text>
                  <Text className="text-xl font-outfit-bold text-slate-900">
                    {(data.price * (remainingStock > 0 ? quantity : 0)).toLocaleString('vi-VN')}₫
                  </Text>
               </View>
               <View className="flex-[1.5]">
                <Button
                  label={remainingStock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                  onPress={handleAdd}
                  loading={adding}
                  disabled={remainingStock <= 0}
                  hapticVariant="success"
                  className="h-14 rounded-2xl"
                />
               </View>
            </View>
          </View>
        </View>
      )}

      {/* Full Screen Image Viewer Modal */}
      <Modal
        visible={isImageModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalOpen(false)}
      >
        <Pressable 
          className="flex-1 bg-black/90 items-center justify-center p-4"
          onPress={() => setIsImageModalOpen(false)}
        >
          <View className="absolute top-12 right-6 z-10">
            <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center">
              <X size={24} color="#FFF" />
            </View>
          </View>
          
          <Image
            source={{ uri: data?.imageUrl }}
            style={{ width: '100%', height: '80%' }}
            contentFit="contain"
            transition={300}
          />
          
          <View className="absolute bottom-12 items-center">
            <Text className="text-white/60 font-inter text-xs">Nhấn vào vùng trống để đóng</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
