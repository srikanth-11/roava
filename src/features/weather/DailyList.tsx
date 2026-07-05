import { View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { kindIcon } from '@/features/weather/kindIcon';
import type { DailyForecast } from '@/repositories/weather';

/**
 * 5-day list with a comparative temp band per day: each bar spans that day's
 * min→max, positioned inside the week's overall range — hotter days visibly
 * sit further right.
 */
export function DailyList({ daily }: { daily: DailyForecast[] }) {
  const weekMin = Math.min(...daily.map((d) => d.minC));
  const weekMax = Math.max(...daily.map((d) => d.maxC));
  const span = Math.max(weekMax - weekMin, 1);

  return (
    <View className="gap-2">
      {daily.map((day) => {
        const left = ((day.minC - weekMin) / span) * 100;
        const width = Math.max(((day.maxC - day.minC) / span) * 100, 6);
        return (
          <View
            key={day.label}
            className="flex-row items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
          >
            <Text variant="label" className="w-24" numberOfLines={1}>
              {day.label}
            </Text>
            <Icon icon={kindIcon[day.kind]} size={20} color="primary" />
            <Text variant="caption" color="muted" className="w-8 text-right">
              {Math.round(day.minC)}°
            </Text>
            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <View
                className="h-full rounded-full bg-primary"
                style={{ marginLeft: `${left}%`, width: `${width}%` }}
              />
            </View>
            <Text variant="label" className="w-8 text-right">
              {Math.round(day.maxC)}°
            </Text>
            {day.partial ? (
              <Text variant="caption" color="muted">
                so far
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
