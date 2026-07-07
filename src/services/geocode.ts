import type { LatLon } from '@/lib/geo';
import { toAppError } from '@/services/errors';
import { createHttpClient } from '@/services/http';

/**
 * Forward geocoding via Photon (photon.komoot.io) — keyless, OSM-backed, built
 * for typeahead. Same citizenship as the Overpass client: identify with a
 * User-Agent, keep it light. Best-effort public instance (no SLA) — callers
 * degrade to long-press-to-drop when it's unreachable.
 *
 * Recon (2026-07-07): GeoJSON FeatureCollection; geometry.coordinates are
 * [lon, lat]; properties carry name (sometimes absent), street/housenumber,
 * city/state/country, and osm_key/osm_value semantic tags.
 */

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  country?: string;
  osm_key?: string;
  osm_value?: string;
  osm_id?: number;
  osm_type?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

export interface GeoResult {
  id: string;
  /** Best display label — name, else a composed street/city fallback. */
  name: string;
  /** "Mumbai, Maharashtra, India" — the place in context. */
  subtitle: string;
  lat: number;
  lon: number;
}

const client = createHttpClient({
  baseURL: 'https://photon.komoot.io',
  timeout: 8000,
  headers: { 'User-Agent': 'Roava/0.1 (Expo learning project)' },
});

function labelOf(p: PhotonProperties): string {
  if (p.name) return p.name;
  if (p.street) return p.housenumber ? `${p.housenumber} ${p.street}` : p.street;
  return p.city ?? 'Unnamed place';
}

function subtitleOf(p: PhotonProperties): string {
  return [p.city, p.state, p.country].filter(Boolean).join(', ');
}

/** Typeahead search, optionally biased toward `near`. Aborts via `signal`. */
export async function searchPlaces(
  query: string,
  near?: LatLon,
  signal?: AbortSignal,
): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await client.get<PhotonResponse>('/api', {
      signal,
      params: {
        q,
        limit: 8,
        ...(near ? { lat: near.lat, lon: near.lon } : {}),
      },
    });
    return res.data.features
      .map((f, i) => {
        const [lon, lat] = f.geometry.coordinates;
        const p = f.properties;
        return {
          id: `${p.osm_type ?? 'x'}${p.osm_id ?? i}`,
          name: labelOf(p),
          subtitle: subtitleOf(p),
          lat,
          lon,
        };
      })
      .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon));
  } catch (error) {
    throw toAppError(error);
  }
}
