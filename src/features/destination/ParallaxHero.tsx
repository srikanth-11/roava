import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowLeft, Heart, ImageOff, Share2, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/ui';
import type { DestinationDetail } from '@/types/destination';

export const HERO_HEIGHT = 320;

const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

/** 48dp icon button on a scrim disc — legible over any photo. */
function OverlayButton({
  icon,
  label,
  onPress,
  filled = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-12 w-12 items-center justify-center rounded-full bg-scrim/40 active:bg-scrim/60"
    >
      <Icon icon={icon} color="on-image" filled={filled} size={24} accessibilityLabel={label} />
    </Pressable>
  );
}

interface ParallaxHeroProps {
  detail: DestinationDetail;
  scrollY: SharedValue<number>;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export function ParallaxHero({
  detail,
  scrollY,
  isFavorite,
  onToggleFavorite,
  onShare,
}: ParallaxHeroProps) {
  const insets = useSafeAreaInsets();

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      // Image moves at half scroll speed = parallax; pull-down zooms instead
      // of revealing a gap. React Compiler rule: .get(), never .value.
      { translateY: scrollY.get() * 0.5 },
      {
        scale: interpolate(scrollY.get(), [-HERO_HEIGHT, 0], [1.6, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    // Title rides out with the photo — content below stays fully legible.
    opacity: interpolate(scrollY.get(), [0, HERO_HEIGHT * 0.55], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View style={{ height: HERO_HEIGHT }} className="overflow-hidden bg-border">
      <Animated.View style={[{ height: HERO_HEIGHT }, imageStyle]}>
        {detail.imageUrl ? (
          <Image
            source={{ uri: detail.imageUrl }}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
            style={{ width: '100%', height: '100%' }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Icon icon={ImageOff} color="muted" size={32} />
          </View>
        )}
      </Animated.View>

      {/* Two stacked washes fake a gradient without a native gradient dep. */}
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0 h-36 bg-scrim/20" />
      <View pointerEvents="none" className="absolute inset-x-0 bottom-0 h-24 bg-scrim/40" />

      <View
        style={{ paddingTop: insets.top + 8 }}
        className="absolute inset-x-0 top-0 flex-row items-start justify-between px-4"
      >
        <OverlayButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />
        <View className="flex-row gap-3">
          <OverlayButton icon={Share2} label={`Share ${detail.name}`} onPress={onShare} />
          <OverlayButton
            icon={Heart}
            label={
              isFavorite
                ? `Remove ${detail.name} from favorites`
                : `Save ${detail.name} to favorites`
            }
            onPress={onToggleFavorite}
            filled={isFavorite}
          />
        </View>
      </View>

      <Animated.View style={titleStyle} className="absolute inset-x-0 bottom-0 gap-0.5 p-4">
        <Text variant="h1" color="on-image">
          {detail.name}
        </Text>
        <Text variant="body-sm" color="on-image" className="opacity-90">
          {detail.region ? `${detail.region}, ${detail.country}` : detail.country}
        </Text>
        {detail.photoCredit ? (
          <Text variant="caption" color="on-image" className="opacity-75">
            Photo: {detail.photoCredit} / Unsplash
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}
