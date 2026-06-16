import apiClient from './client';

export type Notification = {
  id: number;
  notificationType: string;
  title: string;
  message: string;
  orderId?: number | null;
  route?: string | null;
  isRead: boolean;
  createdAt: string;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapNotification = (x: any): Notification => {
  return {
    id: x.id,
    notificationType: x.notificationType || '',
    title: x.title || '',
    message: x.message || '',
    orderId: toNumber(x.orderId),
    route: typeof x.route === 'string' ? x.route : null,
    isRead: !!x.isRead,
    createdAt: x.createdAt || '',
  };
};

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get('/notifications');
    // Response interceptor already unwrapped the ApiResponse envelope, so res.data is the notification array
    const payload = res.data;
    const data = Array.isArray(payload) ? payload : [];
    return data.map(mapNotification);
  },
  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },
  registerFcmToken: async (token: string): Promise<void> => {
    await apiClient.put('/auth/fcm-token', { fcmToken: token });
  }
};
