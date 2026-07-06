import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { StaleBadge, staleAgeLabel } from '@/components/shared/StaleBadge';
import { AqiTile, UvTile } from '@/features/weather/AirQualityTiles';
import { CurrentHeader } from '@/features/weather/CurrentHeader';
import { DailyList } from '@/features/weather/DailyList';
import { HourlyRail } from '@/features/weather/HourlyRail';
import { SunArc } from '@/features/weather/SunArc';
import { isAppError } from '@/services/errors';
import { useGetFullWeatherQuery } from '@/store/api';

function WeatherSkeleton() {
  return (
    <View className="gap-4 pt-2">
      <View className="items-center gap-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-md" />
        <Skeleton className="h-4 w-36 rounded-sm" />
      </View>
      <Skeleton className="h-32 w-full rounded-lg" />
      <View className="flex-row gap-2">
        <Skeleton className="h-28 w-20 rounded-lg" />
        <Skeleton className="h-28 w-20 rounded-lg" />
        <Skeleton className="h-28 w-20 rounded-lg" />
        <Skeleton className="h-28 w-20 rounded-lg" />
      </View>
      <Skeleton className="h-48 w-full rounded-lg" />
    </View>
  );
}

export default function DestinationWeather() {
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    lat?: string;
    lon?: string;
    tz?: string;
  }>();
  const lat = Number(params.lat);
  const lon = Number(params.lon);
  const timezone = params.tz ? params.tz : null;
  const cityName = params.name ?? 'Destination';
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  const { data, error, isLoading, refetch } = useGetFullWeatherQuery(
    { lat, lon, timezone },
    { skip: !hasCoords },
  );

  return (
    <Screen scroll>
      <View className="flex-row items-center gap-3 px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-12 w-12 items-center justify-center rounded-full bg-surface"
        >
          <Icon icon={ArrowLeft} accessibilityLabel="Back" />
        </Pressable>
        <Text variant="h2" className="flex-1" numberOfLines={1}>
          {cityName} weather
        </Text>
      </View>

      {!hasCoords ? (
        <ErrorState
          title="Missing location"
          message="Open this screen from a destination so it knows where to look."
        />
      ) : isLoading ? (
        <View className="px-4">
          <WeatherSkeleton />
        </View>
      ) : error || !data ? (
        <ErrorState
          title="Couldn't load the forecast"
          message={error && isAppError(error) ? error.userMessage : 'Please try again.'}
          onRetry={() => void refetch()}
        />
      ) : (
        <View className="gap-5 px-4 pb-6 pt-2">
          {data.isStale ? (
            <View className="flex-row items-center gap-2">
              <StaleBadge label="saved forecast" ageLabel={staleAgeLabel(data.fetchedAt)} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh forecast"
                hitSlop={12}
                onPress={() => void refetch()}
              >
                <Text variant="caption" color="primary">
                  Refresh
                </Text>
              </Pressable>
            </View>
          ) : null}

          <CurrentHeader current={data.current} />

          {data.sun ? <SunArc sun={data.sun} /> : null}

          <View className="gap-2">
            <Text variant="h3">Next 24 hours</Text>
            {data.hourly && data.hourly.length > 0 ? (
              <View style={{ height: 116 }}>
                <HourlyRail hourly={data.hourly} />
              </View>
            ) : (
              <Text variant="body-sm" color="muted">
                Hourly forecast unavailable.
              </Text>
            )}
          </View>

          <View className="gap-2">
            <Text variant="h3">5-day forecast</Text>
            {data.daily && data.daily.length > 0 ? (
              <DailyList daily={data.daily} />
            ) : (
              <Text variant="body-sm" color="muted">
                Daily forecast unavailable.
              </Text>
            )}
          </View>

          <View className="flex-row gap-3">
            <AqiTile aqi={data.aqi} />
            <UvTile uvMax={data.uvMax} />
          </View>
        </View>
      )}
    </Screen>
  );
}
