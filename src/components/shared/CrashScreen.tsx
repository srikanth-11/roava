import { RefreshCw, TriangleAlert } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Button, Icon, Screen, Text } from '@/components/ui';

interface CrashScreenProps {
  error: Error;
  /** expo-router's ErrorBoundary retry — remounts the crashed route. */
  retry: () => Promise<void> | void;
}

/**
 * The face of a render crash — friendly copy, a real way back, and the raw
 * error in dev builds only. Wired into expo-router's route-level
 * `ErrorBoundary` export on every param-driven route.
 */
export function CrashScreen({ error, retry }: CrashScreenProps) {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <Icon icon={TriangleAlert} color="destructive" size={32} accessibilityLabel="Error" />
        </View>
        <Text variant="h2" className="text-center">
          Something broke
        </Text>
        <Text variant="body-sm" color="muted" className="text-center">
          Not your fault — the screen hit an unexpected error. Your trips and favorites are safe on
          this device.
        </Text>
        <Button label="Try again" icon={RefreshCw} onPress={() => void retry()} />

        {__DEV__ ? (
          <ScrollView
            className="mt-4 max-h-48 w-full rounded-lg bg-surface p-3"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <Text variant="caption" color="destructive">
              {error.name}: {error.message}
            </Text>
            <Text variant="caption" color="muted">
              {error.stack ?? 'no stack'}
            </Text>
          </ScrollView>
        ) : null}
      </View>
    </Screen>
  );
}
