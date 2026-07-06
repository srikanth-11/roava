import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { useColorScheme } from 'nativewind';
import { forwardRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { Button, Input, Text } from '@/components/ui';
import { useSheetBackHandler } from '@/hooks/useSheetBackHandler';
import { palette } from '@/lib/palette';

/**
 * RHF + zod: the resolver runs the schema on submit and per-field on blur;
 * `refine` handles the cross-field rule (end after start). Dates are typed
 * YYYY-MM-DD text for now — a native date picker is a Phase 15 nicety.
 */
const createTripFormSchema = z
  .object({
    name: z.string().min(1, 'Name your trip').max(80, 'Keep it under 80 characters'),
    destinationName: z.string().max(80).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'The trip ends before it starts',
    path: ['endDate'],
  });

export type CreateTripForm = z.infer<typeof createTripFormSchema>;

interface CreateTripSheetProps {
  onSubmit: (values: CreateTripForm) => void;
  submitting: boolean;
}

export const CreateTripSheet = forwardRef<BottomSheetModal, CreateTripSheetProps>(
  function CreateTripSheet({ onSubmit, submitting }, ref) {
    const { colorScheme } = useColorScheme();
    const colors = palette[colorScheme ?? 'light'];
    const onSheetChange = useSheetBackHandler();

    const { control, handleSubmit, reset } = useForm<CreateTripForm>({
      resolver: zodResolver(createTripFormSchema),
      defaultValues: { name: '', destinationName: '', startDate: '', endDate: '' },
    });

    const submit = handleSubmit((values) => {
      onSubmit(values);
      reset();
    });

    return (
      <BottomSheetModal
        ref={ref}
        onChange={onSheetChange}
        snapPoints={['75%']}
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.mutedForeground }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-4 pt-2">
            <Text variant="h3">New trip</Text>

            <Controller
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <Input
                  label="Trip name"
                  placeholder="Kyoto in autumn"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  errorText={fieldState.error?.message}
                  accessibilityLabel="Trip name"
                />
              )}
            />

            <Controller
              control={control}
              name="destinationName"
              render={({ field, fieldState }) => (
                <Input
                  label="Destination (optional)"
                  placeholder="Kyoto, Japan"
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  errorText={fieldState.error?.message}
                  accessibilityLabel="Destination"
                />
              )}
            />

            <View className="flex-row gap-3">
              <Controller
                control={control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <Input
                    className="flex-1"
                    label="Starts"
                    placeholder="2026-08-14"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    errorText={fieldState.error?.message}
                    keyboardType="numbers-and-punctuation"
                    accessibilityLabel="Start date, format YYYY-MM-DD"
                  />
                )}
              />
              <Controller
                control={control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <Input
                    className="flex-1"
                    label="Ends"
                    placeholder="2026-08-21"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    errorText={fieldState.error?.message}
                    keyboardType="numbers-and-punctuation"
                    accessibilityLabel="End date, format YYYY-MM-DD"
                  />
                )}
              />
            </View>

            <Button
              label={submitting ? 'Creating…' : 'Create trip'}
              onPress={() => void submit()}
              loading={submitting}
              accessibilityHint="Saves the trip on this device"
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
