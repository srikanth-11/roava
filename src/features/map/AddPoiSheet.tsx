import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { forwardRef, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Text } from '@/components/ui';
import { useSheetBackHandler } from '@/hooks/useSheetBackHandler';
import { palette } from '@/lib/palette';
import {
  CUSTOM_POI_CATEGORIES,
  CUSTOM_POI_CATEGORY_LABEL,
  type CustomPoiCategory,
} from '@/types/customPoi';

export interface AddPoiValues {
  name: string;
  category: CustomPoiCategory;
  note?: string;
}

interface AddPoiSheetProps {
  /** Bumped by the parent each time the sheet opens — reseeds the form. */
  seed: number;
  /** Prefilled name (from a search result); empty for long-press drops. */
  defaultName?: string;
  onSubmit: (values: AddPoiValues) => void;
  submitting: boolean;
}

export const AddPoiSheet = forwardRef<BottomSheetModal, AddPoiSheetProps>(function AddPoiSheet(
  { seed, defaultName, onSubmit, submitting },
  ref,
) {
  const { colorScheme } = useColorScheme();
  const colors = palette[colorScheme ?? 'light'];
  const onSheetChange = useSheetBackHandler();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CustomPoiCategory>('sight');
  const [note, setNote] = useState('');

  // Reseed every time the parent opens the sheet for a new pin.
  useEffect(() => {
    setName(defaultName ?? '');
    setCategory('sight');
    setNote('');
  }, [seed, defaultName]);

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), category, note: note.trim() || undefined });
  };

  return (
    <BottomSheetModal
      ref={ref}
      onChange={onSheetChange}
      snapPoints={['60%']}
      enableDynamicSizing={false}
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4 pt-2">
          <Text variant="h3">Add a place</Text>

          <Input
            label="Name"
            placeholder="Blue Tokai Coffee"
            value={name}
            onChangeText={setName}
            accessibilityLabel="Place name"
          />

          <View className="gap-1.5">
            <Text variant="label">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CUSTOM_POI_CATEGORIES.map((c) => (
                <Button
                  key={c}
                  label={CUSTOM_POI_CATEGORY_LABEL[c]}
                  size="sm"
                  variant={c === category ? 'primary' : 'outline'}
                  onPress={() => setCategory(c)}
                />
              ))}
            </View>
          </View>

          <Input
            label="Note (optional)"
            placeholder="Rooftop, best at sunset"
            value={note}
            onChangeText={setNote}
            accessibilityLabel="Note"
          />

          <Button
            label={submitting ? 'Saving…' : 'Save place'}
            onPress={submit}
            loading={submitting}
            disabled={!name.trim()}
            accessibilityHint="Saves this pin on your map"
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});
