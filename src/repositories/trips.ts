import { newId } from '@/lib/ids';
import { storage } from '@/lib/storage';
import { toAppError } from '@/services/errors';
import {
  TRIPS_SCHEMA_VERSION,
  tripsDocumentSchema,
  type BudgetCategory,
  type Trip,
  type TripsDocument,
} from '@/types/trip';

/**
 * 100% local trip storage behind the same repository seam as every remote
 * source — a future sync backend replaces this class, not the screens.
 * The document is versioned and validated on every load; unreadable data is
 * stashed for recovery, NEVER silently discarded (this is the first data in
 * the app the user genuinely cannot re-download).
 */

const STORAGE_KEY = 'roava.trips';
const RECOVERY_PREFIX = 'roava.trips.recovery-';

function emptyDocument(): TripsDocument {
  return { schemaVersion: TRIPS_SCHEMA_VERSION, trips: [] };
}

async function loadDocument(): Promise<TripsDocument> {
  const raw = await storage.getString(STORAGE_KEY);
  if (!raw) return emptyDocument();

  try {
    // schemaVersion is stored and validated; the day it bumps to 2, a migrate
    // step slots in right here, between parse and validate.
    return tripsDocumentSchema.parse(JSON.parse(raw));
  } catch {
    // Corrupt or unmigratable: preserve the bytes for manual recovery, then
    // start fresh. Losing the handle to data is recoverable; overwriting the
    // data is not.
    await storage.setString(`${RECOVERY_PREFIX}${Date.now()}`, raw);
    return emptyDocument();
  }
}

async function saveDocument(doc: TripsDocument): Promise<void> {
  await storage.setString(STORAGE_KEY, JSON.stringify(tripsDocumentSchema.parse(doc)));
}

/** Load → transform one trip → save → return the updated trip. */
async function updateWith(tripId: string, transform: (trip: Trip) => Trip): Promise<Trip> {
  const doc = await loadDocument();
  const index = doc.trips.findIndex((t) => t.id === tripId);
  if (index === -1) {
    throw toAppError(new Error(`Trip ${tripId} not found`));
  }
  const updated = { ...transform(doc.trips[index] as Trip), updatedAt: Date.now() };
  doc.trips[index] = updated;
  await saveDocument(doc);
  return updated;
}

export interface CreateTripInput {
  name: string;
  destinationName?: string;
  startDate: string;
  endDate: string;
}

export interface TripsRepository {
  getTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  createTrip(input: CreateTripInput): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
  setNotes(tripId: string, notes: string): Promise<Trip>;

  addItineraryItem(
    tripId: string,
    input: { dayIndex: number; title: string; time?: string; note?: string },
  ): Promise<Trip>;
  deleteItineraryItem(tripId: string, itemId: string): Promise<Trip>;
  /** Persist a drag-reorder: `orderedIds` is the day's new top-to-bottom order. */
  reorderItinerary(tripId: string, dayIndex: number, orderedIds: string[]): Promise<Trip>;

  addBudgetEntry(
    tripId: string,
    input: { amount: number; currency: string; category: BudgetCategory; note?: string },
  ): Promise<Trip>;
  deleteBudgetEntry(tripId: string, entryId: string): Promise<Trip>;

  addPackingItem(tripId: string, label: string): Promise<Trip>;
  togglePackingItem(tripId: string, itemId: string): Promise<Trip>;
  deletePackingItem(tripId: string, itemId: string): Promise<Trip>;
}

class LocalTripsRepository implements TripsRepository {
  async getTrips(): Promise<Trip[]> {
    const doc = await loadDocument();
    // Soonest-departing first; past trips sink.
    return [...doc.trips].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  async getTrip(id: string): Promise<Trip | null> {
    const doc = await loadDocument();
    return doc.trips.find((t) => t.id === id) ?? null;
  }

  async createTrip(input: CreateTripInput): Promise<Trip> {
    const now = Date.now();
    const trip: Trip = {
      id: newId(),
      name: input.name,
      destinationName: input.destinationName,
      startDate: input.startDate,
      endDate: input.endDate,
      notes: '',
      itinerary: [],
      budget: [],
      packing: [],
      createdAt: now,
      updatedAt: now,
    };
    const doc = await loadDocument();
    doc.trips.push(trip);
    await saveDocument(doc);
    return trip;
  }

  async deleteTrip(id: string): Promise<void> {
    const doc = await loadDocument();
    doc.trips = doc.trips.filter((t) => t.id !== id);
    await saveDocument(doc);
  }

  async setNotes(tripId: string, notes: string): Promise<Trip> {
    return updateWith(tripId, (t) => ({ ...t, notes }));
  }

  async addItineraryItem(
    tripId: string,
    input: { dayIndex: number; title: string; time?: string; note?: string },
  ): Promise<Trip> {
    return updateWith(tripId, (t) => {
      const dayItems = t.itinerary.filter((i) => i.dayIndex === input.dayIndex);
      return {
        ...t,
        itinerary: [
          ...t.itinerary,
          {
            id: newId(),
            dayIndex: input.dayIndex,
            order: dayItems.length,
            title: input.title,
            time: input.time,
            note: input.note,
          },
        ],
      };
    });
  }

  async deleteItineraryItem(tripId: string, itemId: string): Promise<Trip> {
    return updateWith(tripId, (t) => ({
      ...t,
      itinerary: t.itinerary.filter((i) => i.id !== itemId),
    }));
  }

  async reorderItinerary(tripId: string, dayIndex: number, orderedIds: string[]): Promise<Trip> {
    return updateWith(tripId, (t) => ({
      ...t,
      itinerary: t.itinerary.map((item) => {
        if (item.dayIndex !== dayIndex) return item;
        const order = orderedIds.indexOf(item.id);
        return order === -1 ? item : { ...item, order };
      }),
    }));
  }

  async addBudgetEntry(
    tripId: string,
    input: { amount: number; currency: string; category: BudgetCategory; note?: string },
  ): Promise<Trip> {
    return updateWith(tripId, (t) => ({
      ...t,
      budget: [...t.budget, { id: newId(), spentAt: Date.now(), ...input }],
    }));
  }

  async deleteBudgetEntry(tripId: string, entryId: string): Promise<Trip> {
    return updateWith(tripId, (t) => ({
      ...t,
      budget: t.budget.filter((e) => e.id !== entryId),
    }));
  }

  async addPackingItem(tripId: string, label: string): Promise<Trip> {
    return updateWith(tripId, (t) => ({
      ...t,
      packing: [...t.packing, { id: newId(), label, packed: false }],
    }));
  }

  async togglePackingItem(tripId: string, itemId: string): Promise<Trip> {
    return updateWith(tripId, (t) => ({
      ...t,
      packing: t.packing.map((p) => (p.id === itemId ? { ...p, packed: !p.packed } : p)),
    }));
  }

  async deletePackingItem(tripId: string, itemId: string): Promise<Trip> {
    return updateWith(tripId, (t) => ({
      ...t,
      packing: t.packing.filter((p) => p.id !== itemId),
    }));
  }
}

export const tripsRepository: TripsRepository = new LocalTripsRepository();

/**
 * Command union for the single RTK `updateTrip` mutation — nine endpoints of
 * identical shape would be boilerplate; one typed command keeps the API layer
 * lean while the repository keeps its explicit, testable methods.
 */
export type TripCommand =
  | { kind: 'setNotes'; notes: string }
  | { kind: 'addItinerary'; dayIndex: number; title: string; time?: string; note?: string }
  | { kind: 'deleteItinerary'; itemId: string }
  | { kind: 'reorderItinerary'; dayIndex: number; orderedIds: string[] }
  | {
      kind: 'addBudget';
      amount: number;
      currency: string;
      category: BudgetCategory;
      note?: string;
    }
  | { kind: 'deleteBudget'; entryId: string }
  | { kind: 'addPacking'; label: string }
  | { kind: 'togglePacking'; itemId: string }
  | { kind: 'deletePacking'; itemId: string };

export function applyTripCommand(tripId: string, command: TripCommand): Promise<Trip> {
  switch (command.kind) {
    case 'setNotes':
      return tripsRepository.setNotes(tripId, command.notes);
    case 'addItinerary':
      return tripsRepository.addItineraryItem(tripId, command);
    case 'deleteItinerary':
      return tripsRepository.deleteItineraryItem(tripId, command.itemId);
    case 'reorderItinerary':
      return tripsRepository.reorderItinerary(tripId, command.dayIndex, command.orderedIds);
    case 'addBudget':
      return tripsRepository.addBudgetEntry(tripId, command);
    case 'deleteBudget':
      return tripsRepository.deleteBudgetEntry(tripId, command.entryId);
    case 'addPacking':
      return tripsRepository.addPackingItem(tripId, command.label);
    case 'togglePacking':
      return tripsRepository.togglePackingItem(tripId, command.itemId);
    case 'deletePacking':
      return tripsRepository.deletePackingItem(tripId, command.itemId);
  }
}
