import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import renderer from 'react-test-renderer';

import StaffProfileScreen from '../app/(staff)/profile/index';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success', Error: 'Error' },
}));

vi.mock('lucide-react-native', () => {
  const Icon = () => null;
  return {
    User: Icon,
    Briefcase: Icon,
    ReceiptText: Icon,
    Lock: Icon,
    LogOut: Icon,
    ChevronRight: Icon,
  };
});

vi.mock('react-native', () => {
  const create =
    (type: string) =>
    ({ children, ...props }: { children?: React.ReactNode } & Record<string, any>) =>
      React.createElement(type, props, children);
  return {
    Alert: { alert: vi.fn() },
    ActivityIndicator: create('div'),
    Pressable: ({ children, onPress, ...props }: { children?: React.ReactNode; onPress?: () => void } & Record<string, any>) =>
      React.createElement('button', { ...props, onClick: onPress }, children),
    ScrollView: create('div'),
    Text: create('span'),
    TextInput: create('input'),
    View: create('div'),
    Switch: create('input'),
    TouchableOpacity: create('button'),
    Platform: { OS: 'ios', select: (v: Record<string, any>) => v.ios },
  };
});

vi.mock('expo-router', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  Stack: { Screen: () => null },
}));

vi.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: any) => cb?.(),
}));

vi.mock('../src/store/authStore', () => ({
  useAuthStore: (
    selector: (s: { user: { fullName: string; email: string; role: 'STAFF' }; logout: () => void }) => unknown
  ) =>
    selector({
      user: { fullName: 'Test Staff', email: 'staff@test.com', role: 'STAFF' },
      logout: vi.fn(),
    }),
}));

vi.mock('../src/store/staffProfileStore', () => ({
  useStaffProfileStore: (
    selector: (s: { receiveInAppNotifications: boolean; setReceiveInAppNotifications: (v: boolean) => void }) => unknown
  ) =>
    selector({
      receiveInAppNotifications: true,
      setReceiveInAppNotifications: vi.fn(),
    }),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const collectTextFromInstance = (node: renderer.ReactTestInstance | string, out: string[] = []): string[] => {
  if (typeof node === 'string') out.push(node);
  else node.children.forEach((c) => collectTextFromInstance(c as any, out));
  return out;
};

describe('StaffProfileScreen', () => {
  test('renders user info', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffProfileScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Hồ sơ cá nhân');
    expect(text).toContain('Test Staff');
    expect(text).toContain('Nhân viên');
  });
});
