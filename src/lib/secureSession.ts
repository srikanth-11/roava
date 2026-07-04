import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/types/auth';

/**
 * Sessions live in expo-secure-store (Android Keystore-backed encryption) —
 * NEVER in AppStorage. Identity data is exactly what "sensitive" means.
 */
const SESSION_KEY = 'roava.session';

export async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    // Corrupt/unreadable session → treat as signed out, never crash startup.
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
