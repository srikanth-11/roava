import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon, Skeleton, Text } from '@/components/ui';

export type SnapshotState = 'loading' | 'error' | 'ready';

interface SnapshotCardProps {
  icon: LucideIcon;
  title: string;
  state: SnapshotState;
  /** Shown in the error state — short and honest ("Unavailable"). */
  errorHint?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

/**
 * Uniform shell for the snapshot row. Each card owns its own state — one
 * failing API grays out ONE card, never the row or the screen.
 */
export function SnapshotCard({
  icon,
  title,
  state,
  errorHint = 'Unavailable',
  onRetry,
  children,
}: SnapshotCardProps) {
  return (
    <View className="flex-1 gap-2 rounded-lg border border-border bg-surface p-3">
      <View className="flex-row items-center gap-1.5">
        <Icon icon={icon} size={16} color="muted" />
        <Text variant="caption" color="muted">
          {title}
        </Text>
      </View>

      {state === 'loading' ? (
        <View className="gap-1.5">
          <Skeleton className="h-6 w-16 rounded-sm" />
          <Skeleton className="h-3 w-20 rounded-sm" />
        </View>
      ) : null}

      {state === 'error' ? (
        <View className="gap-1">
          <Text variant="body-sm" color="muted">
            {errorHint}
          </Text>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Retry ${title}`}
              hitSlop={12}
              onPress={onRetry}
            >
              <Text variant="caption" color="primary">
                Retry
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {state === 'ready' ? children : null}
    </View>
  );
}
