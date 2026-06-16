import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import renderer from 'react-test-renderer';

import CustomerSearch from '../app/(customer)/search';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

var backMock = vi.fn();
var pushMock = vi.fn();
var queryParams: Record<string, unknown> = {};
var useQueryMock = vi.fn<(_options?: unknown) => any>(() => ({ data: [], isFetching: false, isError: false, refetch: vi.fn() }));

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock, back: backMock }),
  useLocalSearchParams: () => queryParams,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
}));

vi.mock('expo-image', () => ({
  Image: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem }: { data: any[]; renderItem: (info: { item: any; index: number }) => React.ReactNode }) => (
    <>{data.map((item, index) => <React.Fragment key={item?.id ?? index}>{renderItem({ item, index })}</React.Fragment>)}</>
  ),
}));

vi.mock('./components/customer/CartButton', () => ({
  default: () => <button>Cart</button>,
}));

vi.mock('lucide-react-native', () => {
  const Icon = () => null;
  return {
    Search: Icon,
    X: Icon,
    ArrowLeft: Icon,
    RefreshCw: Icon,
  };
});

vi.mock('./store/authStore', () => ({
  useAuthStore: () => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isHydrated: true,
    setHydrated: vi.fn(),
    setTokens: vi.fn(),
    setUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  getItem: vi.fn(async () => null),
  setItem: vi.fn(async () => undefined),
  removeItem: vi.fn(async () => undefined),
  clear: vi.fn(async () => undefined),
  getAllKeys: vi.fn(async () => []),
}));

vi.mock('react-native', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');
  const create = (type: string) => ({ children, ...props }: { children?: React.ReactNode }) =>
    ReactActual.createElement(type, props, children);

  return {
    View: create('div'),
    Text: create('span'),
    TextInput: create('input'),
    Pressable: create('button'),
    ScrollView: create('div'),
    ActivityIndicator: create('div'),
    Platform: { OS: 'ios', select: (v: Record<string, unknown>) => v.ios },
    TurboModuleRegistry: {},
  };
});

const collectTextFromInstance = (node: renderer.ReactTestInstance | string, out: string[] = []): string[] => {
  if (typeof node === 'string') out.push(node);
  else node.children.forEach((child) => collectTextFromInstance(child as any, out));
  return out;
};

describe('CustomerSearch', () => {
  beforeEach(() => {
    backMock.mockClear();
    pushMock.mockClear();
    queryParams = {};
    useQueryMock.mockReset();
  });

  test('renders empty prompt when no search query', () => {
    queryParams = {};
    useQueryMock.mockImplementation((options?: unknown) => {
      const { queryKey } = (options ?? {}) as { queryKey?: unknown[] };
      const key = Array.isArray(queryKey) ? String(queryKey[0]) : '';
      if (key === 'categories') {
        return { data: [{ id: 1, name: 'Rau' }], isLoading: false, isError: false, refetch: vi.fn() };
      }
      return { data: [], isFetching: false, isError: false, refetch: vi.fn() };
    });

    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<CustomerSearch />);
    });

    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Nhập tên sản phẩm hoặc chọn danh mục');
    expect(text).toContain('Rau');
  });

  test('renders product results when initial query exists', () => {
    queryParams = { q: 'bánh' };
    useQueryMock.mockImplementation((options?: unknown) => {
      const { queryKey } = (options ?? {}) as { queryKey?: unknown[] };
      const key = Array.isArray(queryKey) ? String(queryKey[0]) : '';
      const queryOptions = Array.isArray(queryKey) ? (queryKey[1] as Record<string, unknown>) : {};
      if (key === 'categories') {
        return { data: [{ id: 1, name: 'Bánh' }], isLoading: false, isError: false, refetch: vi.fn() };
      }
      if (key === 'products' && queryOptions.search === 'bánh') {
        return {
          data: [
            {
              id: 101,
              name: 'Bánh mì gối',
              category: 'Bánh mì',
              price: 25000,
              unit: 'cái',
              stock: 5,
              imageUrl: 'https://example.com/bread.jpg',
            },
          ],
          isFetching: false,
          isError: false,
          refetch: vi.fn(),
        };
      }
      return { data: [], isFetching: false, isError: false, refetch: vi.fn() };
    });

    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<CustomerSearch />);
    });

    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('kết quả');
    expect(text).toContain('"bánh"');
    expect(text).toContain('Bánh mì gối');
  });
});
