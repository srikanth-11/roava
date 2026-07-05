import { fetchNearbyPois, type OverpassElement } from '@/services/overpass';

export type PoiCategory = 'attraction' | 'museum' | 'viewpoint' | 'gallery' | 'park';

export interface Poi {
  id: string;
  name: string;
  category: PoiCategory;
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
    // OSM has plenty of unnamed geometry (verified: first Paris hit was a
    // nameless viewpoint) and node/way duplicates — filter and dedupe by name,
    // case-insensitively ("NANA-NANI PARK" vs "nana nani park" both exist).
    if (!name || !category) continue;
    const nameKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(nameKey)) continue;
    seen.add(nameKey);
    pois.push({ id: `${el.type}-${el.id}`, name, category });
  }
  return pois;
}

export interface PoisRepository {
  getNearby(lat: number, lon: number): Promise<Poi[]>;
}

/** Keyless public API — no mock variant needed; offline degrades the section. */
class LivePoisRepository implements PoisRepository {
  async getNearby(lat: number, lon: number): Promise<Poi[]> {
    return toPois(await fetchNearbyPois(lat, lon));
  }
}

export const poisRepository: PoisRepository = new LivePoisRepository();
