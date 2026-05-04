import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import renderer from 'react-test-renderer';

import StaffHomeScreen from '../app/(staff)/index';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const setSelectedDateIsoMock = vi.fn();
const toggleHandbookCategoryMock = vi.fn();

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

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = Array.isArray(queryKey) ? String(queryKey[0]) : '';
    if (key === 'staff-order-queue') return { data: [], isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-order-my-active') return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-issues-my') return { data: [], isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-performance-daily')
      return { data: { date: '2026-01-01', completedCount: 0, orders: [] }, isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-performance-summary')
      return {
        data: { date: '2026-01-01', weekFrom: '2025-12-29', weekTo: '2026-01-04', weekCompletedCount: 0, monthFrom: '2026-01-01', monthTo: '2026-01-31', monthCompletedCount: 0 },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      };
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
      selectedDateIso: string;
      setSelectedDateIso: (v: string) => void;
      handbookOpenCategoryIds: string[];
      toggleHandbookCategory: (id: string) => void;
    }) => unknown
  ) =>
    selector({
      promoIndex: 0,
      setPromoIndex: vi.fn(),
      selectedDateIso: '2026-01-01',
      setSelectedDateIso: setSelectedDateIsoMock,
      handbookOpenCategoryIds: ['getting-started'],
      toggleHandbookCategory: toggleHandbookCategoryMock,
    }),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const collectText = (node: unknown, out: string[] = []): string[] => {
  if (node == null) return out;
  if (typeof node === 'string') out.push(node);
  if (Array.isArray(node)) node.forEach((x) => collectText(x, out));
  if (typeof node === 'object' && node && 'children' in (node as { children?: unknown })) {
    collectText((node as { children?: unknown }).children, out);
  }
  return out;
};

const collectTextFromInstance = (node: renderer.ReactTestInstance | string, out: string[] = []): string[] => {
  if (typeof node === 'string') out.push(node);
  else node.children.forEach((c) => collectTextFromInstance(c as any, out));
  return out;
};

describe('StaffHomeScreen', () => {
  test('renders key sections', () => {
    let inst: renderer.ReactTestRenderer;
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

  test('toggles handbook category', () => {
    toggleHandbookCategoryMock.mockClear();
    let inst: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const btn = inst.root.findByProps({ testID: 'handbook-toggle-orders' });
    btn.props.onPress();
    expect(toggleHandbookCategoryMock).toHaveBeenCalledWith('orders');
  });

  test('selects date from calendar', () => {
    setSelectedDateIsoMock.mockClear();
    let inst: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffHomeScreen />);
    });
    const day = inst.root.findByProps({ testID: 'calendar-day-2026-01-02' });
    day.props.onPress();
    expect(setSelectedDateIsoMock).toHaveBeenCalledWith('2026-01-02');
  });
});
