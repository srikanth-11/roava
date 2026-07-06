import { createListenerMiddleware } from '@reduxjs/toolkit';

import { storage } from '@/lib/storage';
import type { CacheState } from '@/store/cacheSlice';
import type { CurrencyState } from '@/store/currencySlice';
import type { FavoritesState } from '@/store/favoritesSlice';
import type { SettingsState } from '@/store/settingsSlice';

/**
 * Hand-rolled selective persistence: whitelisted slices are written to
 * AppStorage (debounced) on every change and loaded back before the store is
 * created. Same job redux-persist does — visible, typed, and engine-agnostic.
 */
const STORAGE_PREFIX = 'roava.state.';
const WHITELIST = ['cache', 'favorites', 'currency', 'settings'] as const;
type PersistedSlice = (typeof WHITELIST)[number];

interface PersistedShape {
  cache: CacheState;
  favorites: FavoritesState;
  currency: CurrencyState;
  settings: SettingsState;
}

// Generic K correlates key and value — a plain loop variable is a union, and
// TS would demand the value satisfy EVERY slice type at once.
async function loadSlice<K extends PersistedSlice>(
  slice: K,
  into: Partial<PersistedShape>,
): Promise<void> {
  try {
    const raw = await storage.getString(`${STORAGE_PREFIX}${slice}`);
    if (raw) {
      into[slice] = JSON.parse(raw) as PersistedShape[K];
    }
  } catch {
    // Corrupt persisted state is discarded, never fatal.
  }
}

export async function loadPersistedState(): Promise<Partial<PersistedShape>> {
  const result: Partial<PersistedShape> = {};
  await Promise.all(WHITELIST.map((slice) => loadSlice(slice, result)));
  return result;
}

export const persistenceListener = createListenerMiddleware();

persistenceListener.startListening({
  predicate: (_action, currentState, previousState) => {
    const curr = currentState as PersistedShape;
    const prev = previousState as PersistedShape;
    return WHITELIST.some((slice) => curr[slice] !== prev[slice]);
  },
  effect: async (_action, listenerApi) => {
    // Debounce bursts: cancel pending writes, wait, write once.
    listenerApi.cancelActiveListeners();
    await listenerApi.delay(400);
    const state = listenerApi.getState() as PersistedShape;
    await Promise.all(
      WHITELIST.map((slice) =>
        storage.setString(`${STORAGE_PREFIX}${slice}`, JSON.stringify(state[slice])),
      ),
    );
  },
});
