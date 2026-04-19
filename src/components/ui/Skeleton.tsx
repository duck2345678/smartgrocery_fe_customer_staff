import { useEffect, useMemo } from 'react';
import { Animated, View } from 'react-native';
import { clsx } from 'clsx';

export default function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: Record<string, unknown>;
}) {
  const opacity = useMemo(() => new Animated.Value(0.55), []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  const containerStyle = useMemo(() => ({ opacity }), [opacity]);

  return (
    <Animated.View style={[containerStyle, style as never]}>
      <View className={clsx('bg-slate-200/70 rounded-xl', className)} />
    </Animated.View>
  );
}
