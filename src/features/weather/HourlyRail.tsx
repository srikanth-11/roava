import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { kindIcon } from '@/features/weather/kindIcon';
import type { HourlyBucket } from '@/repositories/weather';

/** Next ~24h in 3-hour steps. Rain chance appears only when it matters (>20%). */
export function HourlyRail({ hourly }: { hourly: HourlyBucket[] }) {
  return (
    <FlashList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={hourly}
      keyExtractor={(h) => String(h.at)}
      ItemSeparatorComponent={() => <View className="w-2" />}
      renderItem={({ item }) => (
        <View className="w-20 items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-3">
          <Text variant="caption" color="muted">
            {item.hourLabel}
          </Text>
          <Icon icon={kindIcon[item.kind]} size={20} color="primary" />
          <Text variant="label">{Math.round(item.tempC)}°</Text>
          {item.popPct > 20 ? (
            <Text variant="caption" color="muted">
              {item.popPct}%
            </Text>
          ) : (
            <View className="h-4" />
          )}
        </View>
      )}
    />
  );
}
