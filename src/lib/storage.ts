import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage abstraction so the backing engine can change without touching call sites.
 * Currently AsyncStorage (works in Expo Go); swaps to MMKV once we move to a
 * development build in Phase 4 (MMKV needs custom native code).
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

export const storage: AppStorage = new AsyncAppStorage();

export const StorageKeys = {
  themeMode: 'roava.theme-mode',
} as const;
