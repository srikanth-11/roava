import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';

/**
 * Web stub — the flight tracker's mini-map is MapLibre (native-only). Web
 * visitors are pointed to the app instead of bundling the native module.
 */
export default function FlightTrackerWeb() {
  const { callsign, icao24 } = useLocalSearchParams<{ callsign?: string; icao24?: string }>();
  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Text variant="h2">{callsign || icao24 || 'Flight'}</Text>
        <Text variant="body" color="muted" className="text-center">
          Live flight tracking lives in the Roava app.
        </Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
