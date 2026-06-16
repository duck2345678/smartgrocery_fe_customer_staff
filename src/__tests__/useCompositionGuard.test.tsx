import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import renderer from 'react-test-renderer';
import useCompositionGuard, { type UseCompositionGuardOptions } from '../hooks/useCompositionGuard';

(globalThis as any).__DEV__ = true;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

type GuardResult = ReturnType<typeof useCompositionGuard>;

function renderGuard(opts?: UseCompositionGuardOptions) {
  let latest: GuardResult | undefined;
  const Harness = () => {
    latest = useCompositionGuard(opts);
    return null;
  };
  renderer.act(() => {
    renderer.create(<Harness />);
  });
  return {
    get current() {
      if (!latest) throw new Error('Hook did not render');
      return latest;
    },
  };
}

describe('useCompositionGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets composing on changeText for native and clears after debounce', () => {
    const result = renderGuard({ debounceMs: 200 });
    renderer.act(() => {
      result.current.onChangeText('x');
    });
    expect(result.current.isComposing).toBe(true);
    renderer.act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isComposing).toBe(true);
    renderer.act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.isComposing).toBe(false);
  });

  it('blocks immediate submit and schedules submit when composing', () => {
    const result = renderGuard({ debounceMs: 200, recentThresholdMs: 50 });
    const spy = vi.fn();
    renderer.act(() => {
      result.current.onChangeText('b');
    });
    let submitted = true;
    renderer.act(() => {
      submitted = result.current.requestSubmit(spy);
    });
    expect(submitted).toBe(false);
    renderer.act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(spy).toHaveBeenCalled();
  });
});
