import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  Thermometer,
  type LucideIcon,
} from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { SnapshotCard } from '@/features/destination/SnapshotCard';
import type { WeatherKind } from '@/repositories/weather';
import { useGetWeatherQuery } from '@/store/api';

const kindIcon: Record<WeatherKind, LucideIcon> = {
  thunder: CloudLightning,
  rain: CloudRain,
  snow: CloudSnow,
  mist: CloudFog,
  clear: Sun,
  clouds: Cloud,
};

export function WeatherCard({ lat, lon }: { lat: number; lon: number }) {
  const { data, error, isLoading, refetch } = useGetWeatherQuery({ lat, lon });

  return (
    <SnapshotCard
      icon={data ? kindIcon[data.kind] : Thermometer}
      title="Weather"
      state={isLoading ? 'loading' : error || !data ? 'error' : 'ready'}
      errorHint="Unavailable"
      onRetry={() => void refetch()}
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
