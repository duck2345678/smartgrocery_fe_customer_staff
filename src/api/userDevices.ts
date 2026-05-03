import apiClient from './client';

export const userDevicesApi = {
  register: async (token: string, deviceType: string): Promise<void> => {
    await apiClient.post('/users/me/devices', { fcmToken: token, deviceType });
  },
  unregister: async (token: string): Promise<void> => {
    await apiClient.delete('/users/me/devices', { params: { fcmToken: token } });
  },
};

