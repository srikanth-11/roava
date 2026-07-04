import { Search } from 'lucide-react-native';
import { View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components/ui';

export default function SearchScreen() {
  return (
    <Screen scroll>
      <View className="px-4 pt-4">
        <Text variant="h1">Search</Text>
      </View>
      <EmptyState
        icon={Search}
        title="Search coming soon"
        message="Find countries, cities, and attractions in Phase 6."
      />
    </Screen>
  );
}
