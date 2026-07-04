import { Link } from 'expo-router';
import { View } from 'react-native';

import { Screen, Text } from '@/components/ui';

export default function Index() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-2 px-8">
        <Text variant="display">Roava</Text>
        <Text variant="body" color="muted" className="text-center">
          Phase 1 — design system in progress.
        </Text>
        {__DEV__ ? (
          <Link href="/dev-gallery" className="mt-4">
            <Text variant="label" color="primary">
              Open component gallery →
            </Text>
          </Link>
        ) : null}
      </View>
    </Screen>
  );
}
