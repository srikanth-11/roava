import { z } from 'zod';

/**
 * User-added map pins — the attractions OSM doesn't list. Same storage
 * discipline as trips (versioned doc, zod-validated on load). `source` is a
 * constant discriminator so the map's callout can treat these and OSM `Poi`s
 * as one union.
 */

export const CUSTOM_POI_SCHEMA_VERSION = 1;

export const CUSTOM_POI_CATEGORIES = [
  'sight',
  'food',
  'stay',
  'shopping',
  'nature',
  'other',
] as const;

export const customPoiSchema = z.object({
  id: z.string(),
  /** Which destination's map this pin belongs to. */
  destinationId: z.string(),
  name: z.string().min(1, 'Name the place').max(120),
  category: z.enum(CUSTOM_POI_CATEGORIES),
  lat: z.number(),
  lon: z.number(),
  note: z.string().max(300).optional(),
  createdAt: z.number(),
  source: z.literal('custom'),
});

export const customPoisDocumentSchema = z.object({
  schemaVersion: z.number().int(),
  pois: z.array(customPoiSchema),
});

export type CustomPoi = z.infer<typeof customPoiSchema>;
export type CustomPoiCategory = (typeof CUSTOM_POI_CATEGORIES)[number];
export type CustomPoisDocument = z.infer<typeof customPoisDocumentSchema>;

export const CUSTOM_POI_CATEGORY_LABEL: Record<CustomPoiCategory, string> = {
  sight: 'Sight',
  food: 'Food & drink',
  stay: 'Stay',
  shopping: 'Shopping',
  nature: 'Nature',
  other: 'Other',
};
