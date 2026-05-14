import apiClient from './client';
import { type UserDto } from '../store/authStore';

type RawAuthResponse = {
  token: string;
  refreshToken: string;
  user: unknown;
};

type AuthResponse = {
  token: string;
  refreshToken: string;
  user: UserDto;
};

const normalizeUser = (value: unknown): UserDto => {
  const v = value as Record<string, unknown>;
  const role = (v.role ?? v.roleName ?? v.role_code ?? v.roleCode) as unknown;
  const roleStr = typeof role === 'string' ? role : '';
  const roleUpper = roleStr.toUpperCase();
  const normalizedRole = roleUpper.includes('ADMIN')
    ? 'ADMIN'
    : roleUpper.includes('STAFF')
      ? 'STAFF'
      : roleUpper.includes('CUSTOMER')
        ? 'CUSTOMER'
        : 'CUSTOMER';

  return {
    id: Number(v.id ?? 0),
    email: String(v.email ?? ''),
    fullName: typeof v.fullName === 'string' ? v.fullName : null,
    phone: typeof v.phone === 'string' ? v.phone : null,
    avatarUrl: typeof v.avatarUrl === 'string' ? v.avatarUrl : null,
    role: normalizedRole,
  };
};

const normalizeAuthResponse = (value: unknown): AuthResponse => {
  const v = value as RawAuthResponse;
  return {
    token: String(v.token ?? ''),
    refreshToken: String(v.refreshToken ?? ''),
    user: normalizeUser(v.user),
  };
};

export const authApi = {
  normalizeAuthResponse,

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<RawAuthResponse>('/auth/login', {
      email,
      password,
    });
    return normalizeAuthResponse(response.data);
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<RawAuthResponse>('/auth/refresh', {
      refreshToken,
    });
    return normalizeAuthResponse(response.data);
  },

  getCurrentUser: async (): Promise<UserDto> => {
    const response = await apiClient.get<RawAuthResponse>('/auth/me');
    return normalizeUser(response.data);
  },

  updateProfile: async (updates: Record<string, string>): Promise<UserDto> => {
    const response = await apiClient.patch<RawAuthResponse>('/auth/profile', updates);
    return normalizeUser(response.data);
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  }
};
