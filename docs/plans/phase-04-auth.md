# Phase 4 — Authentication, Profile & the Dev-Build Milestone

> Branch: `feat/phase-04-auth`.

**Goal:** Google Sign-In architecture with SecureStore sessions and guest mode, running in Roava's **own development build** (goodbye Expo Go): `npx expo run:android` locally — no EAS account required, Gradle/NDK cache from the bare-RN era reused. `roava://` deep links go live; MMKV replaces AsyncStorage behind the `AppStorage` interface.

## Key decisions

1. **Local dev build over EAS cloud:** `expo run:android` runs CNG prebuild + local Gradle — no Expo account, no build queue, and our machine already has the toolchain. EAS cloud builds arrive in Phase 17 for release.
2. **Auth behind a repository:** `AuthRepository` interface with `GoogleAuthRepository` (real, needs a Web Client ID) and `MockAuthRepository` (works today). The real one activates when the user creates Google Cloud OAuth credentials — an external account action only they can do (documented below).
3. **Sessions in SecureStore** (Android Keystore-backed) — never in AppStorage. Session = `{ user, provider, issuedAt }` JSON.
4. **Guest mode:** browse everything; features that need identity (saves/trips, later phases) will gate at point-of-use, not at the front door — better conversion than a login wall.
5. **MMKV swap with graceful fallback:** `AppStorage` tries MMKV (dev build) and falls back to AsyncStorage (Expo Go) — one interface, either engine, no call-site changes.

## User action required (for REAL Google Sign-In)

1. https://console.cloud.google.com → create project "Roava" → APIs & Services → Credentials.
2. Configure OAuth consent screen (External, app name Roava, your email).
3. Create Credentials → OAuth Client ID → **Web application** → copy the client ID into `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
4. Create Credentials → OAuth Client ID → **Android** → package `com.kasir.roava`, SHA-1 from `cd android && .\gradlew signingReport` (debug keystore).
   Until then, the Sign-In screen's mock provider exercises the entire flow.

## Tasks

- [ ] Task 1: Install `expo-dev-client expo-secure-store @react-native-google-signin/google-signin react-native-mmkv`; app.json: google-signin plugin + `android.package`; kick `npx expo run:android` (background — the long pole)
- [ ] Task 2: `types/auth.ts`, `lib/secureSession.ts` (SecureStore JSON), `repositories/auth.ts` (interface + Google + Mock), `store/authSlice.ts` (thunks: restore/signIn/signOut), MMKV-first `AppStorage`
- [ ] Task 3: `/sign-in` screen (Google + guest CTAs, post-onboarding gate), profile shows session (avatar/name/email + sign out) or guest (sign-in CTA)
- [ ] Task 4: Verify in dev build: mock sign-in end-to-end, session survives kill, sign-out wipes SecureStore, `roava://destination/paris` deep link, MMKV active; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** dev build installed and running; sign-in (mock) → kill → relaunch restores session; sign-out clears; guest browsable; `roava://` works; gates green.
