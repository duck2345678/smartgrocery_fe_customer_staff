import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'smartgrocery-device-fingerprint-v1';

const createFingerprint = () => {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2);
  return `${Platform.OS}-${timePart}-${randomPart}`;
};

export const getDeviceFingerprint = async (): Promise<string> => {
  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  if (existing && existing.trim()) return existing.trim();

  const fingerprint = createFingerprint();
  await AsyncStorage.setItem(STORAGE_KEY, fingerprint);
  return fingerprint;
};