import apiClient from './client';
import { Product } from '../types/product';

import { mapProductDto, ProductDto } from '../utils/mappers';

export const wishlistApi = {
  getWishlist: async (): Promise<Product[]> => {
    const response = await apiClient.get('/wishlist');
    const dtos = response.data as ProductDto[];
    return dtos.map(mapProductDto);
  },
  addToWishlist: async (productId: number): Promise<void> => {
    await apiClient.post(`/wishlist/${productId}`);
  },
  removeFromWishlist: async (productId: number): Promise<void> => {
    await apiClient.delete(`/wishlist/${productId}`);
  },
  checkIsInWishlist: async (productId: number): Promise<boolean> => {
    const response = await apiClient.get(`/wishlist/check/${productId}`);
    return response.data;
  }
};
