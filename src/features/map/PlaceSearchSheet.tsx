import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MapPin, Search, type LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon, Input, Text } from '@/components/ui';
import { useSheetBackHandler } from '@/hooks/useSheetBackHandler';
import type { LatLon } from '@/lib/geo';
import { palette } from '@/lib/palette';
import type { GeoResult } from '@/services/geocode';
import { useGeocodePlacesQuery } from '@/store/api';

/** Non-search shortcut rendered above results (Your location, Choose on map…). */
export interface QuickOption {
  id: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

interface PlaceSearchSheetProps {
  /** Bias results toward the destination. */
  near: LatLon;
  onSelect: (result: GeoResult) => void;
  /** Sheet heading — defaults to the add-a-pin copy. */
  title?: string;
  quickOptions?: QuickOption[];
}

export const PlaceSearchSheet = forwardRef<BottomSheetModal, PlaceSearchSheetProps>(
  function PlaceSearchSheet({ near, onSelect, title = 'Find a place', quickOptions }, ref) {
    const { colorScheme } = useColorScheme();
    const colors = palette[colorScheme ?? 'light'];
    const onSheetChange = useSheetBackHandler();

    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');

    // Debounce keystrokes; the query arg's `signal` aborts superseded requests.
    useEffect(() => {
      const id = setTimeout(() => setDebounced(query.trim()), 400);
      return () => clearTimeout(id);
    }, [query]);

    const { data, isFetching, error } = useGeocodePlacesQuery(
      { query: debounced, lat: near.lat, lon: near.lon },
      { skip: debounced.length < 2 },
    );

    return (
      <BottomSheetModal
        ref={ref}
        onChange={onSheetChange}
        snapPoints={['75%']}
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4 pt-2">
            <Text variant="h3">{title}</Text>
            <Input
              label="Search"
              placeholder="Café, landmark, address…"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoFocus
              leftSlot={<Icon icon={Search} size={20} color="muted" />}
              accessibilityLabel="Search for a place"
            />

            {quickOptions && quickOptions.length > 0 ? (
              <View className="gap-1">
                {quickOptions.map((opt) => (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                    onPress={opt.onPress}
                    className="flex-row items-center gap-3 rounded-lg p-3 active:bg-border"
                  >
                    <Icon icon={opt.icon} size={20} color="primary" />
                    <Text variant="label">{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {debounced.length < 2 ? (
              <Text variant="body-sm" color="muted">
                Search for any place — then drop it on your map. Can’t find it? Close this and
                long-press the map to drop a pin anywhere.
              </Text>
            ) : isFetching ? (
              <View className="flex-row items-center gap-2 py-4">
                <ActivityIndicator color={colors.primary} />
                <Text variant="body-sm" color="muted">
                  Searching…
                </Text>
              </View>
            ) : error ? (
              <Text variant="body-sm" color="muted">
                Search is unavailable right now — long-press the map to drop a pin instead.
              </Text>
            ) : data && data.length > 0 ? (
              <View className="gap-1">
                {data.map((r) => (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${r.name}`}
                    onPress={() => onSelect(r)}
                    className="flex-row items-center gap-3 rounded-lg p-3 active:bg-border"
                  >
                    <Icon icon={MapPin} size={20} color="primary" />
                    <View className="flex-1">
                      <Text variant="label" numberOfLines={1}>
                        {r.name}
                      </Text>
                      {r.subtitle ? (
                        <Text variant="caption" color="muted" numberOfLines={1}>
                          {r.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text variant="body-sm" color="muted">
                No places found for “{debounced}”.
              </Text>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
