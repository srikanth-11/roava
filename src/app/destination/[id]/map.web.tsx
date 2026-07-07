import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';

/**
 * Web stub — MapLibre is native-only. The web build (EAS-Hosted share pages)
 * points visitors to the app rather than bundling the native map module.
 */
export default function DestinationMapWeb() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text variant="h2">{name ?? 'Map'}</Text>
        <Text variant="body" color="muted" className="text-center">
          The interactive map lives in the Roava app.
        </Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
