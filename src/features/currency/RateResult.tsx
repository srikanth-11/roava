import { View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import type { RateTable } from '@/repositories/currency';

function ageLabel(fetchedAt: number): string {
  const mins = Math.round((Date.now() - fetchedAt) / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

interface RateResultProps {
  amount: number;
  base: string;
  quote: string;
  table: RateTable;
}

/** The converted figure — plus the truth about the rate behind it. */
export function RateResult({ amount, base, quote, table }: RateResultProps) {
  const rate = table.rates[quote];

  if (rate === undefined) {
    return (
      <Text variant="body-sm" color="muted">
        No {quote} rate in the {base} table.
      </Text>
    );
  }

  return (
    <View className="items-center gap-1 py-2">
      <Text variant="display" numberOfLines={1} adjustsFontSizeToFit>
        {formatMoney(amount * rate, quote)}
      </Text>
      <Text variant="caption" color="muted">
        1 {base} = {rate >= 100 ? Math.round(rate) : rate.toFixed(rate >= 1 ? 2 : 4)} {quote} · 1{' '}
        {quote} = {(1 / rate).toFixed(1 / rate >= 1 ? 2 : 4)} {base}
      </Text>
      <View className="mt-1 flex-row items-center gap-2">
        {table.isStale ? <Badge label="saved rate" variant="warning" /> : null}
        <Text variant="caption" color="muted">
          rates from {ageLabel(table.fetchedAt)}
        </Text>
      </View>
    </View>
  );
}
