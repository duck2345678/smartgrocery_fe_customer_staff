import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated';

const COLORS = ['#22C55E', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#FCD34D', '#3B82F6'];
const COUNT = 40;

interface Props {
  onComplete?: () => void;
}

export const Confetti = ({ onComplete }: Props) => {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: COUNT }).map((_, i) => (
        <ConfettiPiece 
          key={i} 
          index={i} 
          width={width} 
          height={height} 
          onComplete={i === 0 ? onComplete : undefined} 
        />
      ))}
    </View>
  );
};

const ConfettiPiece = ({ index, width, height, onComplete }: any) => {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(Math.random() * width);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const color = COLORS[index % COLORS.length];
  const size = Math.random() * 8 + 4;
  const duration = Math.random() * 2000 + 1500;
  const delay = Math.random() * 500;

  useEffect(() => {
    const isLeft = index % 2 === 0;
    const startX = isLeft ? -50 : width + 50;
    const endX = width / 2 + (Math.random() - 0.5) * width * 0.8;
    const midX = isLeft ? width * 0.2 : width * 0.8;
    
    translateX.value = startX;
    translateY.value = height + 50;

    // Arc animation
    translateY.value = withDelay(delay, withSequence(
      withTiming(height * 0.3 + Math.random() * 100, { 
        duration: duration * 0.4, 
        easing: Easing.out(Easing.quad) 
      }),
      withTiming(height + 100, { 
        duration: duration * 0.6, 
        easing: Easing.in(Easing.quad) 
      }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    ));

    translateX.value = withDelay(delay, withTiming(endX, { duration }));
    
    rotate.value = withDelay(delay, withTiming(Math.random() * 1000, { duration }));
    opacity.value = withDelay(delay + duration * 0.8, withTiming(0, { duration: duration * 0.2 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
    backgroundColor: color,
    width: size,
    height: size,
    position: 'absolute',
  }));

  return <Animated.View style={animatedStyle} />;
};
