import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, ImageOff, Trash2, Undo2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Button, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { favoriteRestored, favoriteToggled, type FavoriteItem } from '@/store/favoritesSlice';

const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
const UNDO_MS = 5000;

function savedAgo(savedAt: number): string {
  const mins = Math.round((Date.now() - savedAt) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function DeleteAction() {
  return (
    <View className="mb-3 w-24 items-center justify-center rounded-r-lg bg-destructive">
      <Icon icon={Trash2} color="on-primary" accessibilityLabel="Remove" />
    </View>
  );
}

function FavoriteRow({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
  return (
    <ReanimatedSwipeable
      renderRightActions={() => <DeleteAction />}
      rightThreshold={64}
      onSwipeableOpen={onRemove}
      overshootRight={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.name}, ${item.country}. Swipe left to remove.`}
        onPress={() => router.push({ pathname: '/destination/[id]', params: { id: item.id } })}
        className="mb-3 flex-row items-center gap-3 rounded-lg border border-border bg-surface p-3 active:opacity-90"
      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={200}
            cachePolicy="disk"
            style={{ width: 64, height: 64, borderRadius: 12 }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-md bg-border">
            <Icon icon={ImageOff} color="muted" />
          </View>
        )}
        <View className="flex-1 gap-0.5">
          <Text variant="h3" numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="caption" color="muted" numberOfLines={1}>
            {item.country} · saved {savedAgo(item.savedAt)}
          </Text>
          {item.photoCredit ? (
            <Text variant="caption" color="muted" numberOfLines={1}>
              Photo: {item.photoCredit} / Unsplash
            </Text>
          ) : null}
        </View>
        <Icon icon={Heart} color="primary" filled size={16} />
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export default function FavoritesScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.favorites.items);

  // One pending undo at a time: a new removal finalizes the previous one.
  const [pendingUndo, setPendingUndo] = useState<FavoriteItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const remove = (item: FavoriteItem) => {
    hapticLight();
    dispatch(favoriteToggled(item));
    if (timer.current) clearTimeout(timer.current);
    setPendingUndo(item);
    timer.current = setTimeout(() => setPendingUndo(null), UNDO_MS);
  };

  const undo = () => {
    if (!pendingUndo) return;
    if (timer.current) clearTimeout(timer.current);
    hapticLight();
    dispatch(favoriteRestored(pendingUndo));
    setPendingUndo(null);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <Screen>
      <View className="flex-1 px-4 pt-4">
        <Text variant="h1" className="mb-4">
          Favorites
        </Text>

        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            message="Tap the heart on any destination — everything saved here works offline, photos included."
          />
        ) : (
          <FlashList
            data={items}
            keyExtractor={(f) => f.id}
            renderItem={({ item }) => <FavoriteRow item={item} onRemove={() => remove(item)} />}
            contentContainerStyle={{ paddingBottom: 88 }}
          />
        )}

        {pendingUndo ? (
          // scrim token: dark base in BOTH themes, so on-image text stays legible.
          <View className="absolute inset-x-4 bottom-4 flex-row items-center gap-3 rounded-lg bg-scrim/90 p-4">
            <Text variant="body-sm" color="on-image" className="flex-1" numberOfLines={1}>
              Removed {pendingUndo.name}
            </Text>
            <Button label="Undo" size="sm" icon={Undo2} onPress={undo} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
