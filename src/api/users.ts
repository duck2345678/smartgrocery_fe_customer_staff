import apiClient from './client';
import { type UserAddress } from '../types/address';
import { type UserDto } from '../store/authStore';

export const userApi = {
  getUserAddresses: async (userId: number): Promise<UserAddress[]> => {
    const response = await apiClient.get(`/users/${userId}/addresses`);
    return (Array.isArray(response.data) ? response.data : []) as UserAddress[];
  },

  updateProfile: async (userId: number, data: Partial<UserDto>): Promise<UserDto> => {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data as UserDto;
  },

  addAddress: async (userId: number, data: Partial<UserAddress>): Promise<UserAddress> => {
    const response = await apiClient.post(`/users/${userId}/addresses`, data);
    return response.data as UserAddress;
  },

  updateAddress: async (userId: number, addressId: number, data: Partial<UserAddress>): Promise<UserAddress> => {
    const response = await apiClient.put(`/users/${userId}/addresses/${addressId}`, data);
    return response.data as UserAddress;
  },

  deleteAddress: async (userId: number, addressId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/addresses/${addressId}`);
  },

  setDefaultAddress: async (userId: number, addressId: number): Promise<void> => {
    await apiClient.patch(`/users/${userId}/addresses/${addressId}/default`);
  },
};

