import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { CalendarDays, Luggage, Plus } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';

import { Button, EmptyState, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { CreateTripSheet, type CreateTripForm } from '@/features/trips/CreateTripSheet';
import { hapticSuccess } from '@/lib/haptics';
import { isAppError } from '@/services/errors';
import { useCreateTripMutation, useGetTripsQuery } from '@/store/api';
import { tripDayCount, type Trip } from '@/types/trip';

function formatRange(trip: Trip): string {
  const days = tripDayCount(trip);
  return `${trip.startDate} → ${trip.endDate} · ${days} day${days === 1 ? '' : 's'}`;
}

function TripRow({ trip }: { trip: Trip }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open trip ${trip.name}`}
      onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } })}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-4 active:opacity-90"
    >
      <View className="h-11 w-11 items-center justify-center rounded-md bg-primary/10">
        <Icon icon={Luggage} color="primary" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="h3" numberOfLines={1}>
          {trip.name}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Icon icon={CalendarDays} size={16} color="muted" />
          <Text variant="caption" color="muted" numberOfLines={1}>
            {formatRange(trip)}
          </Text>
        </View>
        {trip.destinationName ? (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {trip.destinationName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function TripsScreen() {
  const { data, error, isLoading, refetch } = useGetTripsQuery();
  const [createTrip, { isLoading: creating }] = useCreateTripMutation();
  const sheetRef = useRef<BottomSheetModal>(null);

  const onCreate = (values: CreateTripForm) => {
    void createTrip({
      name: values.name,
      destinationName: values.destinationName || undefined,
      startDate: values.startDate,
      endDate: values.endDate,
    })
      .unwrap()
      .then((trip) => {
        hapticSuccess();
        sheetRef.current?.dismiss();
        router.push({ pathname: '/trip/[id]', params: { id: trip.id } });
      })
      .catch(() => {
        // Mutation errors surface via the hook state; the sheet stays open.
      });
  };

  return (
    <Screen>
      <View className="flex-1 gap-4 px-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Trips</Text>
          <Button
            label="New trip"
            size="sm"
            icon={Plus}
            onPress={() => sheetRef.current?.present()}
            accessibilityHint="Opens the new trip form"
          />
        </View>

        {isLoading ? (
          <View className="gap-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </View>
        ) : error ? (
          <ErrorState
            title="Couldn't load trips"
            message={isAppError(error) ? error.userMessage : 'Please try again.'}
            onRetry={() => void refetch()}
          />
        ) : data && data.length > 0 ? (
          <FlashList
            data={data}
            keyExtractor={(t) => t.id}
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item }) => <TripRow trip={item} />}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        ) : (
          <EmptyState
            icon={Luggage}
            title="No trips yet"
            message="Plan your next adventure — trips live entirely on this device and work with no connection at all."
            actionLabel="Plan a trip"
            onAction={() => sheetRef.current?.present()}
          />
        )}
      </View>

      <CreateTripSheet ref={sheetRef} onSubmit={onCreate} submitting={creating} />
    </Screen>
  );
}
