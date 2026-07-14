import { ArrowUpDown, Circle, MapPin, Navigation, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Badge, Icon, Text } from '@/components/ui';
import { formatDistance, formatDuration } from '@/lib/geo';
import type { RouteResult } from '@/services/routing';

/** One end of a planned trip — where it is and what to call it. */
export interface Endpoint {
  lat: number;
  lon: number;
  label: string;
}

/* ------------------------------------------------------------------ */
/* Top bar: From / To fields + swap + close                            */
/* ------------------------------------------------------------------ */

interface DirectionsBarProps {
  from: Endpoint | null;
  to: Endpoint | null;
  onEditFrom: () => void;
  onEditTo: () => void;
  onSwap: () => void;
  onClose: () => void;
}

function EndpointField({
  icon,
  value,
  placeholder,
  accessibilityLabel,
  onPress,
}: {
  icon: typeof Circle;
  value: string | null;
  placeholder: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="h-11 flex-1 flex-row items-center gap-2 rounded-md border border-border bg-background px-3 active:opacity-80"
    >
      <Icon icon={icon} size={16} color={value ? 'primary' : 'muted'} />
      <Text variant="body-sm" color={value ? 'default' : 'muted'} numberOfLines={1}>
        {value ?? placeholder}
      </Text>
    </Pressable>
  );
}

export function DirectionsBar({
  from,
  to,
  onEditFrom,
  onEditTo,
  onSwap,
  onClose,
}: DirectionsBarProps) {
  return (
    <View className="gap-2 rounded-lg border border-border bg-surface p-3">
      <View className="flex-row items-center gap-2">
        <Text variant="label" className="flex-1">
          Directions
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close directions"
          hitSlop={8}
          onPress={onClose}
          className="h-10 w-10 items-center justify-center"
        >
          <Icon icon={X} color="muted" accessibilityLabel="Close" />
        </Pressable>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="flex-1 gap-2">
          <EndpointField
            icon={Circle}
            value={from?.label ?? null}
            placeholder="Choose starting point"
            accessibilityLabel="Choose starting point"
            onPress={onEditFrom}
          />
          <EndpointField
            icon={MapPin}
            value={to?.label ?? null}
            placeholder="Choose destination"
            accessibilityLabel="Choose destination"
            onPress={onEditTo}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Swap start and destination"
          onPress={onSwap}
          className="h-12 w-12 items-center justify-center rounded-full bg-background"
        >
          <Icon icon={ArrowUpDown} size={20} color="primary" accessibilityLabel="Swap" />
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom panel: route alternatives                                    */
/* ------------------------------------------------------------------ */

interface RoutesListProps {
  routes: RouteResult[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
  fetching: boolean;
  failed: boolean;
  /** Straight-line fallback shown when routing fails but both ends exist. */
  straightLineM: number | null;
}

export function RoutesList({
  routes,
  selectedIdx,
  onSelect,
  fetching,
  failed,
  straightLineM,
}: RoutesListProps) {
  if (fetching) {
    return (
      <View className="rounded-lg border border-border bg-surface p-4">
        <Text variant="body-sm" color="muted">
          Finding routes…
        </Text>
      </View>
    );
  }

  if (failed) {
    return (
      <View className="gap-1 rounded-lg border border-border bg-surface p-4">
        <Text variant="label">Route unavailable</Text>
        <Text variant="caption" color="muted">
          {straightLineM != null
            ? `~${formatDistance(straightLineM)} straight-line. Check your connection and try again.`
            : 'Check your connection and try again.'}
        </Text>
      </View>
    );
  }

  if (routes.length === 0) return null;

  const fastestIdx = routes.reduce(
    (best, r, i) => (r.durationS < routes[best]!.durationS ? i : best),
    0,
  );
  const shortestIdx = routes.reduce(
    (best, r, i) => (r.distanceM < routes[best]!.distanceM ? i : best),
    0,
  );

  return (
    <View className="gap-1 rounded-lg border border-border bg-surface p-2">
      {routes.map((r, i) => {
        const active = i === selectedIdx;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`Route ${i + 1}: ${formatDistance(r.distanceM)}, ${formatDuration(r.durationS)}`}
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(i)}
            className={`flex-row items-center gap-3 rounded-md p-3 ${active ? 'bg-primary/10' : 'active:bg-border'}`}
          >
            <Icon icon={Navigation} size={16} color={active ? 'primary' : 'muted'} />
            <View className="flex-1 flex-row flex-wrap items-center gap-2">
              <Text variant="label" color={active ? 'primary' : 'default'}>
                {formatDuration(r.durationS)}
              </Text>
              <Text variant="body-sm" color="muted">
                {formatDistance(r.distanceM)}
              </Text>
              {routes.length > 1 && i === fastestIdx ? (
                <Badge label="fastest" variant="success" />
              ) : null}
              {routes.length > 1 && i === shortestIdx && shortestIdx !== fastestIdx ? (
                <Badge label="shortest" variant="outline" />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
