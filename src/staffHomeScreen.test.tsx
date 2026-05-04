import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import renderer from 'react-test-renderer';

import StaffHomeScreen from '../app/(staff)/index';

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
    Package: Icon,
    ClipboardList: Icon,
    Clock: Icon,
    User: Icon,
    TrendingUp: Icon,
    Inbox: Icon,
    AlertCircle: Icon,
    ChevronLeft: Icon,
    ChevronRight: Icon,
    BookOpen: Icon,
    CalendarDays: Icon,
    Bell: Icon,
  };
});

vi.mock('../src/api/staffOrders', () => ({
  staffOrdersApi: {
    getQueue: vi.fn(),
    getMyActive: vi.fn(),
    getPerformanceDaily: vi.fn(),
    getPerformanceSummary: vi.fn(),
  },
}));

vi.mock('../src/api/staffIssues', () => ({
  staffIssuesApi: {
    my: vi.fn(),
  },
}));

vi.mock('react-native', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');
  const create = (type: string) => ({ children, ...props }: { children?: React.ReactNode }) =>
    ReactActual.createElement(type, props, children);
  return {
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

const pushMock = vi.fn();
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = Array.isArray(queryKey) ? String(queryKey[0]) : '';
    if (key === 'staff-order-queue') return { data: [], isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-order-my-active') return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-issues-my') return { data: [], isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-notifications') return { data: [], isLoading: false, isError: false, refetch: vi.fn() };
    return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));

vi.mock('../src/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { fullName: string } }) => unknown) => selector({ user: { fullName: 'Test Staff' } }),
}));

vi.mock('../src/store/staffHomeStore', () => ({
  useStaffHomeStore: (
    selector: (s: {
      promoIndex: number;
      setPromoIndex: (v: number) => void;
    }) => unknown
  ) =>
    selector({
      promoIndex: 0,
      setPromoIndex: vi.fn(),
    }),
}));

const setViewMock = vi.fn();
vi.mock('../src/store/staffOrdersStore', () => ({
  useStaffOrdersStore: {
    getState: () => ({
      setView: setViewMock,
    }),
  },
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const collectTextFromInstance = (node: renderer.ReactTestInstance | string, out: string[] = []): string[] => {
  if (typeof node === 'string') out.push(node);
  else node.children.forEach((c) => collectTextFromInstance(c as any, out));
  return out;
};

describe('StaffHomeScreen', () => {
  beforeEach(() => {
    pushMock.mockClear();
    setViewMock.mockClear();
  });

  test('renders key sections', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Xin chào');
    expect(text).toContain('Sản phẩm');
    expect(text).toContain('Đơn hàng');
    expect(text).toContain('Chấm công');
    expect(text).toContain('Cá nhân');
    expect(text).toContain('Sổ tay công việc');
    expect(text).toContain('Hiệu suất công việc');
  });

  test('navigates to notifications', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'btn-notifications' });
    btn.props.onPress();
    expect(pushMock).toHaveBeenCalledWith('/(staff)/notifications');
  });

  test('navigates to queue', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'stat-queue' });
    btn.props.onPress();
    expect(setViewMock).toHaveBeenCalledWith('QUEUE');
    expect(pushMock).toHaveBeenCalledWith('/(staff)/orders');
  });

  test('navigates to active orders', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'stat-active' });
    btn.props.onPress();
    expect(setViewMock).toHaveBeenCalledWith('MY_ACTIVE');
    expect(pushMock).toHaveBeenCalledWith('/(staff)/orders');
  });

  test('navigates to issues', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'stat-issues' });
    btn.props.onPress();
    expect(pushMock).toHaveBeenCalledWith('/(staff)/issues');
  });

  test('navigates to handbook', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'btn-handbook' });
    btn.props.onPress();
    expect(pushMock).toHaveBeenCalledWith('/(staff)/handbook');
  });

  test('navigates to performance', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'btn-performance' });
    btn.props.onPress();
    expect(pushMock).toHaveBeenCalledWith('/(staff)/performance');
  });
});
