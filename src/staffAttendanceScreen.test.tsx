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
    Animated: {
      View: create('div'),
      Value: vi.fn().mockImplementation(() => ({
        setValue: vi.fn(),
      })),
      parallel: vi.fn().mockReturnValue({ start: vi.fn() }),
      spring: vi.fn().mockReturnValue({ start: vi.fn() }),
      timing: vi.fn().mockReturnValue({ start: vi.fn((cb?: () => void) => cb?.()) }),
    },
    Modal: create('div'),
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
    selectedDate: '2026-05-10',
    fetchTodayStatus: vi.fn(),
    fetchCalendar: vi.fn(),
    performCheckIn: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
    performCheckOut: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
    requestShift: vi.fn(),
    cancelShiftRequest: vi.fn(),
    setSelectedDate: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  ChevronRight: () => null,
  LogIn: () => null,
  LogOut: () => null,
  Clock: () => null,
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
  test('renders title and action buttons', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffAttendanceScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Chấm công');
    expect(text).toContain('Vào ca');
    expect(text).toContain('Ra ca');
  });

  test('renders dynamic detail card for selected date', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffAttendanceScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Chi tiết ngày');
  });

  test('shows shift request buttons for future day without schedule', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffAttendanceScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Ca S');
    expect(text).toContain('Ca C');
    expect(text).toContain('Ca G');
  });

  test('renders weekday headers in Vietnamese', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffAttendanceScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('T2');
    expect(text).toContain('CN');
  });
});
