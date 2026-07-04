import { Luggage } from 'lucide-react-native';
import { View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components/ui';

export default function TripsScreen() {
  return (
    <Screen scroll>
      <View className="px-4 pt-4">
        <Text variant="h1">Trips</Text>
      </View>
      <EmptyState
        icon={Luggage}
        title="No trips yet"
        message="The trip planner — itineraries, budgets, packing lists — lands in Phase 12."
      />
    </Screen>
  );
}
