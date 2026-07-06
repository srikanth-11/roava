import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { clearSession, loadSession, saveSession } from '@/lib/secureSession';
import { authProviderName, authRepository } from '@/repositories/auth';
import { toAppError } from '@/services/errors';
import type { Session } from '@/types/auth';

export interface AuthState {
  session: Session | null;
  /** restoring: reading SecureStore at boot; signingIn: provider flow active */
  status: 'restoring' | 'signedOut' | 'signingIn' | 'signedIn';
  errorMessage: string | null;
}

const initialState: AuthState = {
  session: null,
  status: 'restoring',
  errorMessage: null,
};

export const restoreSession = createAsyncThunk('auth/restore', async () => {
  return loadSession();
});

export const signIn = createAsyncThunk('auth/signIn', async (_, { rejectWithValue }) => {
  try {
    const user = await authRepository.signIn();
    const session: Session = {
      user,
      provider: authProviderName,
      issuedAt: Date.now(),
    };
    await saveSession(session);
    return session;
  } catch (error) {
    return rejectWithValue(toAppError(error).userMessage);
  }
});

export const signOut = createAsyncThunk('auth/signOut', async () => {
  try {
    // Provider revocation is best-effort — a Google hiccup must never
    // hold the LOCAL session hostage.
    await authRepository.signOut();
  } catch {
    // continue: local sign-out is the guarantee
  }
  await clearSession();
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = action.payload ? 'signedIn' : 'signedOut';
      })
      .addCase(restoreSession.rejected, (state) => {
        state.status = 'signedOut';
      })
      .addCase(signIn.pending, (state) => {
        state.status = 'signingIn';
        state.errorMessage = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.session = action.payload;
        state.status = 'signedIn';
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'signedOut';
        state.errorMessage = (action.payload as string) ?? 'Sign-in failed. Please try again.';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.session = null;
        state.status = 'signedOut';
      })
      // Defense-in-depth: even if SecureStore delete fails, the UI signs out.
      .addCase(signOut.rejected, (state) => {
        state.session = null;
        state.status = 'signedOut';
      });
  },
});
