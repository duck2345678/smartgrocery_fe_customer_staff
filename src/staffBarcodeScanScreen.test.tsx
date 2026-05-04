import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import renderer from 'react-test-renderer';

import StaffBarcodeScanScreen from '../app/(staff)/products/scan';

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
    FlipHorizontal: Icon,
    Flashlight: Icon,
    FlashlightOff: Icon,
    X: Icon,
    Image: Icon,
  };
});

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn(),
}));

vi.mock('react-native-svg', () => {
  const Svg = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  const Node = () => null;
  return { __esModule: true, default: Svg, Path: Node, Circle: Node };
});

const routerBackMock = vi.fn();

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: routerBackMock }),
}));

const setSearchMock = vi.fn();

vi.mock('../src/store/staffProductsStore', () => ({
  useStaffProductsStore: (selector: (s: { setSearch: (v: string) => void }) => unknown) => selector({ setSearch: setSearchMock }),
}));

let lastCameraFacing: unknown = null;

vi.mock('expo-camera', () => ({
  CameraView: ({ facing, ...props }: any) => {
    lastCameraFacing = facing;
    return React.createElement('div', { ...props, 'data-testid': 'camera', 'data-facing': String(facing) });
  },
  useCameraPermissions: () => [{ granted: true }, vi.fn()],
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-native', async () => {
  const ReactActual = await vi.importActual<typeof import('react')>('react');
  const create = (type: string) => ({ children, ...props }: { children?: React.ReactNode }) =>
    ReactActual.createElement(type, props, children);
  return {
    __esModule: true,
    Platform: { OS: 'ios', select: (v: Record<string, unknown>) => v.ios },
    useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
    ActivityIndicator: create('div'),
    Pressable: ({ children, onPress, ...props }: { children?: React.ReactNode; onPress?: () => void }) =>
      ReactActual.createElement('button', { ...props, onClick: onPress }, children),
    Text: create('span'),
    View: create('div'),
  };
});

describe('StaffBarcodeScanScreen', () => {
  test('toggles camera facing when pressing "Đổi camera"', () => {
    lastCameraFacing = null;
    routerBackMock.mockClear();
    setSearchMock.mockClear();

    let inst!: renderer.ReactTestRenderer;
    renderer.act(() => {
      inst = renderer.create(<StaffBarcodeScanScreen />);
    });

    expect(String(lastCameraFacing)).toBe('back');

    const btn = inst.root.findByProps({ testID: 'scanner-switch-camera' });
    renderer.act(() => {
      btn.props.onPress();
    });

    expect(String(lastCameraFacing)).toBe('front');
  });
});
