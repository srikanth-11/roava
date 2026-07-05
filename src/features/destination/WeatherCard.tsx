import { router } from 'expo-router';
import { Thermometer } from 'lucide-react-native';
import { View } from 'react-native';

import { SnapshotCard } from '@/components/shared/SnapshotCard';
import { Text } from '@/components/ui';
import { kindIcon } from '@/features/weather/kindIcon';
import { hapticLight } from '@/lib/haptics';
import { useGetWeatherQuery } from '@/store/api';

interface WeatherCardProps {
  destinationId: string;
  name: string;
  lat: number;
  lon: number;
  timezone: string | null;
}

export function WeatherCard({ destinationId, name, lat, lon, timezone }: WeatherCardProps) {
  const { data, error, isLoading, refetch } = useGetWeatherQuery({ lat, lon });

  const openForecast = () => {
    hapticLight();
    router.push({
      pathname: '/destination/[id]/weather',
      // Coords + tz ride along so the weather screen never refetches the city.
      params: { id: destinationId, name, lat: String(lat), lon: String(lon), tz: timezone ?? '' },
    });
  };

  return (
    <SnapshotCard
      icon={data ? kindIcon[data.kind] : Thermometer}
      title="Weather"
      state={isLoading ? 'loading' : error || !data ? 'error' : 'ready'}
      errorHint="Unavailable"
      onRetry={() => void refetch()}
      onPress={openForecast}
      accessibilityHint={`Opens the full forecast for ${name}`}
    >
      {data ? (
        <View className="gap-0.5">
          <Text variant="h3">{Math.round(data.tempC)}°C</Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            {data.description}
          </Text>
          <Text variant="caption" color="muted">
            feels {Math.round(data.feelsLikeC)}°
          </Text>
        </View>
      ) : null}
    </SnapshotCard>
  );
}
