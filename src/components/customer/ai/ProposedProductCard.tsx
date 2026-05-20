import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Bot, ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { productApi } from '../../../api/products';
import { cartApi } from '../../../api/cart';
import { Product } from '../../../types/product';
import { ProposedItem } from '../../../types/ai';
import { formatCurrency } from '~/utils/format';
import { FlashSaleTimer } from '../FlashSaleTimer';
import { WishlistButton } from '../WishlistButton';

interface Props {
  item: ProposedItem;
  savingsText?: string;
}

export const ProposedProductCard = ({ item, savingsText }: Props) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      try {
        const p = await productApi.getProductById(item.productId);
        if (mounted) setProduct(p);
      } catch (err) {
        console.error('Failed to fetch proposed product details:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => { mounted = false; };
  }, [item.productId]);

  const handleAddToCart = async () => {
    if (!product || adding || added) return;
    
    setAdding(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await cartApi.addItem({ variantId: product.variantId || product.id, quantity: item.quantity || 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      console.error('Failed to add proposed item to cart:', err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View className="w-48 h-64 bg-surface border border-border rounded-3xl items-center justify-center mr-3">
        <ActivityIndicator size="small" color="#22C55E" />
      </View>
    );
  }

  if (!product) return null;

  return (
    <View className="w-48 bg-white border border-border rounded-3xl overflow-hidden mr-3 shadow-sm">
      <Image
        source={{ uri: product.imageUrl }}
        className="w-full h-28 bg-slate-50"
        contentFit="cover"
      />
      <View className="absolute top-2 right-2">
        <WishlistButton productId={product.id} size={14} />
      </View>

      {savingsText ? (
        <View className="absolute top-2 left-2 bg-amber-400 px-2 py-0.5 rounded-full shadow-sm">
           <Text className="text-[9px] font-outfit-bold text-white">DEAL: {savingsText}</Text>
        </View>
      ) : null}
      
      <View className="p-3">
        {product.flashSaleEndsAt && (
          <View className="mb-2">
            <FlashSaleTimer endTime={product.flashSaleEndsAt} compact />
          </View>
        )}
        <Text className="text-sm font-outfit-bold text-text mb-1" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-xs font-inter text-primary font-bold mb-2">
          {formatCurrency(product.price)}
        </Text>

        {item.reason ? (
          <View className="flex-row items-start mb-2" style={{ gap: 4 }}>
            <View className="mt-0.5">
               <Bot size={10} color="#22C55E" />
            </View>
            <Text className="text-[10px] font-inter text-slate-500 flex-1 leading-3" numberOfLines={2}>
              {item.reason}
            </Text>
          </View>
        ) : null}

        {item.allergyWarning ? (
          <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-lg mb-2" style={{ gap: 4 }}>
            <AlertCircle size={10} color="#EF4444" />
            <Text className="text-[9px] font-inter-bold text-red-600 flex-1" numberOfLines={1}>
              {item.allergyWarning}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleAddToCart}
          disabled={adding || added}
          className={`flex-row items-center justify-center py-2 rounded-xl ${
            added ? 'bg-emerald-500' : 'bg-primary'
          }`}
          style={{ opacity: adding ? 0.7 : 1 }}
        >
          {adding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : added ? (
            <CheckCircle2 size={14} color="#fff" />
          ) : (
            <ShoppingCart size={14} color="#fff" />
          )}
          <Text className="text-white text-xs font-outfit-bold ml-2">
            {added ? 'Đã thêm' : 'Thêm vào giỏ'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};


