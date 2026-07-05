import { useLocalSearchParams } from 'expo-router';
import { Share, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { Badge, ErrorState, Screen, Skeleton } from '@/components/ui';
import { CurrencyCard } from '@/features/destination/CurrencyCard';
import { LocalTimeCard } from '@/features/destination/LocalTimeCard';
import { ParallaxHero, HERO_HEIGHT } from '@/features/destination/ParallaxHero';
import { PoiSection } from '@/features/destination/PoiSection';
import { WeatherCard } from '@/features/destination/WeatherCard';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { hapticLight } from '@/lib/haptics';
import { isAppError } from '@/services/errors';
import { useGetDestinationByIdQuery } from '@/store/api';
import { favoriteToggled, selectIsFavorite } from '@/store/favoritesSlice';

function DetailSkeleton() {
  return (
    <View>
      <View style={{ height: HERO_HEIGHT }} className="bg-border" />
      <View className="gap-4 px-4 pt-4">
        <View className="flex-row gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </View>
        <View className="flex-row gap-3">
          <Skeleton className="h-28 flex-1 rounded-lg" />
          <Skeleton className="h-28 flex-1 rounded-lg" />
          <Skeleton className="h-28 flex-1 rounded-lg" />
        </View>
        <Skeleton className="h-7 w-36 rounded-md" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </View>
    </View>
  );
}

export default function DestinationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const destinationId = String(id ?? '');

  const { data, error, isLoading, refetch } = useGetDestinationByIdQuery(destinationId, {
    skip: !destinationId,
  });
  const dispatch = useAppDispatch();
  const isFavorite = useAppSelector((s) => selectIsFavorite(s, destinationId));

  // Scroll position feeds the hero's parallax. `.set()` in the worklet — the
  // React Compiler forbids `.value` writes (JOURNEY 4.3).
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  if (isLoading) {
    return (
      <Screen edges={['left', 'right']}>
        <DetailSkeleton />
      </Screen>
    );
  }

  if (error || !data) {
    // The city lookup is the screen's backbone — with no coords, no section
    // can render. This is the ONE full-screen failure on this screen.
    return (
      <Screen>
        <ErrorState
          title="Couldn't load destination"
          message={error && isAppError(error) ? error.userMessage : 'Please try again.'}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  const toggleFavorite = () => {
    hapticLight();
    dispatch(
      favoriteToggled({
        id: data.id,
        name: data.name,
        country: data.country,
        imageUrl: data.imageUrl,
        photoCredit: data.photoCredit,
      }),
    );
  };

  const share = () => {
    void Share.share({
      message: `Check out ${data.name}, ${data.country} on Roava → roava://destination/${data.id}`,
    }).catch(() => {
      // User dismissed the sheet or no share targets — never an error.
    });
  };

  return (
    <Screen edges={['left', 'right']}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ParallaxHero
          detail={data}
          scrollY={scrollY}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          onShare={share}
        />

        <View className="gap-6 px-4 pt-4">
          <View className="flex-row flex-wrap gap-2">
            {data.population ? (
              <Badge
                label={`${(data.population / 1_000_000).toFixed(1)}M people`}
                variant="outline"
              />
            ) : null}
            {data.timezone ? <Badge label={data.timezone} variant="outline" /> : null}
          </View>

          {/* Snapshot row — three cards, three providers, three independent fates. */}
          <View className="flex-row gap-3">
            <WeatherCard
              destinationId={data.id}
              name={data.name}
              lat={data.latitude}
              lon={data.longitude}
              timezone={data.timezone}
            />
            <LocalTimeCard timezone={data.timezone} />
            <CurrencyCard countryCode={data.countryCode} />
          </View>

          <PoiSection lat={data.latitude} lon={data.longitude} cityName={data.name} />
        </View>
      </Animated.ScrollView>
    </Screen>
  );
}
