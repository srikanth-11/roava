import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useColorScheme } from 'nativewind';
import { forwardRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Input, Text } from '@/components/ui';
import { useSheetBackHandler } from '@/hooks/useSheetBackHandler';
import { CURRENCY_META } from '@/lib/currencies';
import { palette } from '@/lib/palette';

interface CurrencyPickerSheetProps {
  /** Sheet header — "From"/"To" in the converter, "Home currency" in settings. */
  label: string;
  selected: string;
  onSelect: (code: string) => void;
}

/**
 * Searchable currency list in a bottom sheet (the Phase 6 pattern). Search
 * matches code or name, case-insensitively.
 */
export const CurrencyPickerSheet = forwardRef<BottomSheetModal, CurrencyPickerSheetProps>(
  function CurrencyPickerSheet({ label, selected, onSelect }, ref) {
    const { colorScheme } = useColorScheme();
    const colors = palette[colorScheme ?? 'light'];
    const [query, setQuery] = useState('');
    const onSheetChange = useSheetBackHandler();

    const q = query.trim().toLowerCase();
    const filtered = q
      ? CURRENCY_META.filter(
          (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
        )
      : CURRENCY_META;

    return (
      <BottomSheetModal
        ref={ref}
        onChange={onSheetChange}
        snapPoints={['70%']}
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
      >
        <View className="gap-3 px-6 pb-2 pt-2">
          <Text variant="h3">{label} currency</Text>
          <Input
            label="Search"
            placeholder="Search code or name"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            accessibilityLabel="Search currencies"
          />
        </View>
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
          {filtered.map((c) => (
            <Pressable
              key={c.code}
              accessibilityRole="button"
              accessibilityLabel={`${c.name} (${c.code})`}
              onPress={() => onSelect(c.code)}
              className={`flex-row items-center gap-3 rounded-md px-2 py-3 active:opacity-80 ${
                c.code === selected ? 'bg-primary/10' : ''
              }`}
            >
              <View className="w-12 items-center rounded-sm bg-border py-1">
                <Text variant="label">{c.symbol}</Text>
              </View>
              <Text variant="label" className="w-14">
                {c.code}
              </Text>
              <Text variant="body-sm" color="muted" className="flex-1" numberOfLines={1}>
                {c.name}
              </Text>
            </Pressable>
          ))}
          {filtered.length === 0 ? (
            <Text variant="body-sm" color="muted" className="px-2 py-6 text-center">
              No currency matches “{query}”.
            </Text>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
