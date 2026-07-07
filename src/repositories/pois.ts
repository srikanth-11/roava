import { fetchNearbyPois, type OverpassElement } from '@/services/overpass';

export type PoiCategory = 'attraction' | 'museum' | 'viewpoint' | 'gallery' | 'park';

export interface Poi {
  id: string;
  name: string;
  category: PoiCategory;
  lat: number;
  lon: number;
  /** Discriminator so the map's callout can treat OSM and custom pins as one. */
  source: 'osm';
}

function categoryOf(tags: Record<string, string>): PoiCategory | null {
  if (tags.leisure === 'park') return 'park';
  const t = tags.tourism;
  if (t === 'attraction' || t === 'museum' || t === 'viewpoint' || t === 'gallery') return t;
  return null;
}

function toPois(elements: OverpassElement[]): Poi[] {
  const seen = new Set<string>();
  const pois: Poi[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    const category = categoryOf(tags);
    // Nodes carry coords directly; ways carry a computed `center` (out center).
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    // OSM has plenty of unnamed geometry (verified: first Paris hit was a
    // nameless viewpoint) and node/way duplicates — filter and dedupe by name,
    // case-insensitively ("NANA-NANI PARK" vs "nana nani park" both exist).
    if (!name || !category || lat === undefined || lon === undefined) continue;
    const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(nameKey)) continue;
    seen.add(nameKey);
    pois.push({ id: `${el.type}-${el.id}`, name, category, lat, lon, source: 'osm' });
  }
  return pois;
}

export interface PoisRepository {
  /** Detail-screen list (~30). */
  getNearby(lat: number, lon: number): Promise<Poi[]>;
  /** Map context — enough markers to make clustering earn its keep. */
  getNearbyForMap(lat: number, lon: number): Promise<Poi[]>;
}

/** Keyless public API — no mock variant needed; offline degrades the section. */
class LivePoisRepository implements PoisRepository {
  async getNearby(lat: number, lon: number): Promise<Poi[]> {
    return toPois(await fetchNearbyPois(lat, lon));
  }

  async getNearbyForMap(lat: number, lon: number): Promise<Poi[]> {
    // Wider net for the map: bigger radius AND more results — the 10.3
    // timeout guard in the service still protects dense cities.
    return toPois(await fetchNearbyPois(lat, lon, 6000, 200));
  }
}

export const poisRepository: PoisRepository = new LivePoisRepository();
