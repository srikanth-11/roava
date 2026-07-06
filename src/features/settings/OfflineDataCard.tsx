import { HardDrive, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, Card, Icon, Text } from '@/components/ui';
import { hapticSuccess } from '@/lib/haptics';
import { storage } from '@/lib/storage';

/**
 * Cache inventory + surgical clear. Only RE-DOWNLOADABLE prefixes are listed
 * and cleared — trips, favorites, settings, session, search history, and
 * onboarding flags are user data and NEVER touched here.
 */
const CACHE_BUCKETS = [
  { label: 'Destination photos', prefixes: ['roava.image-cache.'] },
  { label: 'Saved destination details', prefixes: ['roava.dest-snapshot.'] },
  { label: 'Weather forecasts', prefixes: ['roava.weather.'] },
  { label: 'Exchange rates', prefixes: ['roava.fx.', 'roava.fx-table.'] },
  { label: 'Trending feed', prefixes: ['roava.state.cache'] },
] as const;

interface BucketCount {
  label: string;
  count: number;
}

function countBuckets(keys: string[]): BucketCount[] {
  return CACHE_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: keys.filter((k) => bucket.prefixes.some((p) => k.startsWith(p))).length,
  }));
}

export function OfflineDataCard() {
  const [buckets, setBuckets] = useState<BucketCount[]>([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    let live = true;
    storage
      .getAllKeys()
      .then((keys) => {
        if (live) setBuckets(countBuckets(keys));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const totalItems = buckets.reduce((sum, b) => sum + b.count, 0);

  const clearCaches = async () => {
    setClearing(true);
    const keys = await storage.getAllKeys();
    const doomed = keys.filter((k) =>
      CACHE_BUCKETS.some((b) => b.prefixes.some((p) => k.startsWith(p))),
    );
    await Promise.all(doomed.map((k) => storage.delete(k)));
    setBuckets(countBuckets(await storage.getAllKeys()));
    setClearing(false);
    hapticSuccess();
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear cached data?',
      'Photos, saved details, forecasts, and rates will re-download when you are back online. Trips, favorites, and settings are not touched.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => void clearCaches() },
      ],
    );
  };

  return (
    <Card>
      <View className="mb-3 flex-row items-center gap-2">
        <Icon icon={HardDrive} color="muted" />
        <Text variant="h3">Offline data</Text>
      </View>

      <View className="gap-1.5">
        {buckets.map((b) => (
          <View key={b.label} className="flex-row items-center justify-between">
            <Text variant="body-sm" color="muted">
              {b.label}
            </Text>
            <Text variant="body-sm">{b.count}</Text>
          </View>
        ))}
      </View>

      <View className="mt-4">
        <Button
          label={clearing ? 'Clearing…' : 'Clear cached data'}
          variant="outline"
          size="sm"
          icon={Trash2}
          onPress={confirmClear}
          disabled={clearing || totalItems === 0}
          accessibilityHint="Deletes re-downloadable caches. Trips, favorites, and settings are kept."
        />
      </View>
    </Card>
  );
}
