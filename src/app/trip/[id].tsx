import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarDays, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { BudgetSection } from '@/features/trips/BudgetSection';
import { ItinerarySection } from '@/features/trips/ItinerarySection';
import { NotesSection } from '@/features/trips/NotesSection';
import { PackingSection } from '@/features/trips/PackingSection';
import { isAppError } from '@/services/errors';
import { useDeleteTripMutation, useGetTripQuery } from '@/store/api';
import { tripDayCount } from '@/types/trip';

const SECTIONS = ['Itinerary', 'Budget', 'Packing', 'Notes'] as const;
type Section = (typeof SECTIONS)[number];

export default function TripDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? '');

  const { data: trip, error, isLoading, refetch } = useGetTripQuery(id, { skip: !id });
  const [deleteTrip] = useDeleteTripMutation();
  const [section, setSection] = useState<Section>('Itinerary');

  const confirmDelete = () => {
    if (!trip) return;
    Alert.alert('Delete trip?', `“${trip.name}” and everything in it will be gone for good.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteTrip(trip.id)
            .unwrap()
            .then(() => router.back());
        },
      },
    ]);
  };

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
          <View className="flex-1">
            <Text variant="h2" numberOfLines={1}>
              {trip?.name ?? 'Trip'}
            </Text>
            {trip ? (
              <View className="flex-row items-center gap-1.5">
                <Icon icon={CalendarDays} size={16} color="muted" />
                <Text variant="caption" color="muted">
                  {trip.startDate} → {trip.endDate} · {tripDayCount(trip)} days
                  {trip.destinationName ? ` · ${trip.destinationName}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
          {trip ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete trip ${trip.name}`}
              hitSlop={8}
              onPress={confirmDelete}
              className="h-12 w-12 items-center justify-center rounded-full bg-surface"
            >
              <Icon icon={Trash2} color="destructive" accessibilityLabel="Delete trip" />
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <View className="gap-3">
            <Skeleton className="h-10 w-64 rounded-md" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </View>
        ) : error ? (
          <ErrorState
            title="Couldn't load this trip"
            message={isAppError(error) ? error.userMessage : 'Please try again.'}
            onRetry={() => void refetch()}
          />
        ) : !trip ? (
          <ErrorState
            title="Trip not found"
            message="It may have been deleted on this device."
            retryLabel="Back to trips"
            onRetry={() => router.back()}
          />
        ) : (
          <>
            <View className="flex-row flex-wrap gap-2">
              {SECTIONS.map((s) => (
                <Button
                  key={s}
                  label={s}
                  size="sm"
                  variant={s === section ? 'primary' : 'outline'}
                  onPress={() => setSection(s)}
                />
              ))}
            </View>

            <View className="flex-1">
              {section === 'Itinerary' ? <ItinerarySection trip={trip} /> : null}
              {section === 'Budget' ? <BudgetSection trip={trip} /> : null}
              {section === 'Packing' ? <PackingSection trip={trip} /> : null}
              {section === 'Notes' ? <NotesSection trip={trip} /> : null}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
