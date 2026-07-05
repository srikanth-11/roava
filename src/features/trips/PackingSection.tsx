import { CheckSquare, Plus, Square, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, EmptyState, Icon, Input, Text } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import { useUpdateTripMutation } from '@/store/api';
import type { Trip } from '@/types/trip';

export function PackingSection({ trip }: { trip: Trip }) {
  const [updateTrip] = useUpdateTripMutation();
  const [label, setLabel] = useState('');

  const packed = trip.packing.filter((p) => p.packed).length;

  const add = () => {
    if (!label.trim()) return;
    void updateTrip({ tripId: trip.id, command: { kind: 'addPacking', label: label.trim() } });
    setLabel('');
  };

  const toggle = (itemId: string) => {
    hapticLight();
    void updateTrip({ tripId: trip.id, command: { kind: 'togglePacking', itemId } });
  };

  const remove = (itemId: string) => {
    void updateTrip({ tripId: trip.id, command: { kind: 'deletePacking', itemId } });
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        <View className="flex-row items-end gap-2">
          <Input
            className="flex-1"
            label={
              trip.packing.length > 0
                ? `Packing — ${packed}/${trip.packing.length} packed`
                : 'Packing list'
            }
            placeholder="Passport"
            value={label}
            onChangeText={setLabel}
            onSubmitEditing={add}
            returnKeyType="done"
            accessibilityLabel="New packing item"
          />
          <Button label="Add" icon={Plus} onPress={add} disabled={!label.trim()} />
        </View>

        {trip.packing.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Nothing on the list"
            message="Passport, chargers, that adapter you always forget…"
          />
        ) : (
          <View className="gap-2">
            {trip.packing.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.packed }}
                  accessibilityLabel={item.label}
                  hitSlop={10}
                  onPress={() => toggle(item.id)}
                  className="flex-1 flex-row items-center gap-3"
                >
                  <Icon
                    icon={item.packed ? CheckSquare : Square}
                    color={item.packed ? 'success' : 'muted'}
                  />
                  <Text
                    variant="body"
                    color={item.packed ? 'muted' : 'default'}
                    className={item.packed ? 'line-through' : ''}
                  >
                    {item.label}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.label}`}
                  hitSlop={10}
                  onPress={() => remove(item.id)}
                >
                  <Icon icon={Trash2} size={16} color="muted" accessibilityLabel="Delete" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
