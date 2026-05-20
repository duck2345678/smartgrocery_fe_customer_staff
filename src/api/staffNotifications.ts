import apiClient from './client';

export type StaffNotification = {
  id: number;
  notificationType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const mapNotification = (x: unknown): StaffNotification => {
  const o = x as Record<string, unknown>;
  return {
    id: toNumber(o.id),
    notificationType: String(o.notificationType ?? ''),
    title: String(o.title ?? ''),
    message: String(o.message ?? ''),
    isRead: Boolean(o.isRead),
    createdAt: String(o.createdAt ?? ''),
  };
};

export const staffNotificationsApi = {
  list: async (): Promise<StaffNotification[]> => {
    const res = await apiClient.get('/staff/notifications');
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(mapNotification);
  },
  markRead: async (id: number): Promise<StaffNotification> => {
    const res = await apiClient.post(`/staff/notifications/${id}/read`);
    return mapNotification(res.data);
  },
};

