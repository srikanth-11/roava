import { router } from 'expo-router';
import { CloudSun, Compass, Map, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { Button, Icon, Screen, Text } from '@/components/ui';
import { storage, StorageKeys } from '@/lib/storage';

interface Slide {
  icon: LucideIcon;
  title: string;
  message: string;
}

const SLIDES: Slide[] = [
  {
    icon: Compass,
    title: 'Discover the world',
    message: 'Trending destinations, hidden gems, and places picked for the way you travel.',
  },
  {
    icon: Map,
    title: 'Plan every step',
    message: 'Itineraries, budgets, and packing lists — all in one place, even offline.',
  },
  {
    icon: CloudSun,
    title: 'Travel smarter',
    message: 'Live weather, flight tracking, and currency conversion wherever you go.',
  },
];

function Dot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: { get(): number };
  width: number;
}) {
  const style = useAnimatedStyle(() => {
    const position = scrollX.get() / width;
    return {
      width: interpolate(position, [index - 1, index, index + 1], [8, 24, 8], 'clamp'),
      opacity: interpolate(position, [index - 1, index, index + 1], [0.35, 1, 0.35], 'clamp'),
    };
  });

  return <Animated.View style={style} className="h-2 rounded-full bg-primary" />;
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollX = useSharedValue(0);
  const [page, setPage] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  const finish = () => {
    void storage.setString(StorageKeys.onboardingDone, 'true');
    router.replace('/sign-in');
  };

  const isLast = page === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      finish();
    } else {
      pagerRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    }
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View className="items-end px-4 pt-2">
        <Button label="Skip" variant="ghost" size="sm" onPress={finish} />
      </View>

      <Animated.ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.title}
            style={{ width }}
            className="items-center justify-center gap-6 px-10"
          >
            <View className="h-32 w-32 items-center justify-center rounded-full bg-primary/10">
              <Icon icon={slide.icon} size={48} color="primary" />
            </View>
            <Text variant="h1" className="text-center">
              {slide.title}
            </Text>
            <Text variant="body" color="muted" className="text-center">
              {slide.message}
            </Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View className="gap-6 px-8 pb-6">
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((s, i) => (
            <Dot key={s.title} index={i} scrollX={scrollX} width={width} />
          ))}
        </View>
        <Button label={isLast ? 'Get started' : 'Next'} onPress={next} size="lg" />
      </View>
    </Screen>
  );
}
