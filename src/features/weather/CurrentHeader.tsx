import { Droplets, Wind } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { kindIcon } from '@/features/weather/kindIcon';
import type { WeatherSnapshot } from '@/repositories/weather';

/** Big current-conditions block. `current` may be null — its absence is quiet. */
export function CurrentHeader({ current }: { current: WeatherSnapshot | null }) {
  if (!current) {
    return (
      <Text variant="body-sm" color="muted">
        Current conditions unavailable — forecast below.
      </Text>
    );
  }

  return (
    <View className="items-center gap-1 py-2">
      <Icon icon={kindIcon[current.kind]} size={48} color="primary" />
      <Text variant="display">{Math.round(current.tempC)}°C</Text>
      <Text variant="body" color="muted" className="capitalize">
        {current.description}
      </Text>
      <View className="mt-2 flex-row items-center gap-5">
        <Text variant="caption" color="muted">
          feels {Math.round(current.feelsLikeC)}°
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon icon={Droplets} size={16} color="muted" />
          <Text variant="caption" color="muted">
            {current.humidityPct}%
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Icon icon={Wind} size={16} color="muted" />
          <Text variant="caption" color="muted">
            {Math.round(current.windMs * 3.6)} km/h
          </Text>
        </View>
      </View>
    </View>
  );
}
