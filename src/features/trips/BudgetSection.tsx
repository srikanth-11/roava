import { Plus, ReceiptText, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, EmptyState, Icon, Input, Text } from '@/components/ui';
import { HOME_CURRENCY } from '@/lib/currencies';
import { formatMoney } from '@/lib/money';
import { useUpdateTripMutation } from '@/store/api';
import { BUDGET_CATEGORIES, type BudgetCategory, type Trip } from '@/types/trip';

const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  transport: 'Transport',
  stay: 'Stay',
  food: 'Food',
  activities: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
};

/** Single-currency (home) budget MVP — multi-currency joins when sync does. */
export function BudgetSection({ trip }: { trip: Trip }) {
  const [updateTrip] = useUpdateTripMutation();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<BudgetCategory>('food');
  const [note, setNote] = useState('');

  const parsed = Number.parseFloat(amount.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;

  const total = trip.budget.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = BUDGET_CATEGORIES.map((c) => ({
    category: c,
    sum: trip.budget.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.sum > 0);

  const add = () => {
    if (!valid) return;
    void updateTrip({
      tripId: trip.id,
      command: {
        kind: 'addBudget',
        amount: parsed,
        currency: HOME_CURRENCY,
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
          <Text variant="display">{formatMoney(total, HOME_CURRENCY)}</Text>
          {byCategory.length > 0 ? (
            <View className="mt-1 flex-row flex-wrap justify-center gap-2">
              {byCategory.map((c) => (
                <Text key={c.category} variant="caption" color="muted">
                  {CATEGORY_LABEL[c.category]} {formatMoney(c.sum, HOME_CURRENCY)}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <View className="flex-row items-end gap-2">
            <Input
              className="flex-1"
              label={`Amount (${HOME_CURRENCY})`}
              placeholder="1200"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              accessibilityLabel={`Expense amount in ${HOME_CURRENCY}`}
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
                <View
                  key={entry.id}
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
                </View>
              ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
