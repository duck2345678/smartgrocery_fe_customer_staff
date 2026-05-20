import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import useCompositionGuard from '../hooks/useCompositionGuard';

describe('useCompositionGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets composing on changeText for native and clears after debounce', () => {
    const { result } = renderHook(() => useCompositionGuard({ debounceMs: 200 }));
    act(() => {
      result.current.onChangeText('x');
    });
    expect(result.current.isComposing).toBe(true);
    // advance less than debounce: still composing
    vi.advanceTimersByTime(100);
    expect(result.current.isComposing).toBe(true);
    vi.advanceTimersByTime(150);
    expect(result.current.isComposing).toBe(false);
  });

  it('blocks immediate submit and schedules submit when composing', () => {
    const { result } = renderHook(() => useCompositionGuard({ debounceMs: 200, recentThresholdMs: 50 }));
    const spy = vi.fn();
    act(() => {
      result.current.onChangeText('b');
    });
    const submitted = result.current.requestSubmit(spy);
    expect(submitted).toBe(false);
    // scheduled call after debounce
    vi.advanceTimersByTime(250);
    expect(spy).toHaveBeenCalled();
  });
});
