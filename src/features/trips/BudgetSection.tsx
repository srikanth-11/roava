import { Plus, ReceiptText, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button, EmptyState, Icon, Input, Text } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { enterDown, exitFade, listLayout } from '@/lib/motion';
import { useAppSelector } from '@/hooks/useAppStore';
import { useUpdateTripMutation } from '@/store/api';
import { selectHomeCurrency } from '@/store/settingsSlice';
import { BUDGET_CATEGORIES, type BudgetCategory, type Trip } from '@/types/trip';

const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  transport: 'Transport',
  stay: 'Stay',
  food: 'Food',
  activities: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
};

/**
 * New entries take the CURRENT home currency; old entries keep the currency
 * they were written in (the Phase 12 schema stores it per entry), so totals
 * group by currency instead of pretending everything is one unit.
 */
export function BudgetSection({ trip }: { trip: Trip }) {
  const homeCurrency = useAppSelector(selectHomeCurrency);
  const [updateTrip] = useUpdateTripMutation();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('food');
  const [note, setNote] = useState('');

  const parsed = Number.parseFloat(amount.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;

  const totalsByCurrency = trip.budget.reduce<Record<string, number>>((acc, e) => {
    acc[e.currency] = (acc[e.currency] ?? 0) + e.amount;
    return acc;
  }, {});
  const currencyTotals = Object.entries(totalsByCurrency).sort((a, b) => b[1] - a[1]);
  // Big number = the largest bucket; other currencies surface as caption lines.
  const primary = currencyTotals[0] ?? ([homeCurrency, 0] as [string, number]);
  const byCategory = BUDGET_CATEGORIES.map((c) => ({
    category: c,
    sum: trip.budget
      .filter((e) => e.category === c && e.currency === primary[0])
      .reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.sum > 0);

  const add = () => {
    if (!valid) return;
    void updateTrip({
      tripId: trip.id,
      command: {
        kind: 'addBudget',
        amount: parsed,
        currency: homeCurrency,
        category,
        note: note.trim() || undefined,
      },
    });
    setAmount('');
    setNote('');
  };

  const remove = (entryId: string) => {
    void updateTrip({ tripId: trip.id, command: { kind: 'deleteBudget', entryId } });
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-4">
        <View className="items-center gap-1 rounded-lg border border-border bg-surface p-4">
          <Text variant="caption" color="muted">
            Spent so far
          </Text>
          <Text variant="display">{formatMoney(primary[1], primary[0])}</Text>
          {currencyTotals.slice(1).map(([code, sum]) => (
            <Text key={code} variant="caption" color="muted">
              + {formatMoney(sum, code)}
            </Text>
          ))}
          {byCategory.length > 0 ? (
            <View className="mt-1 flex-row flex-wrap justify-center gap-2">
              {byCategory.map((c) => (
                <Text key={c.category} variant="caption" color="muted">
                  {CATEGORY_LABEL[c.category]} {formatMoney(c.sum, primary[0])}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <View className="flex-row items-end gap-2">
            <Input
              className="flex-1"
              label={`Amount (${homeCurrency})`}
              placeholder="1200"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              accessibilityLabel={`Expense amount in ${homeCurrency}`}
            />
            <Input
              className="flex-1"
              label="Note (optional)"
              placeholder="Ryokan night 1"
              value={note}
              onChangeText={setNote}
              accessibilityLabel="Expense note"
            />
          </View>
          <View className="flex-row flex-wrap gap-2">
            {BUDGET_CATEGORIES.map((c) => (
              <Button
                key={c}
                label={CATEGORY_LABEL[c]}
                size="sm"
                variant={c === category ? 'primary' : 'outline'}
                onPress={() => setCategory(c)}
              />
            ))}
          </View>
          <Button
            label="Add expense"
            icon={Plus}
            onPress={add}
            disabled={!valid}
            accessibilityHint="Records the expense on this device"
          />
        </View>

        {trip.budget.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="Nothing spent yet"
            message="Track expenses as they happen — totals work fully offline."
          />
        ) : (
          <View className="gap-2">
            {[...trip.budget]
              .sort((a, b) => b.spentAt - a.spentAt)
              .map((entry) => (
                <Animated.View
                  key={entry.id}
                  entering={enterDown}
                  exiting={exitFade}
                  layout={listLayout}
                  className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <View className="flex-1 gap-0.5">
                    <Text variant="label">{formatMoney(entry.amount, entry.currency)}</Text>
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {CATEGORY_LABEL[entry.category]}
                      {entry.note ? ` · ${entry.note}` : ''}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete expense of ${formatMoney(entry.amount, entry.currency)}`}
                    hitSlop={10}
                    onPress={() => remove(entry.id)}
                  >
                    <Icon icon={Trash2} size={16} color="muted" accessibilityLabel="Delete" />
                  </Pressable>
                </Animated.View>
              ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
