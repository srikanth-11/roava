import { storage } from '@/lib/storage';
import { toAppError } from '@/services/errors';

/**
 * Shared storage-JSON helpers — one home for the parse-guard and the
 * TTL + stale-if-error pattern that currency, weather, and destination
 * snapshots all use (previously copied per repository).
 */

/** Parse a stored JSON value; missing or corrupt → null, never a throw. */
export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await storage.getString(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  await storage.setString(key, JSON.stringify(value));
}

/**
 * Fresh cache → serve; expired → refetch and store; refetch fails → serve the
 * expired value labeled `isStale`, else rethrow as AppError.
 */
export async function cachedJson<T extends { fetchedAt: number }>(
  key: string,
  ttlMs: number,
  fetchFresh: () => Promise<T>,
): Promise<T & { isStale: boolean }> {
  const cached = await readJson<T>(key);
  if (cached && Date.now() - cached.fetchedAt < ttlMs) {
    return { ...cached, isStale: false };
  }
  try {
    const fresh = await fetchFresh();
    await writeJson(key, fresh);
    return { ...fresh, isStale: false };
  } catch (error) {
    // Stale-if-error: an old value beats no value — as long as we say so.
    if (cached) return { ...cached, isStale: true };
    throw toAppError(error);
  }
}
