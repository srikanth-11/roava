import { View } from 'react-native';

import { Text } from '@/components/ui/Text';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline';

const containerClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary/10',
  success: 'bg-success/10',
  warning: 'bg-accent/15',
  destructive: 'bg-destructive/10',
  outline: 'bg-transparent border border-border',
};

const labelColor: Record<BadgeVariant, 'primary' | 'success' | 'destructive' | 'default'> = {
  default: 'primary',
  success: 'success',
  warning: 'default',
  destructive: 'destructive',
  outline: 'default',
};

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant = 'default', className = '' }: BadgeProps) {
  return (
    <View
      className={`self-start rounded-full px-2.5 py-1 ${containerClasses[variant]} ${className}`}
    >
      <Text variant="caption" color={labelColor[variant]} className="font-body-medium">
        {label}
      </Text>
    </View>
  );
}
