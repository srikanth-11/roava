import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ImageOff } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import type { Destination } from '@/types/destination';

const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'; // neutral placeholder shimmer

interface DestinationCardProps {
  destination: Destination;
  /** rail = compact horizontal card; list = full-width row */
  layout: 'rail' | 'list';
}

export function DestinationCard({ destination, layout }: DestinationCardProps) {
  const open = () => {
    hapticLight();
    router.push({ pathname: '/destination/[id]', params: { id: destination.id } });
  };

  if (layout === 'rail') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${destination.name}, ${destination.country}`}
        onPress={open}
        className="w-40 overflow-hidden rounded-lg bg-surface active:opacity-90"
      >
        {destination.imageUrl ? (
          <Image
            source={{ uri: destination.imageUrl }}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={250}
            cachePolicy="disk"
            style={{ width: '100%', height: 112 }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="h-28 w-full items-center justify-center bg-border">
            <Icon icon={ImageOff} color="muted" />
          </View>
        )}
        <View className="gap-0.5 p-3">
          <Text variant="label" numberOfLines={1}>
            {destination.name}
          </Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            {destination.country}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${destination.name}, ${destination.country}`}
      onPress={open}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3 active:opacity-90"
    >
      {destination.imageUrl ? (
        <Image
          source={{ uri: destination.imageUrl }}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={250}
          cachePolicy="disk"
          style={{ width: 72, height: 72, borderRadius: 12 }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View className="h-[72px] w-[72px] items-center justify-center rounded-md bg-border">
          <Icon icon={ImageOff} color="muted" />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text variant="h3" numberOfLines={1}>
          {destination.name}
        </Text>
        <Text variant="body-sm" color="muted" numberOfLines={1}>
          {destination.blurb}
        </Text>
        {destination.photoCredit ? (
          <Text variant="caption" color="muted" numberOfLines={1}>
            Photo: {destination.photoCredit} / Unsplash
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
