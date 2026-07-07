import type { LatLon } from '@/lib/geo';
import type { Poi } from '@/repositories/pois';
import type { CustomPoi } from '@/types/customPoi';

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

/** Custom pins get their own source — un-clustered, distinct color. */
export function customPoisToFeatureCollection(pois: CustomPoi[]) {
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

/** Bare points (e.g. measure-mode taps) → FeatureCollection. */
export function pointsToFeatureCollection(points: LatLon[]) {
  return {
    type: 'FeatureCollection' as const,
    features: points.map((p, i) => ({
      type: 'Feature' as const,
      id: `pt-${i}`,
      geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
      properties: {},
    })),
  };
}

/** A path (OSRM route or a straight measure line) → single-feature collection. */
export function lineToFeatureCollection(coords: LatLon[]) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: coords.map((c) => [c.lon, c.lat]),
        },
        properties: {},
      },
    ],
  };
}
