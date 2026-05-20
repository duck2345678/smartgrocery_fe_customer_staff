import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

export type UseCompositionGuardOptions = {
  debounceMs?: number;
  recentThresholdMs?: number;
};

export default function useCompositionGuard(opts?: UseCompositionGuardOptions) {
  const debounceMs = opts?.debounceMs ?? 450;
  const recentThresholdMs = opts?.recentThresholdMs ?? 400;

  const [isComposing, setIsComposing] = useState(false);
  const lastChangeAtRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onChangeText = (text: string) => {
    lastChangeAtRef.current = Date.now();
    if (Platform.OS !== 'web') {
      setIsComposing(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsComposing(false), debounceMs);
    }
  };

  const onCompositionStart = () => {
    if (Platform.OS === 'web') setIsComposing(true);
  };
  const onCompositionUpdate = () => {
    if (Platform.OS === 'web') {
      setIsComposing(true);
      lastChangeAtRef.current = Date.now();
    }
  };
  const onCompositionEnd = () => {
    if (Platform.OS === 'web') {
      setIsComposing(false);
      lastChangeAtRef.current = Date.now();
    }
  };

  const shouldBlockSubmitNow = () => {
    const now = Date.now();
    return isComposing || now - lastChangeAtRef.current < recentThresholdMs;
  };

  const requestSubmit = (onSubmit: () => void) => {
    if (shouldBlockSubmitNow()) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsComposing(false);
        onSubmit();
      }, debounceMs);
      return false;
    }
    onSubmit();
    return true;
  };

  return {
    isComposing,
    onChangeText,
    onCompositionStart,
    onCompositionUpdate,
    onCompositionEnd,
    shouldBlockSubmitNow,
    requestSubmit,
  } as const;
}
