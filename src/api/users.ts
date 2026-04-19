import apiClient from './client';
import { type UserAddress } from '../types/address';

export const userApi = {
  getUserAddresses: async (userId: number): Promise<UserAddress[]> => {
    const response = await apiClient.get(`/users/${userId}/addresses`);
    return (Array.isArray(response.data) ? response.data : []) as UserAddress[];
  },
};

