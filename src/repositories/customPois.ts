import { newId } from '@/lib/ids';
import { storage } from '@/lib/storage';
import { toAppError } from '@/services/errors';
import {
  CUSTOM_POI_SCHEMA_VERSION,
  customPoisDocumentSchema,
  type CustomPoi,
  type CustomPoiCategory,
  type CustomPoisDocument,
} from '@/types/customPoi';

/**
 * Local storage for user-added map pins — the same seam and safeguards as
 * trips (Phase 12): one versioned MMKV document, validated on every load,
 * with unreadable bytes stashed rather than discarded. Pins are keyed by
 * destination but live in one document so a single read serves any map.
 */

const STORAGE_KEY = 'roava.custom-pois';
const RECOVERY_PREFIX = 'roava.custom-pois.recovery-';

function emptyDocument(): CustomPoisDocument {
  return { schemaVersion: CUSTOM_POI_SCHEMA_VERSION, pois: [] };
}

/** Stepwise migration seam — passthrough at v1, ready before it's needed. */
function migrate(raw: { schemaVersion?: number } & Record<string, unknown>): unknown {
  return { ...raw, schemaVersion: CUSTOM_POI_SCHEMA_VERSION };
}

async function loadDocument(): Promise<CustomPoisDocument> {
  const raw = await storage.getString(STORAGE_KEY);
  if (!raw) return emptyDocument();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return customPoisDocumentSchema.parse(migrate(parsed));
  } catch {
    // Corrupt or unmigratable: preserve the bytes, then start fresh.
    await storage.setString(`${RECOVERY_PREFIX}${Date.now()}`, raw);
    return emptyDocument();
  }
}

async function saveDocument(doc: CustomPoisDocument): Promise<void> {
  await storage.setString(STORAGE_KEY, JSON.stringify(customPoisDocumentSchema.parse(doc)));
}

export interface CreateCustomPoiInput {
  destinationId: string;
  name: string;
  category: CustomPoiCategory;
  lat: number;
  lon: number;
  note?: string;
}

export interface CustomPoisRepository {
  getForDestination(destinationId: string): Promise<CustomPoi[]>;
  add(input: CreateCustomPoiInput): Promise<CustomPoi>;
  remove(id: string): Promise<void>;
}

class LocalCustomPoisRepository implements CustomPoisRepository {
  async getForDestination(destinationId: string): Promise<CustomPoi[]> {
    const doc = await loadDocument();
    return doc.pois
      .filter((p) => p.destinationId === destinationId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async add(input: CreateCustomPoiInput): Promise<CustomPoi> {
    const poi: CustomPoi = { id: newId(), createdAt: Date.now(), source: 'custom', ...input };
    const doc = await loadDocument();
    doc.pois.push(poi);
    await saveDocument(doc);
    return poi;
  }

  async remove(id: string): Promise<void> {
    const doc = await loadDocument();
    const next = doc.pois.filter((p) => p.id !== id);
    if (next.length === doc.pois.length) {
      throw toAppError(new Error(`Custom POI ${id} not found`));
    }
    doc.pois = next;
    await saveDocument(doc);
  }
}

export const customPoisRepository: CustomPoisRepository = new LocalCustomPoisRepository();
