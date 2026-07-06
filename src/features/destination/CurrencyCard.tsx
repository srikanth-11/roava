import { Banknote } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { currencyForCountry } from '@/lib/currencies';
import { SnapshotCard } from '@/components/shared/SnapshotCard';
import { useAppSelector } from '@/hooks/useAppStore';
import { useGetCurrencyRateQuery } from '@/store/api';
import { selectHomeCurrency } from '@/store/settingsSlice';

function formatRate(rate: number): string {
  if (rate >= 100) return String(Math.round(rate));
  if (rate >= 1) return rate.toFixed(1);
  return rate.toFixed(3);
}

export function CurrencyCard({ countryCode }: { countryCode: string }) {
  const homeCurrency = useAppSelector(selectHomeCurrency);
  const destCurrency = currencyForCountry(countryCode);
  const sameCurrency = destCurrency === homeCurrency;

  const { data, error, isLoading, refetch } = useGetCurrencyRateQuery(
    { base: destCurrency ?? '', quote: homeCurrency },
    // No mapped currency (or nothing to convert) → never hit the API.
    { skip: !destCurrency || sameCurrency },
  );

  if (!destCurrency) {
    return <SnapshotCard icon={Banknote} title="Currency" state="error" errorHint="Unknown" />;
  }

  if (sameCurrency) {
    return (
      <SnapshotCard icon={Banknote} title="Currency" state="ready">
        <View className="gap-0.5">
          <Text variant="h3">{homeCurrency}</Text>
          <Text variant="caption" color="muted">
            same as home
          </Text>
        </View>
      </SnapshotCard>
    );
  }

  return (
    <SnapshotCard
      icon={Banknote}
      title="Currency"
      state={isLoading ? 'loading' : error || !data ? 'error' : 'ready'}
      errorHint="No rate"
      onRetry={() => void refetch()}
    >
      {data ? (
        <View className="gap-0.5">
          <Text variant="h3" numberOfLines={1} adjustsFontSizeToFit>
            1 {data.base}
          </Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            ≈ {formatRate(data.rate)} {data.quote}
          </Text>
          {data.isStale ? (
            <Text variant="caption" color="muted">
              saved rate
            </Text>
          ) : null}
        </View>
      ) : null}
    </SnapshotCard>
  );
}
