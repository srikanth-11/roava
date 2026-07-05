import { router } from 'expo-router';
import {
  Landmark,
  Map as MapIcon,
  MapPinned,
  Mountain,
  Palette,
  Sparkles,
  Trees,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, ErrorState, Icon, Skeleton, Text } from '@/components/ui';
import { isAppError } from '@/services/errors';
import type { Poi, PoiCategory } from '@/repositories/pois';
import { useGetNearbyPoisQuery } from '@/store/api';

const CATEGORY_META: Record<PoiCategory, { label: string; singular: string; icon: LucideIcon }> = {
  attraction: { label: 'Attractions', singular: 'Attraction', icon: Sparkles },
  museum: { label: 'Museums', singular: 'Museum', icon: Landmark },
  viewpoint: { label: 'Viewpoints', singular: 'Viewpoint', icon: Mountain },
  gallery: { label: 'Galleries', singular: 'Gallery', icon: Palette },
  park: { label: 'Parks', singular: 'Park', icon: Trees },
};

const CATEGORY_ORDER: PoiCategory[] = ['attraction', 'museum', 'viewpoint', 'gallery', 'park'];

export function PoiRow({ poi }: { poi: Poi }) {
  const meta = CATEGORY_META[poi.category];
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <View className="h-10 w-10 items-center justify-center rounded-md bg-primary/10">
        <Icon icon={meta.icon} color="primary" size={20} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label" numberOfLines={1}>
          {poi.name}
        </Text>
        <Text variant="caption" color="muted">
          {meta.singular}
        </Text>
      </View>
    </View>
  );
}

/**
 * Nearby sights via Overpass. ONE fetch per city — the chips filter locally,
 * so tapping around costs zero extra requests to the shared instance.
 */
export function PoiSection({
  destinationId,
  lat,
  lon,
  cityName,
}: {
  destinationId: string;
  lat: number;
  lon: number;
  cityName: string;
}) {
  const { data, error, isLoading, refetch } = useGetNearbyPoisQuery({ lat, lon });
  const [category, setCategory] = useState<'all' | PoiCategory>('all');

  const present = CATEGORY_ORDER.filter((c) => data?.some((p) => p.category === c));
  const filtered =
    category === 'all' ? (data ?? []) : (data ?? []).filter((p) => p.category === category);

  const openMap = () => {
    router.push({
      pathname: '/destination/[id]/map',
      params: { id: destinationId, name: cityName, lat: String(lat), lon: String(lon) },
    });
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text variant="h3">Things to see</Text>
        <Button
          label="Map"
          size="sm"
          variant="outline"
          icon={MapIcon}
          onPress={openMap}
          accessibilityHint={`Opens nearby sights around ${cityName} on a map`}
        />
      </View>

      {isLoading ? (
        <View className="gap-3">
          <View className="flex-row gap-2">
            <Skeleton className="h-9 w-16 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </View>
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </View>
      ) : null}

      {!isLoading && error ? (
        <ErrorState
          title="Couldn't load sights"
          message={isAppError(error) ? error.userMessage : 'Please try again.'}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !error && data ? (
        data.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="No sights mapped yet"
            message={`OpenStreetMap has no tagged attractions around ${cityName} — that's the honest answer, not an error.`}
          />
        ) : (
          <View className="gap-3">
            <View className="flex-row flex-wrap gap-2">
              <Button
                label="All"
                size="sm"
                variant={category === 'all' ? 'primary' : 'outline'}
                onPress={() => setCategory('all')}
              />
              {present.map((c) => (
                <Button
                  key={c}
                  label={CATEGORY_META[c].label}
                  size="sm"
                  variant={category === c ? 'primary' : 'outline'}
                  onPress={() => setCategory(c)}
                />
              ))}
            </View>
            <View className="gap-2">
              {filtered.map((poi) => (
                <PoiRow key={poi.id} poi={poi} />
              ))}
            </View>
          </View>
        )
      ) : null}
    </View>
  );
}
