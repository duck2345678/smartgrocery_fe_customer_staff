import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, ChevronLeft, ShoppingBag } from 'lucide-react-native';
import { wishlistApi } from '../../src/api/wishlist';
import { type Product } from '../../src/types/product';
import { Image } from 'expo-image';

export default function WishlistScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistApi.getWishlist();
      setItems(data);
    } catch (error) {
      console.error('Fetch wishlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWishlist();
    }, [])
  );

  const renderItem = ({ item }: { item: Product }) => (
    <Pressable
      onPress={() => router.push(`/(customer)/products/${item.id}` as never)}
      className="flex-row items-center p-4 mb-3 bg-white border border-slate-100 rounded-[24px] shadow-sm"
    >
      <View className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
        <Image source={{ uri: item.imageUrl }} className="w-full h-full" contentFit="cover" />
      </View>
      <View className="flex-1 ml-4 justify-center">
        <Text className="text-xs font-inter-bold text-primary uppercase">{item.category}</Text>
        <Text className="text-base font-outfit-bold text-slate-900 mt-1" numberOfLines={1}>{item.name}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-sm font-outfit-bold text-slate-900">{item.price.toLocaleString('vi-VN')}₫</Text>
          {item.originalPrice && (
            <Text className="text-[10px] font-inter text-slate-400 line-through ml-2">
              {item.originalPrice.toLocaleString('vi-VN')}₫
            </Text>
          )}
        </View>
      </View>
      <Pressable 
        onPress={async () => {
            await wishlistApi.removeFromWishlist(item.id);
            fetchWishlist();
        }}
        className="w-10 h-10 items-center justify-center bg-red-50 rounded-full"
      >
        <Heart size={20} color="#EF4444" fill="#EF4444" />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 py-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-white rounded-full shadow-sm">
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-outfit-bold text-slate-900">Yêu thích</Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-6">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#16A34A" />
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-4">
              <Heart size={40} color="#CBD5E1" />
            </View>
            <Text className="text-lg font-outfit-bold text-slate-900">Wishlist trống</Text>
            <Text className="text-sm font-inter text-slate-500 text-center mt-2 px-10">
              Hãy thêm những sản phẩm bạn yêu thích để nhận thông báo khi có Flash Sale nhé!
            </Text>
            <Pressable 
              onPress={() => router.push('/(customer)/(tabs)/shop' as never)}
              className="mt-8 px-8 py-4 bg-primary rounded-2xl flex-row items-center"
            >
              <ShoppingBag size={20} color="#FFF" />
              <Text className="text-white font-inter-bold ml-2">Đi mua sắm ngay</Text>
            </Pressable>
          </View>
        ) : (
          <FlashList
            data={items}
            renderItem={renderItem}
            estimatedItemSize={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
