import { Heart } from 'lucide-react-native';
import { View } from 'react-native';

import { EmptyState, Screen, Text } from '@/components/ui';

export default function FavoritesScreen() {
  return (
    <Screen scroll>
      <View className="px-4 pt-4">
        <Text variant="h1">Favorites</Text>
      </View>
      <EmptyState
        icon={Heart}
        title="Nothing saved yet"
        message="Places and destinations you save will live here, online or off."
      />
    </Screen>
  );
}
