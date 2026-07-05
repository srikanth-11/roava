import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { ArrowLeft, ArrowUpDown, ChevronDown, Star } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, ErrorState, Icon, Input, Screen, Skeleton, Text } from '@/components/ui';
import { CurrencyPickerSheet } from '@/features/currency/CurrencyPickerSheet';
import { RateResult } from '@/features/currency/RateResult';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { currencyMeta } from '@/lib/currencies';
import { hapticLight } from '@/lib/haptics';
import { isAppError } from '@/services/errors';
import {
  pairToggled,
  pairUsed,
  selectIsFavoritePair,
  type CurrencyPair,
} from '@/store/currencySlice';
import { useGetRateTableQuery } from '@/store/api';

function CurrencyRow({
  label,
  code,
  onPress,
}: {
  label: string;
  code: string;
  onPress: () => void;
}) {
  const meta = currencyMeta(code);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} currency: ${meta?.name ?? code}. Tap to change.`}
      onPress={onPress}
      className="flex-1 flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3 active:opacity-90"
    >
      <View className="w-12 items-center rounded-sm bg-border py-1">
        <Text variant="label">{meta?.symbol ?? code}</Text>
      </View>
      <View className="flex-1">
        <Text variant="caption" color="muted">
          {label}
        </Text>
        <Text variant="label" numberOfLines={1}>
          {code} · {meta?.name ?? 'Unknown'}
        </Text>
      </View>
      <Icon icon={ChevronDown} size={16} color="muted" />
    </Pressable>
  );
}

export default function CurrencyScreen() {
  const dispatch = useAppDispatch();
  const lastPair = useAppSelector((s) => s.currency.lastPair);
  const favoritePairs = useAppSelector((s) => s.currency.favoritePairs);

  const [pair, setPair] = useState<CurrencyPair>(lastPair);
  const [amount, setAmount] = useState('100');
  const isFavorite = useAppSelector((s) => selectIsFavoritePair(s, pair));

  const fromSheet = useRef<BottomSheetModal>(null);
  const toSheet = useRef<BottomSheetModal>(null);

  const { data: table, error, isLoading, refetch } = useGetRateTableQuery(pair.base);

  const parsed = Number.parseFloat(amount.replace(',', '.'));
  const validAmount = Number.isFinite(parsed) && parsed >= 0;

  const applyPair = (next: CurrencyPair) => {
    setPair(next);
    dispatch(pairUsed(next));
  };

  const swap = () => {
    hapticLight();
    applyPair({ base: pair.quote, quote: pair.base });
  };

  return (
    <Screen scroll>
      <View className="gap-5 px-4 pt-2">
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
            Currency
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite
                ? `Remove ${pair.base} to ${pair.quote} from saved pairs`
                : `Save ${pair.base} to ${pair.quote} pair`
            }
            hitSlop={8}
            onPress={() => {
              hapticLight();
              dispatch(pairToggled(pair));
            }}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface"
          >
            <Icon icon={Star} color={isFavorite ? 'primary' : 'muted'} filled={isFavorite} />
          </Pressable>
        </View>

        <Input
          label={`Amount (${pair.base})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Amount"
          accessibilityLabel={`Amount in ${pair.base}`}
        />

        <View className="flex-row items-center gap-3">
          <CurrencyRow label="From" code={pair.base} onPress={() => fromSheet.current?.present()} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Swap currencies"
            onPress={swap}
            className="h-12 w-12 items-center justify-center rounded-full bg-primary/10"
          >
            <Icon icon={ArrowUpDown} color="primary" accessibilityLabel="Swap" />
          </Pressable>
          <CurrencyRow label="To" code={pair.quote} onPress={() => toSheet.current?.present()} />
        </View>

        {isLoading ? (
          <View className="items-center gap-2 py-4">
            <Skeleton className="h-12 w-48 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-sm" />
          </View>
        ) : error || !table ? (
          <ErrorState
            title="Couldn't load rates"
            message={
              error && isAppError(error)
                ? error.userMessage
                : 'No saved rates for this currency yet.'
            }
            onRetry={() => void refetch()}
          />
        ) : validAmount ? (
          <RateResult amount={parsed} base={pair.base} quote={pair.quote} table={table} />
        ) : (
          <Text variant="body-sm" color="muted" className="text-center">
            Enter an amount to convert.
          </Text>
        )}

        {favoritePairs.length > 0 ? (
          <View className="gap-2">
            <Text variant="h3">Saved pairs</Text>
            <View className="flex-row flex-wrap gap-2">
              {favoritePairs.map((p) => (
                <Button
                  key={`${p.base}-${p.quote}`}
                  label={`${p.base} → ${p.quote}`}
                  size="sm"
                  variant={p.base === pair.base && p.quote === pair.quote ? 'primary' : 'outline'}
                  onPress={() => applyPair(p)}
                />
              ))}
            </View>
          </View>
        ) : (
          <Text variant="caption" color="muted" className="text-center">
            Star a pair to keep it handy — saved pairs convert offline from cached rates.
          </Text>
        )}
      </View>

      <CurrencyPickerSheet
        ref={fromSheet}
        label="From"
        selected={pair.base}
        onSelect={(code) => {
          applyPair({ base: code, quote: pair.quote });
          fromSheet.current?.dismiss();
        }}
      />
      <CurrencyPickerSheet
        ref={toSheet}
        label="To"
        selected={pair.quote}
        onSelect={(code) => {
          applyPair({ base: pair.base, quote: code });
          toSheet.current?.dismiss();
        }}
      />
    </Screen>
  );
}
