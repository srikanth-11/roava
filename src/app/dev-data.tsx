import { Inbox, MapPin } from 'lucide-react-native';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  Screen,
  Skeleton,
  Text,
} from '@/components/ui';
import { useAppSelector } from '@/hooks/useAppStore';
import { useOnline } from '@/hooks/useOnline';
import { isAppError } from '@/services/errors';
import { destinationsRepository, MockDestinationsRepository } from '@/repositories/destinations';
import { useGetTrendingQuery } from '@/store/api';

const mockRepo =
  destinationsRepository instanceof MockDestinationsRepository ? destinationsRepository : null;

/** Dev harness proving the data layer: every UI state reproducible on demand. */
export default function DevData() {
  const { data, error, isFetching, refetch } = useGetTrendingQuery();
  const cached = useAppSelector((s) => s.cache);
  const online = useOnline();

  if (!__DEV__) return null;

  const trigger = (fail: 'none' | 'network' | 'server' | 'empty') => {
    mockRepo?.setNextBehavior(fail);
    void refetch();
  };

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Text variant="h1">Data layer</Text>
          <Badge
            label={online === false ? 'offline' : 'online'}
            variant={online === false ? 'destructive' : 'success'}
          />
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Button label="Reload OK" size="sm" onPress={() => trigger('none')} />
          <Button
            label="Network fail"
            size="sm"
            variant="outline"
            onPress={() => trigger('network')}
          />
          <Button
            label="Server fail"
            size="sm"
            variant="outline"
            onPress={() => trigger('server')}
          />
          <Button label="Empty" size="sm" variant="outline" onPress={() => trigger('empty')} />
        </View>

        <Text variant="h3" color="muted">
          Live query
        </Text>

        {isFetching ? (
          <View className="gap-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </View>
        ) : error ? (
          <Card className="p-0">
            <ErrorState
              title={isAppError(error) ? `Error: ${error.kind}` : 'Something went wrong'}
              message={isAppError(error) ? error.userMessage : 'Please try again.'}
              onRetry={!isAppError(error) || error.retryable ? () => trigger('none') : undefined}
            />
          </Card>
        ) : data && data.length === 0 ? (
          <Card className="p-0">
            <EmptyState
              icon={Inbox}
              title="Nothing trending"
              message="The API returned an empty list — a real state that deserves real design."
              actionLabel="Reload"
              onAction={() => trigger('none')}
            />
          </Card>
        ) : (
          <View className="gap-2">
            {data?.map((d) => (
              <Card key={d.id}>
                <View className="flex-row items-center gap-3">
                  <Icon icon={MapPin} color="primary" />
                  <View className="flex-1">
                    <Text variant="h3">
                      {d.name}, {d.country}
                    </Text>
                    <Text variant="body-sm" color="muted">
                      {d.blurb}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <Text variant="h3" color="muted">
          Persisted cache (survives restart, serves offline cold starts)
        </Text>
        <Card>
          <Text variant="body-sm" color="muted">
            {cached.trendingCachedAt
              ? `${cached.trending.length} destinations cached at ${new Date(cached.trendingCachedAt).toLocaleTimeString()}`
              : 'Nothing cached yet — load once while online.'}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
