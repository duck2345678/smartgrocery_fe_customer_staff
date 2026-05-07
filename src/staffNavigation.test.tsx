import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import renderer from 'react-test-renderer';

import StaffLayout from '../app/(staff)/_layout';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('expo-router', () => ({
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>,
    {
      Screen: ({ name, options }: any) => (
        <div data-testid={`tab-screen-${name}`} data-options={JSON.stringify(options)} />
      ),
    }
  ),
}));

vi.mock('../src/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected">{children}</div>,
}));

vi.mock('lucide-react-native', () => {
  const Icon = () => null;
  return {
    Home: Icon,
    Package: Icon,
    ClipboardList: Icon,
    Clock: Icon,
    User: Icon,
  };
});

vi.mock('react-native', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');
  const create = (type: string) => ({ children, ...props }: { children?: React.ReactNode }) =>
    ReactActual.createElement(type, props, children);
  return {
    Text: create('span'),
    View: create('div'),
  };
});

describe('StaffNavigation', () => {
  test('renders exactly 5 visible tabs in correct order', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffLayout />);
    });
    
    // Get all screens
    const screens = inst.root.findAllByProps({ className: undefined }).filter(
      (node) => node.props['data-testid']?.startsWith('tab-screen-')
    );
    
    // Filter out hidden ones (href: null)
    const visibleScreens = screens.filter((node) => {
      const options = JSON.parse(node.props['data-options'] || '{}');
      return options.href !== null;
    });

    const visibleNames = visibleScreens.map((node) => node.props['data-testid'].replace('tab-screen-', ''));
    
    expect(visibleNames).toEqual([
      'index',
      'products',
      'orders',
      'attendance',
      'profile',
    ]);
  });

  test('hides nested and auxiliary routes', () => {
    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffLayout />);
    });
    
    const hiddenRoutes = [
      'products/scan',
      'products/[id]',
      'orders/[id]',
      'admin-queue',
      'handbook',
      'performance',
      'notifications',
    ];

    hiddenRoutes.forEach((route) => {
      const node = inst.root.findByProps({ 'data-testid': `tab-screen-${route}` });
      const options = JSON.parse(node.props['data-options'] || '{}');
      expect(options.href).toBeNull();
    });
  });
});
