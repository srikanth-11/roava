import type { LatLon } from '@/lib/geo';
import { toAppError } from '@/services/errors';
import { createHttpClient } from '@/services/http';

/**
 * Road routing via OSRM's public demo server — keyless, driving profile.
 * Best-effort instance (no SLA); callers fall back to the straight-line
 * haversine when it's unreachable or offline.
 *
 * Recon (2026-07-07): /route/v1/driving/{lon,lat};{lon,lat} → code "Ok",
 * routes[].distance (m), .duration (s), .geometry (GeoJSON LineString of
 * [lon, lat] with overview=full). `alternatives=true` returns up to 3
 * candidate routes (the demo server caps it; often 1 on short/rural trips).
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
  /** Polyline as (lat, lon) points, ready for routesToFeatureCollection. */
  coords: LatLon[];
}

const client = createHttpClient({
  baseURL: 'https://router.project-osrm.org',
  timeout: 12_000,
  headers: { 'User-Agent': 'Roava/1.0 (+https://roava.expo.app)' },
});

/** All route alternatives between two points — index 0 is OSRM's best. */
export async function getRoutes(from: LatLon, to: LatLon): Promise<RouteResult[]> {
  try {
    const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
    const res = await client.get<OsrmResponse>(`/route/v1/driving/${coords}`, {
      params: { overview: 'full', geometries: 'geojson', alternatives: 'true' },
    });
    if (res.data.code !== 'Ok' || res.data.routes.length === 0) {
      throw new Error(`OSRM: no route (${res.data.code})`);
    }
    return res.data.routes.map((route) => ({
      distanceM: route.distance,
      durationS: route.duration,
      coords: route.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
    }));
  } catch (error) {
    throw toAppError(error);
  }
}
