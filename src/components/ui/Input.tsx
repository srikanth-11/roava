import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Text } from '@/components/ui/Text';
import { palette } from '@/lib/palette';

export interface InputProps extends TextInputProps {
  label: string;
  helperText?: string;
  errorText?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

export function Input({
  label,
  helperText,
  errorText,
  leftSlot,
  rightSlot,
  className = '',
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const { colorScheme } = useColorScheme();
  const hasError = !!errorText;

  const borderClass = hasError
    ? 'border-destructive'
    : focused
      ? 'border-primary'
      : 'border-border';

  return (
    <View className={className}>
      <Text variant="label" className="mb-1.5">
        {label}
      </Text>
      <View
        className={`h-12 flex-row items-center gap-2 rounded-md border bg-surface px-3 ${borderClass}`}
      >
        {leftSlot}
        <TextInput
          accessibilityLabel={label}
          className="flex-1 font-body text-base text-foreground"
          placeholderTextColor={palette[colorScheme ?? 'light'].mutedForeground}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightSlot}
      </View>
      {hasError ? (
        <Text variant="caption" color="destructive" className="mt-1" accessibilityRole="alert">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="muted" className="mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
