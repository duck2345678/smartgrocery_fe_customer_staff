import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import renderer from 'react-test-renderer';

import StaffOrdersScreen from '../app/(staff)/orders/index';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success', Error: 'Error' },
}));

vi.mock('../src/api/staffOrders', () => ({
  staffOrdersApi: {
    getQueue: vi.fn(),
    getMyActive: vi.fn(),
    assign: vi.fn(),
    release: vi.fn(),
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
  Stack: { Screen: () => null },
}));

vi.mock('../src/store/staffOrdersStore', () => ({
  useStaffOrdersStore: (selector: (s: { view: 'QUEUE' | 'MY_ACTIVE'; setView: (v: 'QUEUE' | 'MY_ACTIVE') => void }) => unknown) =>
    selector({ view: 'QUEUE', setView: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = Array.isArray(queryKey) ? String(queryKey[0]) : '';
    if (key === 'staff-order-queue') return { data: [], isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-order-my-active') return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
    return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
  },
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
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

describe('StaffOrdersScreen', () => {
  test('renders tabs and empty state', () => {
    let inst: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffOrdersScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Đơn hàng');
    expect(text).toContain('Hàng chờ');
    expect(text).toContain('Đang xử lý');
  });
});
