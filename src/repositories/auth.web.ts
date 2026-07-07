import type { AuthUser } from '@/types/auth';

/**
 * Web build of the auth repository — mock only. The Google Sign-In native
 * module has no web build, so the shared auth.ts (which imports it) is
 * replaced by this file for the web bundle. Same public surface used by the
 * store (authRepository, authProviderName).
 */
export interface AuthRepository {
  signIn(): Promise<AuthUser>;
  signOut(): Promise<void>;
}

class WebMockAuthRepository implements AuthRepository {
  async signIn(): Promise<AuthUser> {
    return { id: 'web-guest', name: 'Traveler', email: '', photoUrl: null };
  }
  async signOut(): Promise<void> {}
}

export const authRepository: AuthRepository = new WebMockAuthRepository();
export const authProviderName = 'mock' as const;
