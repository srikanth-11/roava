import type { LatLon } from '@/lib/geo';
import { toAppError } from '@/services/errors';
import { createHttpClient } from '@/services/http';

/**
 * Road routing via OSRM's public demo server — keyless, driving profile.
 * Best-effort instance (no SLA); callers fall back to the straight-line
 * haversine when it's unreachable or offline.
 *
 * Recon (2026-07-07): /route/v1/driving/{lon,lat};{lon,lat} → code "Ok",
 * routes[0].distance (m), .duration (s), .geometry (GeoJSON LineString of
 * [lon, lat] with overview=full).
 */

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
}

export interface RouteResult {
  distanceM: number;
  durationS: number;
  /** Polyline as (lat, lon) points, ready for lineToFeatureCollection. */
  coords: LatLon[];
}

const client = createHttpClient({
  baseURL: 'https://router.project-osrm.org',
  timeout: 12_000,
  headers: { 'User-Agent': 'Roava/0.1 (Expo learning project)' },
});

export async function getRoute(from: LatLon, to: LatLon): Promise<RouteResult> {
  try {
    const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
    const res = await client.get<OsrmResponse>(`/route/v1/driving/${coords}`, {
      params: { overview: 'full', geometries: 'geojson' },
    });
    const route = res.data.routes[0];
    if (res.data.code !== 'Ok' || !route) {
      throw new Error(`OSRM: no route (${res.data.code})`);
    }
    return {
      distanceM: route.distance,
      durationS: route.duration,
      coords: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
    };
  } catch (error) {
    throw toAppError(error);
  }
}
