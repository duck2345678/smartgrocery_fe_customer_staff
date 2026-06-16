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

export type RegistrationPendingResponse = {
  email: string;
  requiresEmailVerification: boolean;
  expiresInSeconds: number;
  message: string;
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
    const response = await apiClient.post<RawAuthResponse>('/auth/login', { email, password });
    return normalizeAuthResponse(response.data);
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<RawAuthResponse>('/auth/refresh', { refreshToken });
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
  },

  // Register → returns pending verification (không cấp JWT ngay)
  register: async (fullName: string, email: string, phone: string, password: string): Promise<RegistrationPendingResponse> => {
    const response = await apiClient.post<RegistrationPendingResponse>('/auth/register', {
      fullName,
      email,
      phone,
      password,
    });
    return response.data;
  },

  // Xác nhận OTP sau đăng ký → cấp JWT
  verifyEmail: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await apiClient.post<RawAuthResponse>('/auth/verify-email', { email, otp });
    return normalizeAuthResponse(response.data);
  },

  // Gửi lại mã OTP xác nhận email
  resendEmailVerification: async (email: string): Promise<void> => {
    await apiClient.post('/auth/resend-email-verification', { email });
  },

  // Quên mật khẩu: gửi OTP reset về email
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  // Đặt lại mật khẩu bằng OTP
  resetPassword: async (email: string, otp: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { email, otp, newPassword });
  },
};
