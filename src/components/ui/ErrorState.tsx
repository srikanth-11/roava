import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-12" accessibilityRole="alert">
      <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <Icon icon={CircleAlert} size={24} color="destructive" />
      </View>
      <Text variant="h3" className="text-center">
        {title}
      </Text>
      <Text variant="body-sm" color="muted" className="text-center">
        {message}
      </Text>
      {onRetry ? (
        <Button label={retryLabel} variant="outline" size="sm" onPress={onRetry} className="mt-2" />
      ) : null}
    </View>
  );
}
