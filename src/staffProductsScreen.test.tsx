import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import renderer from 'react-test-renderer';

import StaffProductsScreen from '../app/(staff)/products/index';

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
  return { Search: Icon, ScanLine: Icon };
});

vi.mock('../src/api/products', () => ({
  productApi: {
    getCategories: vi.fn(),
    getProducts: vi.fn(),
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

vi.mock('../src/store/staffProductsStore', () => ({
  useStaffProductsStore: (selector: (s: { search: string; categoryId: number | null; setSearch: (v: string) => void; setCategoryId: (v: number | null) => void }) => unknown) =>
    selector({ search: '', categoryId: null, setSearch: vi.fn(), setCategoryId: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => {
    const key = Array.isArray(queryKey) ? String(queryKey[0]) : '';
    if (key === 'staff-products-categories') return { data: [{ id: 1, name: 'Rau củ' }], isLoading: false, isError: false, refetch: vi.fn() };
    if (key === 'staff-products')
      return {
        data: [{ id: 10, name: 'Cải bó xôi', price: 12000, unit: 'gói', imageUrl: '', stock: 5, purchaseCount: 0, category: 'Rau củ' }],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      };
    return { data: null, isLoading: false, isError: false, refetch: vi.fn() };
  },
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

describe('StaffProductsScreen', () => {
  test('renders list with category chips', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffProductsScreen />);
    });
    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Sản phẩm');
    expect(text).toContain('Tất cả');
    expect(text).toContain('Rau củ');
    expect(text).toContain('Cải bó xôi');
  });
});
