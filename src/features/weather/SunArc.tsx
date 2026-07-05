import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Text } from '@/components/ui';
import { palette } from '@/lib/palette';
import type { SunTimes } from '@/repositories/weather';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Semicircle geometry: radius 80, baseline y=100 in a 200×112 viewBox.
const R = 80;
const CX = 100;
const BASE_Y = 100;

interface SunArcProps {
  sun: SunTimes;
}

/**
 * Sun position along a semicircular day arc, animated from sunrise on mount.
 * SVG because a curved, partially-stroked path with a glyph riding it isn't
 * expressible in flexbox — and react-native-svg props animate on the UI
 * thread via useAnimatedProps (the SVG sibling of useAnimatedStyle).
 */
export function SunArc({ sun }: SunArcProps) {
  const { colorScheme } = useColorScheme();
  const colors = palette[colorScheme ?? 'light'];

  // Snapshot the clock once via lazy useState — the React Compiler forbids
  // impure calls (Date.now) in render, and a mount-time snapshot is all an
  // entry animation needs (JOURNEY 4.3's rule family).
  const [now] = useState(() => Date.now());

  // Day progress 0..1; clamps park the sun at the horizon outside daylight.
  const target = Math.min(
    Math.max((now - sun.sunrise) / Math.max(sun.sunset - sun.sunrise, 1), 0),
    1,
  );
  const beforeSunrise = now < sun.sunrise;
  const afterSunset = now > sun.sunset;

  const progress = useSharedValue(0);

  useEffect(() => {
    // Sweep from the horizon to now — a small moment of delight on entry.
    progress.set(withDelay(250, withTiming(target, { duration: 1100 })));
  }, [progress, target]);

  const sunProps = useAnimatedProps(() => {
    const angle = Math.PI * (1 - progress.get());
    return {
      cx: CX + R * Math.cos(angle),
      cy: BASE_Y - R * Math.sin(angle),
      // Below the horizon (parked at an end) the dot dims via opacity.
      opacity: beforeSunrise || afterSunset ? 0.35 : 1,
    };
  });

  return (
    <View className="items-center gap-1 rounded-lg border border-border bg-surface p-4">
      <Svg width={220} height={124} viewBox="0 0 200 112">
        {/* Day arc */}
        <Path
          d={`M ${CX - R} ${BASE_Y} A ${R} ${R} 0 0 1 ${CX + R} ${BASE_Y}`}
          stroke={colors.border}
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
        {/* Horizon */}
        <Line
          x1={CX - R - 8}
          y1={BASE_Y}
          x2={CX + R + 8}
          y2={BASE_Y}
          stroke={colors.border}
          strokeWidth={1}
        />
        {/* Horizon markers */}
        <Circle cx={CX - R} cy={BASE_Y} r={3} fill={colors.mutedForeground} />
        <Circle cx={CX + R} cy={BASE_Y} r={3} fill={colors.mutedForeground} />
        {/* The sun */}
        <AnimatedCircle animatedProps={sunProps} r={7} fill={colors.primary} />
      </Svg>
      <View className="w-full flex-row justify-between px-1">
        <View className="items-start">
          <Text variant="caption" color="muted">
            Sunrise
          </Text>
          <Text variant="label">{sun.sunriseLabel}</Text>
        </View>
        <View className="items-end">
          <Text variant="caption" color="muted">
            Sunset
          </Text>
          <Text variant="label">{sun.sunsetLabel}</Text>
        </View>
      </View>
      {beforeSunrise ? (
        <Text variant="caption" color="muted">
          The sun hasn&apos;t risen yet
        </Text>
      ) : null}
      {afterSunset ? (
        <Text variant="caption" color="muted">
          The sun has set for today
        </Text>
      ) : null}
    </View>
  );
}
