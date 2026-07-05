import { Clock, GripVertical, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';

import { Button, EmptyState, Icon, Input, Text } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import { useUpdateTripMutation } from '@/store/api';
import { tripDayCount, type ItineraryItem, type Trip } from '@/types/trip';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Day-by-day plan with long-press drag-reorder. One DraggableFlatList per
 * selected day — it owns the scrolling (nesting it in a ScrollView would
 * fight the drag gesture).
 */
export function ItinerarySection({ trip }: { trip: Trip }) {
  const [updateTrip] = useUpdateTripMutation();
  const [dayIndex, setDayIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');

  const days = tripDayCount(trip);
  const items = trip.itinerary
    .filter((i) => i.dayIndex === dayIndex)
    .sort((a, b) => a.order - b.order);

  const timeInvalid = time.length > 0 && !TIME_RE.test(time);

  const add = () => {
    if (!title.trim() || timeInvalid) return;
    void updateTrip({
      tripId: trip.id,
      command: {
        kind: 'addItinerary',
        dayIndex,
        title: title.trim(),
        time: time || undefined,
      },
    });
    setTitle('');
    setTime('');
  };

  const remove = (itemId: string) => {
    void updateTrip({ tripId: trip.id, command: { kind: 'deleteItinerary', itemId } });
  };

  const onDragEnd = (ordered: ItineraryItem[]) => {
    hapticLight();
    void updateTrip({
      tripId: trip.id,
      command: { kind: 'reorderItinerary', dayIndex, orderedIds: ordered.map((i) => i.id) },
    });
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ItineraryItem>) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.time ? ` at ${item.time}` : ''}. Long-press to reorder.`}
      onLongPress={() => {
        hapticLight();
        drag();
      }}
      delayLongPress={200}
      className={`mb-2 flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3 ${
        isActive ? 'opacity-90' : ''
      }`}
    >
      <Icon icon={GripVertical} size={16} color="muted" />
      {item.time ? (
        <View className="w-14 items-center rounded-sm bg-primary/10 py-1">
          <Text variant="caption" color="primary">
            {item.time}
          </Text>
        </View>
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text variant="label" numberOfLines={2}>
          {item.title}
        </Text>
        {item.note ? (
          <Text variant="caption" color="muted" numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.title}`}
        hitSlop={10}
        onPress={() => remove(item.id)}
      >
        <Icon icon={Trash2} size={16} color="muted" accessibilityLabel="Delete" />
      </Pressable>
    </Pressable>
  );

  return (
    <View className="flex-1 gap-3">
      <View className="flex-row flex-wrap gap-2">
        {Array.from({ length: days }, (_, d) => (
          <Button
            key={d}
            label={`Day ${d + 1}`}
            size="sm"
            variant={d === dayIndex ? 'primary' : 'outline'}
            onPress={() => setDayIndex(d)}
          />
        ))}
      </View>

      <View className="flex-row items-end gap-2">
        <Input
          className="flex-1"
          label="Add to this day"
          placeholder="Fushimi Inari at sunrise"
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="New itinerary item"
        />
        <Input
          className="w-24"
          label="Time"
          placeholder="09:30"
          value={time}
          onChangeText={setTime}
          errorText={timeInvalid ? 'HH:MM' : undefined}
          accessibilityLabel="Optional time, 24 hour"
        />
        <Button
          label="Add"
          icon={Plus}
          onPress={add}
          disabled={!title.trim() || timeInvalid}
          accessibilityHint={`Adds to day ${dayIndex + 1}`}
        />
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={`Day ${dayIndex + 1} is open`}
          message="Add the first stop — long-press any item later to reorder the day."
        />
      ) : (
        <DraggableFlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          onDragEnd={({ data }) => onDragEnd(data)}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
