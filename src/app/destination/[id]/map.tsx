import type { BottomSheetModal } from '@gorhom/bottom-sheet';
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
import {
  ArrowLeft,
  Building2,
  LocateFixed,
  LocateOff,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Ruler,
  Search,
  Trash2,
  X,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, ErrorState, Icon, Screen, Skeleton, Text } from '@/components/ui';
import { CrashScreen } from '@/components/shared/CrashScreen';
import { PoiRow } from '@/features/destination/PoiSection';
import { AddPoiSheet, type AddPoiValues } from '@/features/map/AddPoiSheet';
import { DirectionsBar, RoutesList, type Endpoint } from '@/features/map/DirectionsPanel';
import {
  customPoisToFeatureCollection,
  lineToFeatureCollection,
  poisToFeatureCollection,
  pointsToFeatureCollection,
  routesToFeatureCollection,
} from '@/features/map/geojson';
import { PlaceSearchSheet, type QuickOption } from '@/features/map/PlaceSearchSheet';
import { useOnline } from '@/hooks/useOnline';
import { formatDistance, haversineMeters, type LatLon } from '@/lib/geo';
import { hapticSuccess } from '@/lib/haptics';
import { MAP_STYLES, OSM_ATTRIBUTION } from '@/lib/mapStyles';
import { palette } from '@/lib/palette';
import type { Poi } from '@/repositories/pois';
import type { GeoResult } from '@/services/geocode';
import { isAppError } from '@/services/errors';
import { getRoutes, type RouteResult } from '@/services/routing';
import {
  useAddCustomPoiMutation,
  useDeleteCustomPoiMutation,
  useGetCustomPoisQuery,
  useGetMapPoisQuery,
} from '@/store/api';
import type { CustomPoi } from '@/types/customPoi';

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <CrashScreen error={props.error} retry={props.retry} />;
}

const DEFAULT_ZOOM = 12.5;

/** A tapped marker — OSM sight or a user pin; `source` discriminates them. */
type SelectedMarker = Poi | CustomPoi;

/** Bounds of a polyline for Camera.fitBounds — [west, south, east, north]. */
function boundsOf(coords: LatLon[]): [number, number, number, number] {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const c of coords) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lon < minLon) minLon = c.lon;
    if (c.lon > maxLon) maxLon = c.lon;
  }
  return [minLon, minLat, maxLon, maxLat];
}

export default function DestinationMap() {
  const params = useLocalSearchParams<{ id: string; name?: string; lat?: string; lon?: string }>();
  const destinationId = String(params.id ?? '');
  const lat = Number(params.lat);
  const lon = Number(params.lon);
  const cityName = params.name ?? 'Destination';
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  const { colorScheme } = useColorScheme();
  const scheme = colorScheme ?? 'light';
  const colors = palette[scheme];
  const online = useOnline();
  const insets = useSafeAreaInsets();
  // Every floating bottom overlay clears the gesture bar by this much.
  const bottomOffset = insets.bottom + 16;

  const { data, error, isLoading, refetch } = useGetMapPoisQuery(
    { lat, lon },
    { skip: !hasCoords },
  );
  const { data: customPois } = useGetCustomPoisQuery(destinationId, { skip: !destinationId });
  const [addCustomPoi, { isLoading: adding }] = useAddCustomPoiMutation();
  const [deleteCustomPoi] = useDeleteCustomPoiMutation();

  const cameraRef = useRef<CameraRef>(null);
  const sourceRef = useRef<GeoJSONSourceRef>(null);
  const searchSheetRef = useRef<BottomSheetModal>(null);
  const addSheetRef = useRef<BottomSheetModal>(null);
  const pickSheetRef = useRef<BottomSheetModal>(null);

  const [selected, setSelected] = useState<SelectedMarker | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [userLoc, setUserLoc] = useState<LatLon | null>(null);
  // The pin being placed but not yet saved (long-press or search result).
  const [provisional, setProvisional] = useState<{
    lat: number;
    lon: number;
    name?: string;
  } | null>(null);
  const [addSeed, setAddSeed] = useState(0);

  // Directions planner: typed/tapped endpoints → OSRM alternatives.
  const [dirActive, setDirActive] = useState(false);
  const [dirFrom, setDirFrom] = useState<Endpoint | null>(null);
  const [dirTo, setDirTo] = useState<Endpoint | null>(null);
  const [pickTarget, setPickTarget] = useState<'from' | 'to'>('from');
  const [mapPick, setMapPick] = useState(false);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [routeIdx, setRouteIdx] = useState(0);
  const [fetchingRoutes, setFetchingRoutes] = useState(false);
  const [routesFailed, setRoutesFailed] = useState(false);

  // Measure mode: collect two points → straight-line distance.
  const [measuring, setMeasuring] = useState(false);
  const [measurePts, setMeasurePts] = useState<LatLon[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
      if (cancelled) return;
      setLocationGranted(status === 'granted');
      if (status !== 'granted') return;
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      } catch {
        // Location is a nicety here — the map still works without a fix.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Monotonic ticket: a response only lands if it's still the newest request.
  const routeReqSeq = useRef(0);

  const requestRoutes = (from: Endpoint, to: Endpoint) => {
    const seq = ++routeReqSeq.current;
    setFetchingRoutes(true);
    setRoutesFailed(false);
    setRoutes([]);
    setRouteIdx(0);
    getRoutes(from, to)
      .then((rs) => {
        if (seq !== routeReqSeq.current) return;
        setRoutes(rs);
        const first = rs[0];
        if (first) {
          // Padding clears the directions bar (top) and routes list (bottom).
          cameraRef.current?.fitBounds(boundsOf(first.coords), {
            padding: { top: 180, right: 48, bottom: 260, left: 48 },
            duration: 600,
          });
        }
      })
      .catch(() => {
        if (seq === routeReqSeq.current) setRoutesFailed(true);
      })
      .finally(() => {
        if (seq === routeReqSeq.current) setFetchingRoutes(false);
      });
  };

  const openAddSheet = (pin: { lat: number; lon: number; name?: string }) => {
    setSelected(null);
    setProvisional(pin);
    setAddSeed((s) => s + 1);
    addSheetRef.current?.present();
  };

  const onLongPress = (e: { nativeEvent: { lngLat: [number, number] } }) => {
    if (dirActive) return; // planning owns the map; no pin-drops mid-route
    const [pLon, pLat] = e.nativeEvent.lngLat;
    openAddSheet({ lat: pLat, lon: pLon });
  };

  const onSearchSelect = (r: GeoResult) => {
    searchSheetRef.current?.dismiss();
    cameraRef.current?.easeTo({ center: [r.lon, r.lat], zoom: 15, duration: 500 });
    // Let the search sheet finish dismissing before presenting the add sheet.
    setTimeout(() => openAddSheet({ lat: r.lat, lon: r.lon, name: r.name }), 250);
  };

  const onAddSubmit = (values: AddPoiValues) => {
    if (!provisional) return;
    void addCustomPoi({
      destinationId,
      name: values.name,
      category: values.category,
      note: values.note,
      lat: provisional.lat,
      lon: provisional.lon,
    })
      .unwrap()
      .then(() => {
        hapticSuccess();
        addSheetRef.current?.dismiss();
        setProvisional(null);
      })
      .catch(() => {
        // Error surfaces via the mutation state; keep the sheet open to retry.
      });
  };

  const onDeleteSelected = () => {
    if (!selected || selected.source !== 'custom') return;
    void deleteCustomPoi({ id: selected.id, destinationId })
      .unwrap()
      .then(() => setSelected(null))
      .catch(() => {});
  };

  /* ------------------------- directions ------------------------- */

  const setEndpoint = (target: 'from' | 'to', ep: Endpoint) => {
    const nextFrom = target === 'from' ? ep : dirFrom;
    const nextTo = target === 'to' ? ep : dirTo;
    if (target === 'from') setDirFrom(ep);
    else setDirTo(ep);
    if (nextFrom && nextTo) requestRoutes(nextFrom, nextTo);
  };

  const openPicker = (target: 'from' | 'to') => {
    setPickTarget(target);
    setMapPick(false);
    pickSheetRef.current?.present();
  };

  const openDirections = (from: Endpoint | null, to: Endpoint | null) => {
    setSelected(null);
    setMeasuring(false);
    setMeasurePts([]);
    setRoutes([]);
    setRouteIdx(0);
    setRoutesFailed(false);
    setDirFrom(from);
    setDirTo(to);
    setDirActive(true);
    if (!from) openPicker('from');
    else if (!to) openPicker('to');
    else requestRoutes(from, to);
  };

  const closeDirections = () => {
    setDirActive(false);
    setDirFrom(null);
    setDirTo(null);
    setRoutes([]);
    setRouteIdx(0);
    setRoutesFailed(false);
    setMapPick(false);
  };

  const swapEndpoints = () => {
    setDirFrom(dirTo);
    setDirTo(dirFrom);
    if (dirFrom && dirTo) requestRoutes(dirTo, dirFrom);
  };

  const yourLocationEndpoint: Endpoint | null = userLoc
    ? { ...userLoc, label: 'Your location' }
    : null;

  const pickQuickOptions: QuickOption[] = [
    ...(yourLocationEndpoint
      ? [
          {
            id: 'me',
            icon: LocateFixed,
            label: 'Your location',
            onPress: () => {
              setEndpoint(pickTarget, yourLocationEndpoint);
              pickSheetRef.current?.dismiss();
            },
          },
        ]
      : []),
    {
      id: 'map',
      icon: MapPin,
      label: 'Choose on the map',
      onPress: () => {
        setMapPick(true);
        pickSheetRef.current?.dismiss();
      },
    },
    {
      id: 'center',
      icon: Building2,
      label: `${cityName} center`,
      onPress: () => {
        setEndpoint(pickTarget, { lat, lon, label: `${cityName} center` });
        pickSheetRef.current?.dismiss();
      },
    },
  ];

  const onPickSelect = (r: GeoResult) => {
    setEndpoint(pickTarget, { lat: r.lat, lon: r.lon, label: r.name });
    pickSheetRef.current?.dismiss();
  };

  /* --------------------------- measure --------------------------- */

  const selectMarker = (m: SelectedMarker) => {
    setSelected(m);
  };

  const addMeasurePoint = (p: LatLon) => {
    setMeasurePts((pts) => (pts.length >= 2 ? [p] : [...pts, p]));
  };

  const toggleMeasure = () => {
    setSelected(null);
    closeDirections();
    setMeasurePts([]);
    setMeasuring((v) => !v);
  };

  const [measureA, measureB] = measurePts;
  const measureDistance = measureA && measureB ? haversineMeters(measureA, measureB) : 0;
  const selectedDistance =
    userLoc && selected ? haversineMeters(userLoc, { lat: selected.lat, lon: selected.lon }) : null;
  const straightLineM = dirFrom && dirTo ? haversineMeters(dirFrom, dirTo) : null;

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
            onLongPress={onLongPress}
            onPress={(e) => {
              const [pLon, pLat] = e.nativeEvent.lngLat;
              if (dirActive && mapPick) {
                setEndpoint(pickTarget, {
                  lat: pLat,
                  lon: pLon,
                  label: `Dropped pin (${pLat.toFixed(3)}, ${pLon.toFixed(3)})`,
                });
                setMapPick(false);
                return;
              }
              if (measuring) addMeasurePoint({ lat: pLat, lon: pLon });
            }}
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
                if (dirActive && mapPick) {
                  setEndpoint(pickTarget, {
                    lat: fLat,
                    lon: fLon,
                    label: (props.name as string) ?? 'Marked place',
                  });
                  setMapPick(false);
                  return;
                }
                if (measuring) {
                  addMeasurePoint({ lat: fLat, lon: fLon });
                  return;
                }
                if (props.cluster) {
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
                  if (poi) selectMarker(poi);
                }
              }}
            >
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

            {/* User pins — own source, un-clustered, violet so they stand apart */}
            <GeoJSONSource
              id="custom-pois"
              data={customPoisToFeatureCollection(customPois ?? [])}
              onPress={(event) => {
                const feature = event.nativeEvent.features[0];
                if (feature?.geometry.type !== 'Point') return;
                const [cLon, cLat] = feature.geometry.coordinates as [number, number];
                const props = feature.properties ?? {};
                if (dirActive && mapPick) {
                  setEndpoint(pickTarget, {
                    lat: cLat,
                    lon: cLon,
                    label: (props.name as string) ?? 'Your pin',
                  });
                  setMapPick(false);
                  return;
                }
                if (measuring) {
                  addMeasurePoint({ lat: cLat, lon: cLon });
                  return;
                }
                const cp = (customPois ?? []).find((p) => p.id === props.id);
                if (cp) selectMarker(cp);
              }}
            >
              <Layer
                type="circle"
                id="custom-dots"
                paint={{
                  'circle-color': colors.mapCustom,
                  'circle-radius': 8,
                  'circle-stroke-width': 2.5,
                  'circle-stroke-color': colors.surface,
                }}
              />
            </GeoJSONSource>

            {/* Provisional pin — where a place will drop once confirmed */}
            {provisional ? (
              <GeoJSONSource
                id="provisional"
                data={{
                  type: 'FeatureCollection',
                  features: [
                    {
                      type: 'Feature',
                      geometry: { type: 'Point', coordinates: [provisional.lon, provisional.lat] },
                      properties: {},
                    },
                  ],
                }}
              >
                <Layer
                  type="circle"
                  id="provisional-ring"
                  paint={{
                    'circle-radius': 13,
                    'circle-color': colors.mapCustom,
                    'circle-opacity': 0.25,
                  }}
                />
                <Layer
                  type="circle"
                  id="provisional-dot"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': colors.mapCustom,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': colors.surface,
                  }}
                />
              </GeoJSONSource>
            ) : null}

            {/* Route alternatives — muted alternates under the selected line */}
            {dirActive && routes.length > 0 ? (
              <GeoJSONSource
                id="dir-routes"
                data={routesToFeatureCollection(routes)}
                onPress={(event) => {
                  const idx = event.nativeEvent.features[0]?.properties?.idx;
                  if (typeof idx === 'number') setRouteIdx(idx);
                }}
              >
                <Layer
                  type="line"
                  id="dir-alts"
                  filter={['!=', ['get', 'idx'], routeIdx]}
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{
                    'line-color': colors.mutedForeground,
                    'line-width': 4,
                    'line-opacity': 0.5,
                  }}
                />
                <Layer
                  type="line"
                  id="dir-selected"
                  filter={['==', ['get', 'idx'], routeIdx]}
                  layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                  paint={{ 'line-color': colors.mapRoute, 'line-width': 5, 'line-opacity': 0.9 }}
                />
              </GeoJSONSource>
            ) : null}

            {/* Trip endpoints */}
            {dirActive && (dirFrom || dirTo) ? (
              <GeoJSONSource
                id="dir-endpoints"
                data={pointsToFeatureCollection([dirFrom, dirTo].filter((e): e is Endpoint => !!e))}
              >
                <Layer
                  type="circle"
                  id="dir-endpoint-dots"
                  paint={{
                    'circle-radius': 7,
                    'circle-color': colors.mapRoute,
                    'circle-stroke-width': 2.5,
                    'circle-stroke-color': colors.surface,
                  }}
                />
              </GeoJSONSource>
            ) : null}

            {/* Measure-mode straight line + its endpoints */}
            {measurePts.length === 2 ? (
              <GeoJSONSource id="measure-line" data={lineToFeatureCollection(measurePts)}>
                <Layer
                  type="line"
                  id="measure-line-l"
                  layout={{ 'line-cap': 'round' }}
                  paint={{
                    'line-color': colors.foreground,
                    'line-width': 3,
                    'line-dasharray': [2, 2],
                  }}
                />
              </GeoJSONSource>
            ) : null}
            {measurePts.length > 0 ? (
              <GeoJSONSource id="measure-pts" data={pointsToFeatureCollection(measurePts)}>
                <Layer
                  type="circle"
                  id="measure-dots"
                  paint={{
                    'circle-radius': 6,
                    'circle-color': colors.foreground,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': colors.surface,
                  }}
                />
              </GeoJSONSource>
            ) : null}
          </MapLibreMap>
        )}

        {/* Top overlay. Directions mode swaps the control row for the planner
            bar. Drops below the OfflineBanner when offline. */}
        {dirActive && !mapFailed ? (
          <View className={`absolute inset-x-0 top-0 px-4 ${online ? 'pt-12' : 'pt-28'}`}>
            <DirectionsBar
              from={dirFrom}
              to={dirTo}
              onEditFrom={() => openPicker('from')}
              onEditTo={() => openPicker('to')}
              onSwap={swapEndpoints}
              onClose={closeDirections}
            />
            {mapPick ? (
              <View className="mt-2 items-center">
                <View className="rounded-full bg-surface/90 px-3 py-1.5">
                  <Text variant="caption" color="muted">
                    Tap the map to set the{' '}
                    {pickTarget === 'from' ? 'starting point' : 'destination'}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
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
            {isLoading ? <Skeleton className="h-8 w-20 rounded-full" /> : null}
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
            <View className="flex-1" />
            {!mapFailed ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Get directions"
                  onPress={() => openDirections(yourLocationEndpoint, null)}
                  className="h-12 w-12 items-center justify-center rounded-full bg-surface"
                >
                  <Icon icon={RouteIcon} accessibilityLabel="Directions" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={measuring ? 'Exit measure mode' : 'Measure distance'}
                  onPress={toggleMeasure}
                  className={`h-12 w-12 items-center justify-center rounded-full ${
                    measuring ? 'bg-primary' : 'bg-surface'
                  }`}
                >
                  <Icon
                    icon={Ruler}
                    color={measuring ? 'on-primary' : 'default'}
                    accessibilityLabel="Measure"
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Search to add a place"
                  onPress={() => searchSheetRef.current?.present()}
                  className="h-12 w-12 items-center justify-center rounded-full bg-surface"
                >
                  <Icon icon={Search} accessibilityLabel="Search" />
                </Pressable>
              </>
            ) : null}
          </View>
        )}

        {/* Location denied — quiet, first-class */}
        {locationGranted === false && !mapFailed && !dirActive ? (
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

        {/* Routes list — the planner's bottom panel */}
        {dirActive && !mapFailed && dirFrom && dirTo ? (
          <View className="absolute inset-x-4" style={{ bottom: bottomOffset }}>
            <RoutesList
              routes={routes}
              selectedIdx={routeIdx}
              onSelect={setRouteIdx}
              fetching={fetchingRoutes}
              failed={routesFailed}
              straightLineM={straightLineM}
            />
          </View>
        ) : null}

        {/* Long-press hint — only until the first custom pin exists */}
        {!mapFailed && !measuring && !dirActive && !selected && (customPois?.length ?? 0) === 0 ? (
          <View className="absolute inset-x-4 items-center" style={{ bottom: bottomOffset }}>
            <View className="rounded-full bg-surface/90 px-3 py-1.5">
              <Text variant="caption" color="muted">
                Long-press the map to drop a pin
              </Text>
            </View>
          </View>
        ) : null}

        {/* Measure mode banner */}
        {measuring ? (
          <View
            className="absolute inset-x-4 gap-3 rounded-lg border border-border bg-surface p-4"
            style={{ bottom: bottomOffset }}
          >
            <View className="flex-row items-center gap-3">
              <Icon icon={Ruler} color="primary" />
              <Text variant="label" className="flex-1">
                {measurePts.length === 0
                  ? 'Tap two points to measure'
                  : measurePts.length === 1
                    ? 'Tap the second point'
                    : `${formatDistance(measureDistance)} straight-line`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Exit measure mode"
                hitSlop={8}
                onPress={toggleMeasure}
                className="h-10 w-10 items-center justify-center"
              >
                <Icon icon={X} color="muted" accessibilityLabel="Exit" />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap items-center gap-2">
              {userLoc ? (
                <Button
                  label="From my location"
                  size="sm"
                  variant="outline"
                  onPress={() => userLoc && addMeasurePoint(userLoc)}
                />
              ) : null}
              {measurePts.length === 2 && measureA && measureB ? (
                <Button
                  label="Route this"
                  size="sm"
                  icon={Navigation}
                  onPress={() =>
                    openDirections(
                      { ...measureA, label: 'Point A' },
                      { ...measureB, label: 'Point B' },
                    )
                  }
                />
              ) : null}
              {measurePts.length > 0 ? (
                <Button label="Reset" size="sm" variant="ghost" onPress={() => setMeasurePts([])} />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Selected marker callout */}
        {selected && !measuring && !dirActive ? (
          <View
            className="absolute inset-x-4 gap-3 rounded-lg border border-border bg-surface p-4"
            style={{ bottom: bottomOffset }}
          >
            <View className="flex-row items-center gap-3">
              <View className="flex-1 gap-1">
                <Text variant="label" numberOfLines={1}>
                  {selected.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Badge
                    label={selected.category}
                    variant={selected.source === 'custom' ? 'default' : 'outline'}
                  />
                  {selectedDistance != null ? (
                    <Text variant="caption" color="muted">
                      {formatDistance(selectedDistance)} away
                    </Text>
                  ) : null}
                </View>
              </View>
              {selected.source === 'custom' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${selected.name}`}
                  hitSlop={8}
                  onPress={onDeleteSelected}
                  className="h-12 w-12 items-center justify-center"
                >
                  <Icon icon={Trash2} color="destructive" accessibilityLabel="Delete" />
                </Pressable>
              ) : null}
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
            <View className="flex-row items-center gap-2">
              <Button
                label="Directions"
                size="sm"
                variant="outline"
                icon={Navigation}
                onPress={() =>
                  openDirections(yourLocationEndpoint, {
                    lat: selected.lat,
                    lon: selected.lon,
                    label: selected.name,
                  })
                }
              />
            </View>
          </View>
        ) : null}

        {/* OSM attribution — the one obligation the data carries */}
        {!mapFailed ? (
          <View
            className="absolute right-2 rounded-sm bg-surface/80 px-1.5 py-0.5"
            style={{ bottom: Math.max(insets.bottom, 8) }}
          >
            <Text variant="caption" color="muted">
              {OSM_ATTRIBUTION}
            </Text>
          </View>
        ) : null}
      </View>

      <PlaceSearchSheet ref={searchSheetRef} near={{ lat, lon }} onSelect={onSearchSelect} />
      <PlaceSearchSheet
        ref={pickSheetRef}
        near={{ lat, lon }}
        onSelect={onPickSelect}
        title={pickTarget === 'from' ? 'Starting point' : 'Destination'}
        quickOptions={pickQuickOptions}
      />
      <AddPoiSheet
        ref={addSheetRef}
        seed={addSeed}
        defaultName={provisional?.name}
        onSubmit={onAddSubmit}
        submitting={adding}
      />
    </Screen>
  );
}
