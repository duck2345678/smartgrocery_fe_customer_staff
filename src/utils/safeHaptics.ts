/**
 * safeHaptics.ts
 * --------------------------------------------------
 * Wrapper an toàn cho expo-haptics.
 * 
 * Trên Android Emulator hoặc các thiết bị không hỗ trợ haptic engine,
 * gọi Haptics trực tiếp có thể gây native crash (văng app) mà KHÔNG
 * hiện Red Screen. Module này bọc mọi lệnh haptics trong try/catch
 * để app không bao giờ bị crash vì rung.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Kiểm tra xem có nên chạy haptics hay không */
const canUseHaptics = (): boolean => {
  // Android Emulator thường không hỗ trợ haptics, nhưng ta vẫn try
  // Chỉ skip hẳn nếu platform không phải mobile
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

export const safeImpact = async (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
): Promise<void> => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.impactAsync(style);
  } catch {
    // Nuốt lỗi - không crash app vì rung
  }
};

export const safeNotification = async (
  type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success
): Promise<void> => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.notificationAsync(type);
  } catch {
    // Nuốt lỗi - không crash app vì rung
  }
};

export const safeSelection = async (): Promise<void> => {
  if (!canUseHaptics()) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    // Nuốt lỗi
  }
};

// Re-export các enum để tiện dùng
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
