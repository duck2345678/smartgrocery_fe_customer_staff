import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../src/api/products';
import CartButton from '../../../src/components/customer/CartButton';
import Button from '../../../src/components/ui/Button';
import { useCart } from '../../../src/hooks/useCart';

export default function ProductDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addProduct } = useCart();
  const [adding, setAdding] = useState(false);

  const productId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    const parsed = parseInt(String(raw ?? ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [params.id]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getProductById(productId),
    enabled: productId > 0,
  });

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chi tiết',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTitleStyle: { fontFamily: 'Outfit-Bold', fontSize: 18 },
          headerRight: () => <CartButton />,
        }}
      />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-500 font-inter">Đang tải...</Text>
        </View>
      ) : isError || !data ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-slate-500 font-inter text-center">Không tìm thấy sản phẩm.</Text>
          <Pressable onPress={() => router.back()} className="mt-6 px-4 py-3 bg-slate-100 rounded-xl">
            <Text className="text-slate-900 font-inter-bold">Quay lại</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView className="flex-1">
          <View className="w-full h-72 bg-slate-100">
            <Image
              source={{ uri: data.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
            />
          </View>

          <View className="p-6">
            <Text className="text-xs font-inter-bold text-slate-400 uppercase">{data.category}</Text>
            <Text className="text-2xl font-outfit-bold text-slate-900 mt-2">{data.name}</Text>

            <View className="flex-row items-end justify-between mt-4">
              <Text className="text-2xl font-outfit-bold text-slate-900">
                {data.price.toLocaleString('vi-VN')}₫
                <Text className="text-sm font-inter text-slate-500"> / {data.unit}</Text>
              </Text>
              <Text className="text-sm font-inter-bold text-slate-600">
                {data.stock > 0 ? `Còn ${data.stock}` : 'Hết hàng'}
              </Text>
            </View>

            {data.description ? (
              <View className="mt-6">
                <Text className="text-sm font-inter-bold text-slate-800 mb-2">Mô tả</Text>
                <Text className="text-slate-600 font-inter leading-6">{data.description}</Text>
              </View>
            ) : null}
          </View>
          </ScrollView>

          <View className="p-6 bg-white border-t border-slate-100">
            <Button
              label={data.stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
              onPress={async () => {
                if (adding || data.stock <= 0) return;
                setAdding(true);
                try {
                  await addProduct({ product: data, quantity: 1 });
                } finally {
                  setAdding(false);
                }
              }}
              loading={adding}
              disabled={data.stock <= 0}
              hapticVariant="success"
            />
          </View>
        </View>
      )}
    </View>
  );
}
