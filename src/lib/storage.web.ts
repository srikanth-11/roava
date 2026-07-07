import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Web build of the storage layer — AsyncStorage only (localStorage-backed).
 * MMKV is a native TurboModule with no web build, so the shared storage.ts is
 * replaced by this file for the web bundle (the EAS-Hosted share pages).
 * Same public surface as storage.ts.
 */
export interface AppStorage {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
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
  async getAllKeys(): Promise<string[]> {
    return [...(await AsyncStorage.getAllKeys())];
  }
}

export const storage: AppStorage = new AsyncAppStorage();
export const storageEngine = 'async-storage' as const;

/** No MMKV on web → nothing to migrate. */
export async function migrateLegacyStorage(): Promise<void> {}

export const StorageKeys = {
  themeMode: 'roava.theme-mode',
  onboardingDone: 'roava.onboarding-done',
  guestChosen: 'roava.guest-chosen',
} as const;
