import { Compass } from 'lucide-react-native';
import { View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components/ui';

export default function HomeScreen() {
  return (
    <Screen scroll>
      <View className="px-4 pt-4">
        <Text variant="h1">Home</Text>
      </View>
      <EmptyState
        icon={Compass}
        title="Discovery feed coming soon"
        message="Trending destinations and travel inspiration arrive in Phase 5."
      />
    </Screen>
  );
}
