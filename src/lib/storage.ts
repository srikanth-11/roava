import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage abstraction so the backing engine can change without touching call
 * sites. Engine selection at module load:
 *  - MMKV (JSI, synchronous, fast) in the dev build / production
 *  - AsyncStorage fallback when the native module is absent (Expo Go)
 * The interface stays Promise-based so either engine fits.
 */
export interface AppStorage {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

class AsyncAppStorage implements AppStorage {
  getString(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  setString(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  delete(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }
}

interface MmkvLike {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

class MmkvAppStorage implements AppStorage {
  constructor(private readonly mmkv: MmkvLike) {}

  getString(key: string): Promise<string | null> {
    return Promise.resolve(this.mmkv.getString(key) ?? null);
  }

  setString(key: string, value: string): Promise<void> {
    this.mmkv.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.mmkv.delete(key);
    return Promise.resolve();
  }
}

function createStorage(): { storage: AppStorage; engine: 'mmkv' | 'async-storage' } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv') as { MMKV: new () => MmkvLike };
    return { storage: new MmkvAppStorage(new MMKV()), engine: 'mmkv' };
  } catch (error) {
    if (__DEV__) {
      console.warn('[storage] MMKV unavailable, falling back to AsyncStorage:', error);
    }
    return { storage: new AsyncAppStorage(), engine: 'async-storage' };
  }
}

const created = createStorage();

export const storage: AppStorage = created.storage;
/** Which engine is live — surfaced in the dev tools screens. */
export const storageEngine = created.engine;

const MIGRATION_MARKER = 'roava.storage-migrated';

/**
 * One-time AsyncStorage → MMKV copy. The engine swap (mmkv@3, Phase 9) would
 * otherwise orphan everything written during the AsyncStorage era — onboarding
 * flags, favorites, caches (the exact reset JOURNEY 7.2 warned about).
 * Call before the store rehydrates. Best-effort: a failed copy costs cached
 * state, never a crash.
 */
export async function migrateLegacyStorage(): Promise<void> {
  if (created.engine !== 'mmkv') return;
  if ((await storage.getString(MIGRATION_MARKER)) !== null) return;
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('roava.'));
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      // Never clobber: anything MMKV already has is newer than the legacy copy.
      if (value !== null && (await storage.getString(key)) === null) {
        await storage.setString(key, value);
      }
    }
  } catch {
    // Fresh state beats a boot crash.
  }
  await storage.setString(MIGRATION_MARKER, String(Date.now()));
}

export const StorageKeys = {
  themeMode: 'roava.theme-mode',
  onboardingDone: 'roava.onboarding-done',
  guestChosen: 'roava.guest-chosen',
} as const;
