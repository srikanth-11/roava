import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';

import { hapticLight } from '@/lib/haptics';

interface CardBaseProps {
  className?: string;
  children: React.ReactNode;
}

const cardClasses = 'rounded-lg border border-border bg-surface p-4';

export function Card({ className = '', children, ...props }: CardBaseProps & ViewProps) {
  return (
    <View className={`${cardClasses} ${className}`} {...props}>
      {children}
    </View>
  );
}

export interface PressableCardProps extends CardBaseProps, Omit<PressableProps, 'children'> {
  /** Screen-reader description of what tapping does. */
  accessibilityLabel: string;
}

export function PressableCard({
  className = '',
  children,
  accessibilityLabel,
  onPress,
  ...props
}: PressableCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={(e) => {
        hapticLight();
        onPress?.(e);
      }}
      className={`${cardClasses} active:opacity-90 ${className}`}
      {...props}
    >
      {children}
    </Pressable>
  );
}
