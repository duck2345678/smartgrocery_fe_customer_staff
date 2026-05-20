import React, { useState, useEffect } from 'react';
import { Pressable, ActivityIndicator } from 'react-native';
import { Heart } from 'lucide-react-native';
import { wishlistApi } from '../../api/wishlist';
import * as Haptics from 'expo-haptics';

interface Props {
  productId: number;
  size?: number;
  initialState?: boolean;
}

export const WishlistButton = ({ productId, size = 20, initialState = false }: Props) => {
  const [isFavorite, setIsFavorite] = useState(initialState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const status = await wishlistApi.checkIsInWishlist(productId);
        if (mounted) setIsFavorite(status);
      } catch (error) {
        console.error('Wishlist check error:', error);
      }
    };
    checkStatus();
    return () => { mounted = false; };
  }, [productId]);

  const toggleFavorite = async () => {
    if (loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      if (isFavorite) {
        await wishlistApi.removeFromWishlist(productId);
        setIsFavorite(false);
      } else {
        await wishlistApi.addToWishlist(productId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable 
      onPress={toggleFavorite}
      disabled={loading}
      className="w-8 h-8 rounded-full bg-white/90 items-center justify-center shadow-sm"
    >
      {loading ? (
        <ActivityIndicator size="small" color="#EF4444" />
      ) : (
        <Heart 
          size={size} 
          color={isFavorite ? "#EF4444" : "#94A3B8"} 
          fill={isFavorite ? "#EF4444" : "transparent"} 
        />
      )}
    </Pressable>
  );
};
