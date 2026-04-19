import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1';

type ApiEnvelope<T> = {
  data: T;
  message?: string;
  status?: string | number;
  success?: boolean;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const unwrap = <T>(value: unknown): T => {
  if (value && typeof value === 'object' && 'data' in value) {
    return (value as ApiEnvelope<T>).data;
  }
  return value as T;
};

const extractMessage = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
    return (data as { message: string }).message;
  }
  if ('data' in data) return extractMessage((data as { data?: unknown }).data);
  return null;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const flushQueue = (err: unknown | null, token?: string) => {
  const queued = refreshQueue;
  refreshQueue = [];
  queued.forEach((p) => {
    if (err || !token) p.reject(err ?? new Error('Phiên đăng nhập hết hạn'));
    else p.resolve(token);
  });
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) throw new Error('Phiên đăng nhập hết hạn');

  const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  const tokens = unwrap<{ token: string; refreshToken: string }>(response.data);
  useAuthStore.getState().setTokens(tokens.token, tokens.refreshToken);
  return tokens.token;
};

apiClient.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      response.data = (payload as ApiEnvelope<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = (error.config ?? {}) as RetriableRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => resolve(apiClient({ ...originalRequest, headers: { ...originalRequest.headers, Authorization: `Bearer ${token}` } })),
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        flushQueue(null, newToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (e) {
        isRefreshing = false;
        flushQueue(e);
        useAuthStore.getState().logout();
        return Promise.reject(e);
      }
    }

    const message = extractMessage(error.response?.data) ?? 'Đã có lỗi xảy ra';
    const apiError = new Error(message) as Error & { status?: number };
    apiError.status = error.response?.status;
    return Promise.reject(apiError);
  }
);

export default apiClient;
