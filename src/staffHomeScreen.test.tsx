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
    AlertCircle: Icon,
    ChevronLeft: Icon,
    ChevronRight: Icon,
    BookOpen: Icon,
    CalendarDays: Icon,
    Bell: Icon,
    DollarSign: Icon,
    ShieldAlert: Icon,
    ShieldCheck: Icon,
  };
});

vi.mock('../src/api/staffOrders', () => ({
  staffOrdersApi: {
    getMyActive: vi.fn(),
    getPerformanceDaily: vi.fn(),
    getPerformanceSummary: vi.fn(),
  },
}));

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

const pushMock = vi.fn<(path: any) => void>();
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: any) => cb?.(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = Array.isArray(queryKey) ? String(queryKey[0]) : '';
    if (key === 'staff-order-my-active') return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-notifications') return { data: [], isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-performance-daily') return { data: { completedCount: 7, orders: [] }, isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-performance-summary') {
      return {
        data: {
          weekCompletedCount: 18,
          monthCompletedCount: 62,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      };
    }
    return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
  },
}));

vi.mock('../src/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { fullName: string } }) => unknown) => selector({ user: { fullName: 'Test Staff' } }),
}));

vi.mock('../src/store/staffHomeStore', () => ({
  useStaffHomeStore: (
    selector: (s: { promoIndex: number; setPromoIndex: (v: number) => void; selectedDateIso: string; setSelectedDateIso: (v: string) => void }) => unknown
  ) =>
    selector({
      promoIndex: 0,
      setPromoIndex: vi.fn(),
      selectedDateIso: '2026-05-06',
      setSelectedDateIso: vi.fn(),
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

describe('StaffHomeScreen', () => {
  beforeEach(() => {
    pushMock.mockClear();
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
    expect(text).toContain('Lương tháng này');
    expect(text).toContain('7');
    expect(text).toContain('18');
    expect(text).toContain('62');
  });

  test('navigates to active orders', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'quick-orders' });
    btn.props.onPress();
    expect(pushMock).toHaveBeenCalledWith('/(staff)/orders');
  });

  test('navigates to salary', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'stat-salary' });
    btn.props.onPress();
    expect(pushMock).toHaveBeenCalledWith('/(staff)/profile/payslip');
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
