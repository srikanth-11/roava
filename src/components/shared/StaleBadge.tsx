import { View } from 'react-native';

import { Badge, Text } from '@/components/ui';

/**
 * The one voice for "this is saved data, not live" — warning-variant badge,
 * optional age caption. If a surface can't say WHEN the data is from, it can
 * at least say WHAT it is.
 */

/** "updated 12 min ago" / "updated 3 hours ago" — for the age caption. */
export function staleAgeLabel(fetchedAt: number): string {
  const mins = Math.round((Date.now() - fetchedAt) / 60_000);
  if (mins < 60) return `updated ${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? 'updated 1 hour ago' : `updated ${hours} hours ago`;
}

interface StaleBadgeProps {
  /** Badge text — defaults to the generic "saved data". */
  label?: string;
  /** Optional caption after the badge (e.g. from staleAgeLabel). */
  ageLabel?: string;
}

export function StaleBadge({ label = 'saved data', ageLabel }: StaleBadgeProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Badge label={label} variant="warning" />
      {ageLabel ? (
        <Text variant="caption" color="muted">
          {ageLabel}
        </Text>
      ) : null}
    </View>
  );
}
