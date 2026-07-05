import { useEffect, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Text } from '@/components/ui';
import { palette } from '@/lib/palette';
import { useUpdateTripMutation } from '@/store/api';
import type { Trip } from '@/types/trip';

/** Free-form notes with a debounced autosave — no save button to forget. */
export function NotesSection({ trip }: { trip: Trip }) {
  const [updateTrip, { isLoading: saving }] = useUpdateTripMutation();
  const [draft, setDraft] = useState(trip.notes);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colorScheme } = useColorScheme();
  const colors = palette[colorScheme ?? 'light'];

  const dirty = draft !== trip.notes;

  const onChange = (text: string) => {
    setDraft(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void updateTrip({ tripId: trip.id, command: { kind: 'setNotes', notes: text } });
    }, 800);
  };

  // Flush the pending save when leaving the section.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <View className="gap-2">
        <TextInput
          multiline
          value={draft}
          onChangeText={onChange}
          placeholder="Confirmation numbers, addresses, that restaurant someone recommended…"
          placeholderTextColor={colors.mutedForeground}
          textAlignVertical="top"
          className="min-h-[240px] rounded-lg border border-border bg-surface p-4 font-body text-base text-foreground"
          accessibilityLabel="Trip notes"
        />
        <Text variant="caption" color="muted">
          {saving ? 'Saving…' : dirty ? 'Typing…' : 'Saved on this device'}
        </Text>
      </View>
    </ScrollView>
  );
}
