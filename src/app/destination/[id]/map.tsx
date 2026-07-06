import {
  Camera,
  GeoJSONSource,
  Layer,
  Map as MapLibreMap,
  UserLocation,
  type CameraRef,
  type GeoJSONSourceRef,
} from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams, type ErrorBoundaryProps } from 'expo-router';
import { ArrowLeft, LocateOff, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

import { Badge, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { PoiRow } from '@/features/destination/PoiSection';
import { useOnline } from '@/hooks/useOnline';
import { poisToFeatureCollection } from '@/features/map/geojson';
import { MAP_STYLES, OSM_ATTRIBUTION } from '@/lib/mapStyles';
import { palette } from '@/lib/palette';
import type { Poi } from '@/repositories/pois';
import { isAppError } from '@/services/errors';
import { useGetMapPoisQuery } from '@/store/api';
import { CrashScreen } from '@/components/shared/CrashScreen';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <CrashScreen error={props.error} retry={props.retry} />;
}

const DEFAULT_ZOOM = 12.5;

export default function DestinationMap() {
  const params = useLocalSearchParams<{ id: string; name?: string; lat?: string; lon?: string }>();
  const lat = Number(params.lat);
  const lon = Number(params.lon);
  const cityName = params.name ?? 'Destination';
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const colors = palette[scheme];
  const online = useOnline();

  const { data, error, isLoading, refetch } = useGetMapPoisQuery(
    { lat, lon },
    { skip: !hasCoords },
  );

  const cameraRef = useRef<CameraRef>(null);
  const sourceRef = useRef<GeoJSONSourceRef>(null);
  const [selected, setSelected] = useState<Poi | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (!cancelled) setLocationGranted(status === 'granted');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hasCoords) {
    return (
      <Screen>
        <ErrorState
          title="Missing location"
          message="Open the map from a destination so it knows where to look."
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['left', 'right']}>
      <View className="flex-1">
        {mapFailed ? (
          // The map is an upgrade, not a dependency — style/tiles unreachable
          // degrades to the same POI list the detail screen uses.
          <View className="flex-1 gap-3 px-4 pt-14">
            <Text variant="h2">{cityName} — nearby</Text>
            <Text variant="body-sm" color="muted">
              The map could not load — here is the list instead.
            </Text>
            {(data ?? []).slice(0, 30).map((poi) => (
              <PoiRow key={poi.id} poi={poi} />
            ))}
          </View>
        ) : (
          <MapLibreMap
            style={{ flex: 1 }}
            mapStyle={MAP_STYLES[scheme]}
            attribution={false}
            logo={false}
            onDidFailLoadingMap={() => setMapFailed(true)}
          >
            <Camera ref={cameraRef} initialViewState={{ center: [lon, lat], zoom: DEFAULT_ZOOM }} />

            {locationGranted ? <UserLocation /> : null}

            <GeoJSONSource
              ref={sourceRef}
              id="pois"
              data={poisToFeatureCollection(data ?? [])}
              cluster
              clusterRadius={50}
              onPress={(event) => {
                const feature = event.nativeEvent.features[0];
                if (!feature || feature.geometry.type !== 'Point') return;
                const [fLon, fLat] = feature.geometry.coordinates as [number, number];
                const props = feature.properties ?? {};
                if (props.cluster) {
                  // Cluster tap → ask the source how deep the cluster unpacks,
                  // then ease the camera there; MapLibre re-clusters live.
                  void sourceRef.current
                    ?.getClusterExpansionZoom(props.cluster_id as number)
                    .then((zoom) => {
                      cameraRef.current?.easeTo({
                        center: [fLon, fLat],
                        zoom: Math.min(zoom + 0.5, 17),
                        duration: 450,
                      });
                    })
                    .catch(() => {});
                } else {
                  const poi = (data ?? []).find((p) => p.id === props.id);
                  if (poi) setSelected(poi);
                }
              }}
            >
              {/* Cluster bubbles */}
              <Layer
                type="circle"
                id="cluster-circles"
                filter={['has', 'point_count']}
                paint={{
                  'circle-color': colors.primary,
                  'circle-radius': ['step', ['get', 'point_count'], 16, 25, 22, 75, 28],
                  'circle-opacity': 0.85,
                }}
              />
              <Layer
                type="symbol"
                id="cluster-counts"
                filter={['has', 'point_count']}
                layout={{
                  'text-field': ['get', 'point_count_abbreviated'],
                  'text-size': 13,
                  'text-font': ['Noto Sans Regular'],
                  'text-allow-overlap': true,
                }}
                paint={{ 'text-color': colors.onPrimary }}
              />
              {/* Single POIs */}
              <Layer
                type="circle"
                id="poi-dots"
                filter={['!', ['has', 'point_count']]}
                paint={{
                  'circle-color': colors.secondary,
                  'circle-radius': 7,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': colors.surface,
                }}
              />
            </GeoJSONSource>
          </MapLibreMap>
        )}

        {/* Top overlay: back + title + query state. The OfflineBanner owns the
            top edge when offline — drop the header below it or its controls
            (incl. the POI retry chip) become unreachable exactly when needed. */}
        <View
          className={`absolute inset-x-0 top-0 flex-row items-center gap-3 px-4 ${
            online ? 'pt-12' : 'pt-28'
          }`}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full bg-surface"
          >
            <Icon icon={ArrowLeft} accessibilityLabel="Back" />
          </Pressable>
          <View className="rounded-full bg-surface px-4 py-2">
            <Text variant="label">{cityName}</Text>
          </View>
          {isLoading ? <Skeleton className="h-8 w-24 rounded-full" /> : null}
          {error ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading sights"
              onPress={() => void refetch()}
              className="rounded-full bg-surface px-3 py-2"
            >
              <Text variant="caption" color="destructive">
                {isAppError(error) ? 'Sights failed — retry' : 'Retry'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Location denied — quiet, first-class */}
        {locationGranted === false && !mapFailed ? (
          <View className="absolute inset-x-4 top-28 flex-row items-center gap-2 rounded-lg bg-surface p-3">
            <Icon icon={LocateOff} size={16} color="muted" />
            <Text variant="caption" color="muted" className="flex-1">
              Location is off — showing {cityName}.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings to grant location"
              hitSlop={8}
              onPress={() => void Linking.openSettings()}
            >
              <Text variant="caption" color="primary">
                Settings
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Selected POI callout */}
        {selected ? (
          <View className="absolute inset-x-4 bottom-10 flex-row items-center gap-3 rounded-lg border border-border bg-surface p-4">
            <View className="flex-1 gap-1">
              <Text variant="label" numberOfLines={1}>
                {selected.name}
              </Text>
              <View className="flex-row">
                <Badge label={selected.category} variant="outline" />
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close details"
              hitSlop={8}
              onPress={() => setSelected(null)}
              className="h-12 w-12 items-center justify-center"
            >
              <Icon icon={X} color="muted" accessibilityLabel="Close" />
            </Pressable>
          </View>
        ) : null}

        {/* OSM attribution — the one obligation the data carries */}
        {!mapFailed ? (
          <View className="absolute bottom-2 right-2 rounded-sm bg-surface/80 px-1.5 py-0.5">
            <Text variant="caption" color="muted">
              {OSM_ATTRIBUTION}
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
