import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Badge, Card, Icon, Screen, Text } from '@/components/ui';

export default function DestinationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <Icon icon={ArrowLeft} accessibilityLabel="Back" />
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Icon icon={MapPin} color="primary" />
          <Text variant="h1" className="capitalize">
            {id}
          </Text>
        </View>

        <Badge label="Deep-link target — full feature in Phase 7" variant="outline" />

        <Card>
          <Text variant="body-sm" color="muted">
            Hero imagery, weather, attractions, hotels, and maps for “{id}” arrive in Phase 7. This
            route exists now so navigation architecture and deep linking are proven early.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
