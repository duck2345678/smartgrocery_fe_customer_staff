import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import renderer from 'react-test-renderer';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
;(globalThis as any).__DEV__ = true;
(globalThis as any).window = (globalThis as any).window ?? {};
;(globalThis as any).TurboModuleRegistry = (globalThis as any).TurboModuleRegistry ?? {};

const pushMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('lucide-react-native', () => {
  const Icon = () => null;
  return {
    ChevronRight: Icon,
    History: Icon,
    MapPin: Icon,
    Settings: Icon,
    UserCircle2: Icon,
  };
});

vi.mock('./store/authStore', () => ({
  useAuthStore: () => ({
    user: { fullName: 'Test User', email: 'test@example.com' },
    logout: logoutMock,
  }),
}));

vi.mock('react-native', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');
  const create = (type: string) => ({ children, ...props }: { children?: React.ReactNode }) =>
    ReactActual.createElement(type, props, children);
  return {
    View: create('div'),
    Text: create('span'),
    Pressable: create('button'),
    Platform: { OS: 'ios', select: (v: Record<string, unknown>) => v.ios },
    TurboModuleRegistry: {},
  };
});

vi.mock('./components/ui/Button', () => ({
  default: ({ label, onPress }: { label: string; onPress: () => void }) => (
    <button onClick={onPress}>{label}</button>
  ),
}));

import CustomerProfile from '../app/(customer)/profile';

const collectTextFromInstance = (node: renderer.ReactTestInstance | string, out: string[] = []): string[] => {
  if (typeof node === 'string') out.push(node);
  else node.children.forEach((child) => collectTextFromInstance(child as any, out));
  return out;
};

describe('CustomerProfile', () => {
  beforeEach(() => {
    pushMock.mockClear();
    logoutMock.mockClear();
  });

  test('renders profile header and menu items', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<CustomerProfile />);
    });

    const text = collectTextFromInstance(inst.root).join(' ');
    expect(text).toContain('Test User');
    expect(text).toContain('test@example.com');
    expect(text).toContain('Thông tin hồ sơ');
    expect(text).toContain('Đơn hàng');
    expect(text).toContain('Đăng xuất');
  });

  test('calls logout when Đăng xuất is pressed', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<CustomerProfile />);
    });

    const logoutButton = inst.root.findAll((node) => node.type === 'button' && node.children.includes('Đăng xuất'))[0];
    expect(logoutButton).toBeDefined();
    renderer.act(() => {
      logoutButton.props.onClick();
    });
    expect(logoutMock).toHaveBeenCalled();
  });
});
