import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Banknote, CloudOff, Compass, Plane, Sparkles } from 'lucide-react-native';
import { Pressable, RefreshControl, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { enterDownStagger } from '@/lib/motion';
import { useColorScheme } from 'nativewind';

import { Button, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { StaleBadge } from '@/components/shared/StaleBadge';
import { DestinationCard } from '@/features/home/DestinationCard';
import { useAppSelector } from '@/hooks/useAppStore';
import { palette } from '@/lib/palette';
import { isAppError } from '@/services/errors';
import { useGetTrendingQuery } from '@/store/api';
import type { Destination } from '@/types/destination';

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Up late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function HomeHeader({ rail, showStale }: { rail: Destination[]; showStale: boolean }) {
  const session = useAppSelector((s) => s.auth.session);
  const firstName = session?.user.name.split(' ')[0] ?? 'traveler';

  return (
    <View className="gap-4 pt-4">
      <View className="px-4">
        <Text variant="body-sm" color="muted">
          {greetingForHour(new Date().getHours())},
        </Text>
        <View className="flex-row items-center gap-2">
          <Text variant="h1">{firstName}</Text>
          {showStale ? <StaleBadge /> : null}
        </View>
      </View>

      <View className="gap-3">
        <Text variant="h3" className="px-4">
          Trending now
        </Text>
        <FlashList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={rail}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View className="w-3" />}
          renderItem={({ item, index }) => (
            <Animated.View entering={enterDownStagger(index)}>
              <DestinationCard destination={item} layout="rail" />
            </Animated.View>
          )}
        />
      </View>

      <View className="mx-4 flex-row items-center gap-3 rounded-lg bg-primary/10 p-4">
        <Icon icon={Sparkles} color="primary" />
        <View className="flex-1">
          <Text variant="label">Somewhere new?</Text>
          <Text variant="caption" color="muted">
            Search any city, country, or attraction.
          </Text>
        </View>
        <Button label="Search" size="sm" onPress={() => router.push('/search')} />
      </View>

      <View className="mx-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open the currency converter"
          onPress={() => router.push('/currency')}
          className="flex-1 gap-2 rounded-lg border border-border bg-surface p-4 active:opacity-90"
        >
          <Icon icon={Banknote} color="primary" />
          <View>
            <Text variant="label">Currency</Text>
            <Text variant="caption" color="muted" numberOfLines={1}>
              Rates that work offline
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Track live flights"
          onPress={() => router.push('/flights')}
          className="flex-1 gap-2 rounded-lg border border-border bg-surface p-4 active:opacity-90"
        >
          <Icon icon={Plane} color="primary" />
          <View>
            <Text variant="label">Flights</Text>
            <Text variant="caption" color="muted" numberOfLines={1}>
              Track aircraft live
            </Text>
          </View>
        </Pressable>
      </View>

      <Text variant="h3" className="px-4">
        Explore more
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { data, error, isLoading, isFetching, refetch } = useGetTrendingQuery();
  const cached = useAppSelector((s) => s.cache.trending);
  const { colorScheme } = useColorScheme();

  // Live data when we have it; persisted last-known-good when the query fails.
  const feed = data && data.length > 0 ? data : error && cached.length > 0 ? cached : [];
  const showStale = !!error && cached.length > 0;
  const rail = feed.slice(0, 5);
  const rest = feed.slice(5);

  if (isLoading) {
    return (
      <Screen>
        <View className="gap-4 px-4 pt-4">
          <Skeleton className="h-8 w-48 rounded-md" />
          <View className="flex-row gap-3">
            <Skeleton className="h-44 w-40 rounded-lg" />
            <Skeleton className="h-44 w-40 rounded-lg" />
            <Skeleton className="h-44 w-40 rounded-lg" />
          </View>
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </View>
      </Screen>
    );
  }

  if (feed.length === 0) {
    return (
      <Screen>
        <ErrorState
          title={error && isAppError(error) ? `Couldn't load (${error.kind})` : "Couldn't load"}
          message={
            error && isAppError(error)
              ? error.userMessage
              : 'No destinations yet — pull to refresh or try again.'
          }
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlashList
        data={rest}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={<HomeHeader rail={rail} showStale={showStale} />}
        ListEmptyComponent={
          <View className="items-center px-4 py-8">
            <Icon icon={Compass} color="muted" />
            <Text variant="body-sm" color="muted">
              That&apos;s everything trending right now.
            </Text>
          </View>
        }
        ListFooterComponent={
          showStale ? (
            <View className="flex-row items-center justify-center gap-2 py-4">
              <Icon icon={CloudOff} size={16} color="muted" />
              <Text variant="caption" color="muted">
                Showing saved data — refresh when back online.
              </Text>
            </View>
          ) : (
            <View className="h-4" />
          )
        }
        contentContainerStyle={{ paddingBottom: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item, index }) => (
          <Animated.View entering={enterDownStagger(index)} className="px-4">
            <DestinationCard destination={item} layout="list" />
          </Animated.View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={() => void refetch()}
            colors={[palette[colorScheme ?? 'light'].primary]}
            tintColor={palette[colorScheme ?? 'light'].primary}
          />
        }
      />
    </Screen>
  );
}
