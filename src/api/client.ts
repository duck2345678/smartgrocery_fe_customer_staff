import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080/api/v1';

type ApiEnvelope<T> = {
  data: T;
  message?: string;
  status?: string | number;
  success?: boolean;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _meta?: { startAt: number };
};

const unwrap = <T>(value: unknown): T => {
  if (value && typeof value === 'object' && 'data' in value) {
    return (value as ApiEnvelope<T>).data;
  }
  return value as T;
};

const extractMessage = (data: unknown): string | null => {
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (!data || typeof data !== 'object') return null;
  if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
    return (data as { message: string }).message;
  }
  if ('data' in data) return extractMessage((data as { data?: unknown }).data);
  return null;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
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

const setAuthInvalidationNotice = (message: string) => {
  useAuthStore.getState().setAuthNotice(message);
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) throw new Error('Phiên đăng nhập hết hạn');

  const deviceFingerprint = await getDeviceFingerprint();
  const response = await axios.post(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'X-Device-Fingerprint': deviceFingerprint } },
  );
  const tokens = unwrap<{ token: string; refreshToken: string }>(response.data);
  useAuthStore.getState().setTokens(tokens.token, tokens.refreshToken);
  return tokens.token;
};

apiClient.interceptors.request.use(async (config) => {
  const startAt =
    typeof globalThis !== 'undefined' &&
    'performance' in globalThis &&
    typeof (globalThis as { performance?: { now?: () => number } }).performance?.now === 'function'
      ? (globalThis as { performance: { now: () => number } }).performance.now()
      : Date.now();
  (config as RetriableRequestConfig)._meta = { startAt };

  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  const deviceFingerprint = await getDeviceFingerprint();
  config.headers = config.headers ?? {};
  config.headers['X-Device-Fingerprint'] = deviceFingerprint;
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const cfg = response.config as RetriableRequestConfig;
    if (typeof __DEV__ !== 'undefined' && __DEV__ && cfg._meta?.startAt != null) {
      const endAt =
        typeof globalThis !== 'undefined' &&
        'performance' in globalThis &&
        typeof (globalThis as { performance?: { now?: () => number } }).performance?.now === 'function'
          ? (globalThis as { performance: { now: () => number } }).performance.now()
          : Date.now();
      const ms = Math.round(endAt - cfg._meta.startAt);
      const method = String(cfg.method ?? 'GET').toUpperCase();
      const url = cfg.url ?? '';
      console.log(`[NET OK] ${method} ${url} ${ms}ms`);
    }

    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      response.data = (payload as ApiEnvelope<unknown>).data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = (error.config ?? {}) as RetriableRequestConfig;
    if (typeof __DEV__ !== 'undefined' && __DEV__ && originalRequest._meta?.startAt != null) {
      const endAt =
        typeof globalThis !== 'undefined' &&
        'performance' in globalThis &&
        typeof (globalThis as { performance?: { now?: () => number } }).performance?.now === 'function'
          ? (globalThis as { performance: { now: () => number } }).performance.now()
          : Date.now();
      const ms = Math.round(endAt - originalRequest._meta.startAt);
      const method = String(originalRequest.method ?? 'GET').toUpperCase();
      const url = originalRequest.url ?? '';
      const st = error.response?.status ?? 0;
      console.log(`[NET ERR] ${method} ${url} ${st} ${ms}ms`);
    }

    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Kết nối đến máy chủ bị quá thời gian. Vui lòng kiểm tra IP/Port hoặc mạng.'
          : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra IP/Port hoặc mạng.';
      const apiError = new Error(message) as Error & { status?: number };
      apiError.status = 0;
      return Promise.reject(apiError);
    }

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
        setAuthInvalidationNotice(e instanceof Error ? e.message : 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.');
        useAuthStore.getState().logout();
        return Promise.reject(e);
      }
    }

    const status = error.response?.status;
    const reqInfo = originalRequest?.url ? ` (${String(originalRequest.method ?? 'GET').toUpperCase()} ${originalRequest.url})` : '';
    let message =
      extractMessage(error.response?.data) ??
      (typeof status === 'number' && status >= 500
        ? `Máy chủ đang gặp lỗi. Vui lòng thử lại sau.${reqInfo}`
        : 'Đã có lỗi xảy ra');

    if (status === 403) {
      message = 'Bạn không có quyền thực hiện thao tác này';
    } else if (status === 401) {
      message = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
    }

    if (status === 401 && /thiết bị|đăng nhập ở thiết bị khác|phiên đăng nhập/i.test(message)) {
      setAuthInvalidationNotice(message);
      useAuthStore.getState().logout();
    }

    const apiError = new Error(message) as Error & { status?: number };
    apiError.status = status;
    return Promise.reject(apiError);
  }
);

export default apiClient;
