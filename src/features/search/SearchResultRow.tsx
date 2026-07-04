import { MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import type { Destination } from '@/types/destination';

interface SearchResultRowProps {
  destination: Destination;
  /** The typed prefix — rendered highlighted inside the name. */
  query: string;
  onPress: (destination: Destination) => void;
}

/** Splits `name` so the matched prefix renders in primary color. */
function HighlightedName({ name, query }: { name: string; query: string }) {
  const matches = query.length > 0 && name.toLowerCase().startsWith(query.toLowerCase());
  if (!matches) {
    return <Text variant="label">{name}</Text>;
  }
  return (
    <Text variant="label">
      <Text variant="label" color="primary">
        {name.slice(0, query.length)}
      </Text>
      {name.slice(query.length)}
    </Text>
  );
}

export function SearchResultRow({ destination, query, onPress }: SearchResultRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${destination.name}, ${destination.country}`}
      onPress={() => {
        hapticLight();
        onPress(destination);
      }}
      className="flex-row items-center gap-3 rounded-md px-4 py-3 active:bg-surface"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <Icon icon={MapPin} size={16} color="primary" />
      </View>
      <View className="flex-1">
        <HighlightedName name={destination.name} query={query} />
        <Text variant="caption" color="muted" numberOfLines={1}>
          {destination.blurb}
        </Text>
      </View>
    </Pressable>
  );
}
