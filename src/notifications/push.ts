import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userDevicesApi } from '../api/userDevices';

const TOKEN_KEY = 'SG_PUSH_TOKEN_V1';

export const getStoredPushToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setStoredPushToken = async (token: string | null): Promise<void> => {
  try {
    if (!token) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return;
    }
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    return;
  }
};

export const registerDeviceForPush = async (deviceType: string): Promise<string | null> => {
  try {
    if (Constants.executionEnvironment === 'storeClient') {
      console.log('Skipping push registration in Expo Go');
      return null;
    }
    const Notifications = await import('expo-notifications');
    const perm = await Notifications.getPermissionsAsync();
    let granted = perm.granted || perm.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.granted || req.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }
    if (!granted) return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const prev = await getStoredPushToken();
    if (prev !== token) {
      await userDevicesApi.register(token, deviceType);
      await setStoredPushToken(token);
    }
    return token;
  } catch {
    return null;
  }
};

export const unregisterDeviceForPush = async (): Promise<void> => {
  const token = await getStoredPushToken();
  if (!token) return;
  try {
    await userDevicesApi.unregister(token);
  } catch {
    void 0;
  } finally {
    await setStoredPushToken(null);
  }
};
