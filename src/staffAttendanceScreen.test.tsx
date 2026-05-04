import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import renderer from 'react-test-renderer';

import StaffAttendanceScreen from '../app/(staff)/attendance/index';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success', Error: 'Error' },
}));

vi.mock('react-native', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');
  const create = (type: string) => ({ children, ...props }: { children?: React.ReactNode }) =>
    ReactActual.createElement(type, props, children);
  return {
    __esModule: true,
    Alert: { alert: vi.fn() },
    ActivityIndicator: create('div'),
    Pressable: ({ children, onPress, ...props }: { children?: React.ReactNode; onPress?: () => void }) =>
      ReactActual.createElement('button', { ...props, onClick: onPress }, children),
    ScrollView: create('div'),
    Text: create('span'),
    TextInput: create('input'),
    View: create('div'),
    Switch: create('input'),
    TouchableOpacity: create('button'),
    Platform: { OS: 'ios', select: (v: Record<string, unknown>) => v.ios },
  };
});

vi.mock('expo-router', () => ({
  Stack: { Screen: () => null },
}));

vi.mock('../src/store/staffAttendanceStore', () => ({
  useStaffAttendanceStore: () => ({
    todayShift: 'S',
    todayRecords: [],
    isLoading: false,
    error: null,
    calendarData: new Map(),
    calendarMonth: 5,
    calendarYear: 2026,
    fetchTodayStatus: vi.fn(),
    fetchCalendar: vi.fn(),
    performCheckIn: vi.fn(),
    performCheckOut: vi.fn(),
  })
}));

vi.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  ChevronRight: () => null,
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const collectTextFromInstance = (node: renderer.ReactTestInstance | string, out: string[] = []): string[] => {
  if (typeof node === 'string') out.push(node);
  else node.children.forEach((c) => collectTextFromInstance(c as any, out));
  return out;
};

describe('StaffAttendanceScreen', () => {
  test('renders title and actions', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffAttendanceScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Chấm công');
    expect(text).toContain('Vào ca');
    expect(text).toContain('Ra ca');
  });
});
