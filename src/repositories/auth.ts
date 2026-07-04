import { toAppError } from '@/services/errors';
import type { AuthUser } from '@/types/auth';

export interface AuthRepository {
  signIn(): Promise<AuthUser>;
  signOut(): Promise<void>;
}

/**
 * Real Google Sign-In. Requires a Web Client ID from Google Cloud Console
 * (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) and the Android OAuth client registered
 * with this app's package + debug SHA-1. Native module — dev build only.
 */
export class GoogleAuthRepository implements AuthRepository {
  private configured = false;

  private async ensureConfigured() {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!webClientId) {
      throw toAppError(
        new Error('Google OAuth not configured — set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env'),
      );
    }
    if (!this.configured) {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId });
      this.configured = true;
    }
  }

  async signIn(): Promise<AuthUser> {
    await this.ensureConfigured();
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      throw toAppError(new Error('Sign-in cancelled'));
    }
    const { user } = response.data;
    return {
      id: user.id,
      name: user.name ?? 'Traveler',
      email: user.email,
      photoUrl: user.photo ?? null,
    };
  }

  async signOut(): Promise<void> {
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut();
  }
}

/** Exercises the full auth flow (UI → slice → SecureStore) with no Google account. */
export class MockAuthRepository implements AuthRepository {
  async signIn(): Promise<AuthUser> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      id: 'mock-user-1',
      name: 'Kasir Traveler',
      email: 'kasir@roava.dev',
      photoUrl: null,
    };
  }

  async signOut(): Promise<void> {
    // nothing to revoke
  }
}

/**
 * Provider selection: real Google when a client ID is configured, mock
 * otherwise — so development never blocks on cloud-console setup.
 */
export const authRepository: AuthRepository = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  ? new GoogleAuthRepository()
  : new MockAuthRepository();

export const authProviderName = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'google' : 'mock';
