import { Camera, GeoJSONSource, Layer, Map as MapLibreMap } from '@maplibre/maplibre-react-native';
import { router, useFocusEffect, useLocalSearchParams, type ErrorBoundaryProps } from 'expo-router';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Gauge,
  Mountain,
  Navigation,
  Radio,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { SnapshotCard } from '@/components/shared/SnapshotCard';
import { Badge, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { MAP_STYLES, OSM_ATTRIBUTION } from '@/lib/mapStyles';
import { palette } from '@/lib/palette';
import { phaseOf, type Flight, type FlightPhase } from '@/repositories/flights';
import { isAppError } from '@/services/errors';
import { useGetFlightStateQuery } from '@/store/api';
import { CrashScreen } from '@/components/shared/CrashScreen';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <CrashScreen error={props.error} retry={props.retry} />;
}

/** Anonymous OpenSky budget math: 1 credit per bbox'd poll → 30 s keeps an
 * hour of tracking near 120 credits of the ~400/day allowance. */
const POLL_MS = 30_000;

const PHASE_META: Record<FlightPhase, { label: string; description: string }> = {
  'on-ground': { label: 'On the ground', description: 'Transponder reports weight on wheels.' },
  climbing: { label: 'Climbing', description: 'Positive vertical rate.' },
  cruising: { label: 'Cruising', description: 'Level flight.' },
  descending: { label: 'Descending', description: 'Negative vertical rate.' },
};

function agoLabel(epochSeconds: number): string {
  const mins = Math.round((Date.now() / 1000 - epochSeconds) / 60);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
}

export default function FlightDetail() {
  const params = useLocalSearchParams<{
    icao24: string;
    callsign?: string;
    lat?: string;
    lon?: string;
  }>();
  const icao24 = String(params.icao24 ?? '');
  const title = params.callsign || icao24.toUpperCase();

  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const colors = palette[scheme];

  // Bbox seed from search params — STABLE. The repository tracks the moving
  // position internally; a moving value in the query arg would change the
  // RTK cache key every fix and loop the screen (learned the hard way).
  const seedLat = Number(params.lat);
  const seedLon = Number(params.lon);
  const hasSeed = Number.isFinite(seedLat) && Number.isFinite(seedLon);

  // Polling runs ONLY while this screen is focused — anonymous credits are a
  // shared resource, and a backgrounded tracker spending them is theft.
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const { data, error, isLoading, refetch } = useGetFlightStateQuery(
    { icao24, lat: hasSeed ? seedLat : undefined, lon: hasSeed ? seedLon : undefined },
    { skip: !icao24 || !focused, pollingInterval: POLL_MS },
  );

  // Hold the last good fix so a dropped signal degrades to honesty, not
  // blankness. Render-phase adjustment (guarded setState during render) is
  // the React-documented pattern for "remember previous data" — the compiler
  // rejects the setState-in-effect version as a cascading-render risk.
  const [lastSeen, setLastSeen] = useState<Flight | null>(null);
  if (data && data !== lastSeen) {
    setLastSeen(data);
  }

  const flight = data ?? lastSeen;
  const signalLost = !isLoading && !error && data === null && lastSeen !== null;
  const phase = flight ? phaseOf(flight) : null;
  const hasPosition = flight?.lat != null && flight?.lon != null;

  return (
    <Screen scroll>
      <View className="gap-4 px-4 pt-2">
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface"
          >
            <Icon icon={ArrowLeft} accessibilityLabel="Back" />
          </Pressable>
          <Text variant="h2" className="flex-1" numberOfLines={1}>
            {title}
          </Text>
          {flight ? (
            <Badge
              label={signalLost ? 'signal lost' : `live · ${agoLabel(flight.lastContact)}`}
              variant={signalLost ? 'warning' : 'outline'}
            />
          ) : null}
        </View>

        {isLoading && !flight ? (
          <View className="gap-3">
            <Skeleton className="h-56 w-full rounded-lg" />
            <View className="flex-row gap-3">
              <Skeleton className="h-24 flex-1 rounded-lg" />
              <Skeleton className="h-24 flex-1 rounded-lg" />
            </View>
          </View>
        ) : null}

        {error && !flight ? (
          <ErrorState
            title="Couldn't reach the network"
            message={isAppError(error) ? error.userMessage : 'Please try again.'}
            onRetry={() => void refetch()}
          />
        ) : null}

        {!isLoading && !error && !flight ? (
          <ErrorState
            title="Not visible right now"
            message="This aircraft is outside ADS-B coverage or its transponder is quiet. Try again in a minute."
            retryLabel="Check again"
            onRetry={() => void refetch()}
          />
        ) : null}

        {flight ? (
          <>
            {signalLost ? (
              <View className="rounded-lg border border-border bg-surface p-3">
                <Text variant="body-sm" color="muted">
                  Signal lost — showing the last position from {agoLabel(flight.lastContact)}.
                  Coverage gaps over oceans and remote areas are normal.
                </Text>
              </View>
            ) : null}

            {hasPosition ? (
              <View className="h-64 overflow-hidden rounded-lg border border-border">
                <MapLibreMap
                  style={{ flex: 1 }}
                  mapStyle={MAP_STYLES[scheme]}
                  attribution={false}
                  logo={false}
                >
                  <Camera center={[flight.lon as number, flight.lat as number]} zoom={6.5} />
                  <GeoJSONSource
                    id="aircraft"
                    data={{
                      type: 'Feature',
                      geometry: {
                        type: 'Point',
                        coordinates: [flight.lon as number, flight.lat as number],
                      },
                      properties: {},
                    }}
                  >
                    <Layer
                      type="circle"
                      id="aircraft-dot"
                      paint={{
                        'circle-color': colors.primary,
                        'circle-radius': 8,
                        'circle-stroke-width': 3,
                        'circle-stroke-color': colors.surface,
                      }}
                    />
                  </GeoJSONSource>
                </MapLibreMap>
                <View className="absolute bottom-1 right-1 rounded-sm bg-surface/80 px-1.5 py-0.5">
                  <Text variant="caption" color="muted">
                    {OSM_ATTRIBUTION}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="rounded-lg border border-border bg-surface p-4">
                <Text variant="body-sm" color="muted">
                  No position fix — the aircraft is reporting without coordinates.
                </Text>
              </View>
            )}

            {phase ? (
              <View className="gap-2">
                <View className="flex-row flex-wrap items-center gap-2">
                  {(Object.keys(PHASE_META) as FlightPhase[]).map((p) => (
                    <Badge
                      key={p}
                      label={PHASE_META[p].label}
                      variant={p === phase ? 'default' : 'outline'}
                    />
                  ))}
                </View>
                <Text variant="caption" color="muted">
                  {PHASE_META[phase].description} Status is derived live from the transponder —
                  OpenSky has no schedule data.
                </Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <SnapshotCard icon={Mountain} title="Altitude" state="ready">
                <Text variant="h3">
                  {flight.altitudeM !== null ? `${Math.round(flight.altitudeM)} m` : '—'}
                </Text>
              </SnapshotCard>
              <SnapshotCard icon={Gauge} title="Ground speed" state="ready">
                <Text variant="h3">
                  {flight.velocityMs !== null ? `${Math.round(flight.velocityMs * 3.6)}` : '—'}
                </Text>
                {flight.velocityMs !== null ? (
                  <Text variant="caption" color="muted">
                    km/h
                  </Text>
                ) : null}
              </SnapshotCard>
            </View>
            <View className="flex-row gap-3">
              <SnapshotCard icon={Navigation} title="Heading" state="ready">
                <View className="flex-row items-center gap-2">
                  {flight.headingDeg !== null ? (
                    <View style={{ transform: [{ rotate: `${flight.headingDeg}deg` }] }}>
                      <Icon icon={Navigation} color="primary" size={20} />
                    </View>
                  ) : null}
                  <Text variant="h3">
                    {flight.headingDeg !== null ? `${Math.round(flight.headingDeg)}°` : '—'}
                  </Text>
                </View>
              </SnapshotCard>
              <SnapshotCard
                icon={
                  flight.verticalRateMs !== null && flight.verticalRateMs < 0 ? ArrowDown : ArrowUp
                }
                title="Vertical rate"
                state="ready"
              >
                <Text variant="h3">
                  {flight.verticalRateMs !== null
                    ? `${flight.verticalRateMs > 0 ? '+' : ''}${flight.verticalRateMs.toFixed(1)}`
                    : '—'}
                </Text>
                {flight.verticalRateMs !== null ? (
                  <Text variant="caption" color="muted">
                    m/s
                  </Text>
                ) : null}
              </SnapshotCard>
            </View>

            <View className="flex-row items-center gap-2">
              <Icon icon={Radio} size={16} color="muted" />
              <Text variant="caption" color="muted" className="flex-1">
                {flight.originCountry} · updates every {POLL_MS / 1000}s while this screen is open
              </Text>
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
