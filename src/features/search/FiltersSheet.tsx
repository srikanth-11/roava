import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { forwardRef } from 'react';
import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { palette } from '@/lib/palette';

export interface PopulationOption {
  label: string;
  value: number;
}

export const POPULATION_OPTIONS: PopulationOption[] = [
  { label: 'Any size', value: 0 },
  { label: '100k+', value: 100_000 },
  { label: '1M+', value: 1_000_000 },
  { label: '5M+', value: 5_000_000 },
];

interface FiltersSheetProps {
  minPopulation: number;
  onChange: (value: number) => void;
}

/**
 * Population filter in a bottom sheet. Ref-driven (`.present()`) — the sheet
 * lives outside the screen's layout and animates over it.
 */
export const FiltersSheet = forwardRef<BottomSheetModal, FiltersSheetProps>(function FiltersSheet(
  { minPopulation, onChange },
  ref,
) {
  const { colorScheme } = useColorScheme();
  const colors = palette[colorScheme ?? 'light'];

  return (
    <BottomSheetModal
      ref={ref}
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
    >
      <BottomSheetView>
        <View className="gap-4 px-6 pb-10 pt-2">
          <Text variant="h3">Filter results</Text>
          <Text variant="body-sm" color="muted">
            Minimum city population
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {POPULATION_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                label={opt.label}
                size="sm"
                variant={minPopulation === opt.value ? 'primary' : 'outline'}
                onPress={() => onChange(opt.value)}
              />
            ))}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
