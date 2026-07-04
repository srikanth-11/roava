import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-12">
      <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon icon={icon} size={24} color="primary" />
      </View>
      <Text variant="h3" className="text-center">
        {title}
      </Text>
      <Text variant="body-sm" color="muted" className="text-center">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          variant="primary"
          size="sm"
          onPress={onAction}
          className="mt-2"
        />
      ) : null}
    </View>
  );
}
