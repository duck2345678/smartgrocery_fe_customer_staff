import apiClient from './client';

export type Notification = {
  id: number;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const mapNotification = (x: any): Notification => {
  return {
    id: x.id,
    notificationType: x.notificationType || '',
    title: x.title || '',
    message: x.message || '',
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
