import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { History, Search as SearchIcon, SearchX, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, ErrorState, Icon, Input, Screen, Skeleton, Text } from '@/components/ui';
import { FiltersSheet, POPULATION_OPTIONS } from '@/features/search/FiltersSheet';
import { SearchResultRow } from '@/features/search/SearchResultRow';
import { useDebounce } from '@/hooks/useDebounce';
import { hapticLight } from '@/lib/haptics';
import { BOTTOM_GAP } from '@/lib/layout';
import {
  addToSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  type HistoryEntry,
} from '@/repositories/search';
import { isAppError } from '@/services/errors';
import { useSearchDestinationsQuery } from '@/store/api';
import type { Destination } from '@/types/destination';

const MIN_QUERY_LENGTH = 2;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [minPopulation, setMinPopulation] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const sheetRef = useRef<BottomSheetModal>(null);

  const debouncedQuery = useDebounce(query.trim(), 600);
  const active = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, error, isFetching } = useSearchDestinationsQuery(
    { query: debouncedQuery, minPopulation },
    { skip: !active },
  );

  useFocusEffect(
    useCallback(() => {
      void getSearchHistory().then(setHistory);
    }, []),
  );

  const openDestination = (destination: Destination) => {
    void addToSearchHistory({
      id: destination.id,
      name: destination.name,
      country: destination.country,
    }).then(setHistory);
    router.push({ pathname: '/destination/[id]', params: { id: destination.id } });
  };

  const activeFilter = POPULATION_OPTIONS.find((o) => o.value === minPopulation);

  return (
    <Screen>
      <View className="gap-3 px-4 pt-4">
        <Text variant="h1">Search</Text>
        <Input
          label="Destination"
          placeholder="Try “Paris” or “Tokyo”…"
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          value={query}
          onChangeText={setQuery}
          leftSlot={<Icon icon={SearchIcon} size={20} color="muted" />}
          rightSlot={
            query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={() => setQuery('')}
              >
                <Icon icon={X} size={20} color="muted" accessibilityLabel="Clear" />
              </Pressable>
            ) : undefined
          }
        />
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open filters"
            onPress={() => {
              hapticLight();
              sheetRef.current?.present();
            }}
            className="h-10 flex-row items-center gap-2 rounded-full border border-border px-4 active:opacity-80"
          >
            <Icon icon={SlidersHorizontal} size={16} color="default" />
            <Text variant="label">Filters</Text>
          </Pressable>
          {minPopulation > 0 && activeFilter ? (
            <Badge label={`Population ${activeFilter.label}`} variant="default" />
          ) : null}
        </View>
      </View>

      {!active ? (
        <View className="flex-1 px-0 pt-6">
          {history.length > 0 ? (
            <>
              <View className="flex-row items-center justify-between px-4 pb-2">
                <Text variant="h3" color="muted">
                  Recent
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search history"
                  hitSlop={8}
                  onPress={() => {
                    void clearSearchHistory().then(() => setHistory([]));
                  }}
                >
                  <Text variant="label" color="primary">
                    Clear
                  </Text>
                </Pressable>
              </View>
              {history.map((h) => (
                <Pressable
                  key={h.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Search again: ${h.name}`}
                  onPress={() => setQuery(h.name)}
                  className="flex-row items-center gap-3 px-4 py-3 active:bg-surface"
                >
                  <Icon icon={History} size={16} color="muted" />
                  <View className="flex-1">
                    <Text variant="label">{h.name}</Text>
                    <Text variant="caption" color="muted">
                      {h.country}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </>
          ) : (
            <View className="items-center gap-2 px-8 pt-16">
              <Icon icon={SearchIcon} size={24} color="muted" />
              <Text variant="body-sm" color="muted" className="text-center">
                Search any city — results appear as you type.
              </Text>
            </View>
          )}
        </View>
      ) : isFetching ? (
        <View className="gap-2 px-4 pt-6">
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </View>
      ) : error ? (
        <ErrorState
          title={
            isAppError(error) && error.kind === 'rate-limit' ? 'Typing fast!' : 'Search failed'
          }
          message={isAppError(error) ? error.userMessage : 'Please try again.'}
        />
      ) : (
        <FlashList
          data={data ?? []}
          keyExtractor={(d) => d.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 12, paddingBottom: BOTTOM_GAP }}
          renderItem={({ item }) => (
            <SearchResultRow destination={item} query={debouncedQuery} onPress={openDestination} />
          )}
          ListEmptyComponent={
            <View className="items-center gap-2 px-8 pt-16">
              <Icon icon={SearchX} size={24} color="muted" />
              <Text variant="body-sm" color="muted" className="text-center">
                No cities match “{debouncedQuery}”
                {minPopulation > 0 ? ' with that population filter.' : '.'}
              </Text>
            </View>
          }
        />
      )}

      <FiltersSheet ref={sheetRef} minPopulation={minPopulation} onChange={setMinPopulation} />
    </Screen>
  );
}
