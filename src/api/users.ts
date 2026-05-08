import apiClient from './client';
import { type UserAddress } from '../types/address';
import { type UserDto } from '../store/authStore';

const unwrapResponse = <T>(value: unknown): T => {
  if (!value || typeof value !== 'object') return value as T;
  if ('data' in value) {
    const data = (value as { data?: unknown }).data;
    return (Array.isArray(data) || data !== undefined ? data : value) as T;
  }
  return value as T;
};

export type FullUserProfile = UserDto & {
  phone?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

export type UpdateUserRequest = {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
};

export type CreateAddressRequest = {
  addressType: string;
  receiverName: string;
  receiverPhone: string;
  streetAddress: string;
  ward: string;
  district: string;
  city: string;
  isDefault?: boolean;
};

export type UpdateAddressRequest = Partial<CreateAddressRequest>;

export const userApi = {
  getUserProfile: async (userId: number): Promise<FullUserProfile> => {
    const response = await apiClient.get(`/users/${userId}`);
    return unwrapResponse<FullUserProfile>(response.data);
  },

  updateUserProfile: async (userId: number, data: UpdateUserRequest): Promise<FullUserProfile> => {
    const response = await apiClient.put(`/users/${userId}`, data);
    return unwrapResponse<FullUserProfile>(response.data);
  },

  getUserAddresses: async (userId: number): Promise<UserAddress[]> => {
    const response = await apiClient.get(`/users/${userId}/addresses`);
    return unwrapResponse<UserAddress[]>(response.data) ?? [];
  },

  createAddress: async (userId: number, data: CreateAddressRequest): Promise<UserAddress> => {
    const response = await apiClient.post(`/users/${userId}/addresses`, data);
    return unwrapResponse<UserAddress>(response.data);
  },

  updateAddress: async (userId: number, addressId: number, data: UpdateAddressRequest): Promise<UserAddress> => {
    const response = await apiClient.put(`/users/${userId}/addresses/${addressId}`, data);
    return unwrapResponse<UserAddress>(response.data);
  },

  deleteAddress: async (userId: number, addressId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/addresses/${addressId}`);
  },
};

