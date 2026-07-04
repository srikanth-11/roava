import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface SkeletonProps {
  /** Tailwind sizing/radius classes, e.g. "h-4 w-32 rounded-md" */
  className?: string;
}

export function Skeleton({ className = 'h-4 w-full rounded-md' }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 700 }), -1, true));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      style={animatedStyle}
      className={`bg-border ${className}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
