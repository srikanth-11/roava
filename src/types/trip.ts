import { z } from 'zod';

/**
 * Zod schemas are the single source of truth for trip data: the repository
 * validates documents with them on load/save, and the forms validate input
 * with subsets of them. Types are inferred, never hand-written twice.
 */

export const TRIPS_SCHEMA_VERSION = 1;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const itineraryItemSchema = z.object({
  id: z.string(),
  /** 0-based day within the trip. */
  dayIndex: z.number().int().min(0),
  /** Position within the day — drag-reorder rewrites these. */
  order: z.number().int().min(0),
  title: z.string().min(1, 'Give it a name').max(120),
  /** Optional "HH:MM". */
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24h HH:MM')
    .optional(),
  note: z.string().max(500).optional(),
});

export const BUDGET_CATEGORIES = [
  'transport',
  'stay',
  'food',
  'activities',
  'shopping',
  'other',
] as const;

export const budgetEntrySchema = z.object({
  id: z.string(),
  amount: z.number().positive('Amount must be positive'),
  /** ISO-4217 — rendered with the Phase 10 money formatter. */
  currency: z.string().length(3),
  category: z.enum(BUDGET_CATEGORIES),
  note: z.string().max(200).optional(),
  /** Epoch ms. */
  spentAt: z.number(),
});

export const packingItemSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Name the item').max(80),
  packed: z.boolean(),
});

export const tripSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name your trip').max(80),
  /** Optional link back to a destination (display only for now). */
  destinationName: z.string().max(80).optional(),
  startDate: isoDate,
  endDate: isoDate,
  notes: z.string().max(5000),
  itinerary: z.array(itineraryItemSchema),
  budget: z.array(budgetEntrySchema),
  packing: z.array(packingItemSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const tripsDocumentSchema = z.object({
  schemaVersion: z.number().int(),
  trips: z.array(tripSchema),
});

export type ItineraryItem = z.infer<typeof itineraryItemSchema>;
export type BudgetEntry = z.infer<typeof budgetEntrySchema>;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];
export type PackingItem = z.infer<typeof packingItemSchema>;
export type Trip = z.infer<typeof tripSchema>;
export type TripsDocument = z.infer<typeof tripsDocumentSchema>;

/** Inclusive day count — a Fri→Sun trip is 3 days. */
export function tripDayCount(trip: Pick<Trip, 'startDate' | 'endDate'>): number {
  const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  const end = new Date(`${trip.endDate}T00:00:00Z`).getTime();
  return Math.max(Math.round((end - start) / 86_400_000) + 1, 1);
}
