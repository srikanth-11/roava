import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { DestinationCard } from '@/features/home/DestinationCard';
import { enterDownStagger } from '@/lib/motion';
import type { Destination } from '@/types/destination';

/** Must match DestinationCard's rail layout (w-40) + the gap-3 below. */
const CARD_WIDTH = 160;
const GAP = 12;
const STEP = CARD_WIDTH + GAP;
const ADVANCE_MS = 3500;
const TOUCH_PAUSE_MS = 8000;

/**
 * Auto-playing trending carousel. A plain snapping ScrollView, deliberately
 * not a virtualized list — ten small cards don't need FlashList, and
 * horizontal FlashList's width estimation was overlapping cards.
 *
 * Playback rules: advances one card every few seconds, wraps to the start,
 * pauses the moment the user touches it (their intent wins), only runs while
 * the Home tab is focused, and never runs when the OS asks for reduced motion.
 */
export function TrendingRail({ destinations }: { destinations: Destination[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const pausedUntilRef = useRef(0);
  const reduceMotion = useReducedMotion();

  // Focus gating, the Phase 11 pattern — no timers while the tab is away.
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (reduceMotion || !focused || destinations.length < 2) return;
    const id = setInterval(() => {
      if (Date.now() < pausedUntilRef.current) return;
      indexRef.current = (indexRef.current + 1) % destinations.length;
      scrollRef.current?.scrollTo({ x: indexRef.current * STEP, animated: true });
    }, ADVANCE_MS);
    return () => clearInterval(id);
  }, [reduceMotion, focused, destinations.length]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={STEP}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 16 }}
      onScrollBeginDrag={() => {
        pausedUntilRef.current = Date.now() + TOUCH_PAUSE_MS;
      }}
      onMomentumScrollEnd={(e) => {
        // Resync playback with wherever the user let go.
        indexRef.current = Math.round(e.nativeEvent.contentOffset.x / STEP);
        pausedUntilRef.current = Date.now() + TOUCH_PAUSE_MS;
      }}
    >
      <View className="flex-row gap-3">
        {destinations.map((item, index) => (
          <Animated.View key={item.id} entering={enterDownStagger(index)}>
            <DestinationCard destination={item} layout="rail" />
          </Animated.View>
        ))}
      </View>
    </ScrollView>
  );
}
