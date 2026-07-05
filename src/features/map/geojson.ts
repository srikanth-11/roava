import type { Poi } from '@/repositories/pois';

/**
 * POIs → GeoJSON FeatureCollection for MapLibre's ShapeSource. GeoJSON is
 * [lon, lat] — reversed from the (lat, lon) everything else uses; getting
 * this backwards puts your markers in the ocean.
 */
export function poisToFeatureCollection(pois: Poi[]) {
  return {
    type: 'FeatureCollection' as const,
    features: pois.map((p) => ({
      type: 'Feature' as const,
      id: p.id,
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
      properties: { id: p.id, name: p.name, category: p.category },
    })),
  };
}
