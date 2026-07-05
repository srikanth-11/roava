import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ArrowLeft, Plane, Radar } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { EmptyState, ErrorState, Icon, Input, Screen, Skeleton, Text } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import type { Flight } from '@/repositories/flights';
import { isAppError } from '@/services/errors';
import { useSearchFlightsQuery } from '@/store/api';

function FlightRow({ flight }: { flight: Flight }) {
  const open = () => {
    router.push({
      pathname: '/flights/[icao24]',
      params: {
        icao24: flight.icao24,
        callsign: flight.callsign,
        lat: flight.lat !== null ? String(flight.lat) : '',
        lon: flight.lon !== null ? String(flight.lon) : '',
      },
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Track flight ${flight.callsign}`}
      onPress={open}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3 active:opacity-90"
    >
      <View className="h-10 w-10 items-center justify-center rounded-md bg-primary/10">
        <Icon icon={Plane} color="primary" size={20} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="label">{flight.callsign}</Text>
        <Text variant="caption" color="muted" numberOfLines={1}>
          {flight.originCountry}
          {flight.onGround ? ' · on ground' : ''}
        </Text>
      </View>
      <View className="items-end gap-0.5">
        {flight.altitudeM !== null && !flight.onGround ? (
          <Text variant="caption" color="muted">
            {Math.round(flight.altitudeM)} m
          </Text>
        ) : null}
        {flight.velocityMs !== null ? (
          <Text variant="caption" color="muted">
            {Math.round(flight.velocityMs * 3.6)} km/h
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function FlightsScreen() {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 600);
  const active = debounced.trim().length >= 2;

  const { data, error, isLoading, isFetching, refetch } = useSearchFlightsQuery(debounced, {
    skip: !active,
  });

  return (
    <Screen>
      <View className="flex-1 gap-4 px-4 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface"
          >
            <Icon icon={ArrowLeft} accessibilityLabel="Back" />
          </Pressable>
          <Text variant="h2" className="flex-1">
            Flights
          </Text>
        </View>

        <Input
          label="Callsign"
          placeholder="e.g. UAL, BAW117, AIC"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          autoCorrect={false}
          helperText="Live aircraft, searched by callsign prefix."
          accessibilityLabel="Flight callsign search"
        />

        {!active ? (
          <EmptyState
            icon={Radar}
            title="Track a live flight"
            message="Type at least two characters of a callsign — the airline code (UAL, BAW, AIC…) is a good start."
          />
        ) : isLoading || isFetching ? (
          <View className="gap-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </View>
        ) : error ? (
          <ErrorState
            title="Couldn't reach the network"
            message={isAppError(error) ? error.userMessage : 'Please try again.'}
            onRetry={() => void refetch()}
          />
        ) : data && data.flights.length > 0 ? (
          <View className="flex-1">
            <Text variant="caption" color="muted" className="mb-2">
              {data.flights.length} aircraft · positions {Math.round(data.snapshotAge / 1000)}s old
            </Text>
            <FlashList
              data={data.flights}
              keyExtractor={(f) => f.icao24}
              ItemSeparatorComponent={() => <View className="h-2" />}
              renderItem={({ item }) => <FlightRow flight={item} />}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        ) : (
          <EmptyState
            icon={Radar}
            title="Not visible to the network"
            message={`No airborne aircraft matches “${debounced.trim().toUpperCase()}” right now. ADS-B coverage has gaps over oceans and at low altitude — the flight may exist without being visible.`}
          />
        )}
      </View>
    </Screen>
  );
}
