# Phase 19 — EAS + Shareable Links

> Branch: `feat/phase-19-eas`. **RAM-friendly: builds run in Expo's cloud, not locally.** Some tasks are GATED on an interactive `eas login` (the user's, browser auth) — those are marked 🔐.

**Goal:** Get the whole rebuild queue onto the phone off the local machine, add OTA + telemetry, and fix Share so links are clean `https://` URLs that open the app (with a real fallback page) instead of raw `roava://`.

## Key decisions

1. **EAS free tier throughout** — build credits, 1000 update MAU, EAS Hosting, EAS Observe are all free. Consistent with the free-keys doctrine (no custom backend; EAS Hosting serves a STATIC web build + the app-links file).
2. **Reuse the existing release keystore** — upload it to EAS credentials rather than letting EAS mint a new one, so the signature (and the Google-OAuth SHA registration) stays identical. Release SHA-256 for App Links: `3E:B0:FF:6C:BB:79:4E:E4:44:28:90:BF:91:C6:4D:BB:29:64:AC:9B:54:1B:A9:20:DE:66:92:DD:20:86:E4:1A`.
3. **`production` profile builds an APK, not an AAB** (`android.buildType: "apk"`) so it stays directly sideloadable like today's build.
4. **Share = Android App Links over EAS Hosting.** `public/.well-known/assetlinks.json` (release SHA-256) + `app.json` `intentFilters autoVerify` for the deployed host → `https://<host>/destination/id` opens the app; the Expo Router web build renders the fallback page. `lib/links.ts` centralizes URL building behind one constant so the domain is set once. iOS universal links deferred (Android-only project).
5. **The domain is known only after `eas init`/first deploy** — so App-Links host wiring (assetlinks + intentFilters + the share base URL) is finalized once the real `*.expo.app` host exists; code that doesn't depend on it is built first.
6. **Native vs OTA rule, documented:** JS-only change → `eas update` (OTA); native/config change (like the intentFilters) → new build. `runtimeVersion` policy = `appVersion`.

## Tasks

- [x] **Task 1 🔐 — EAS bootstrap.** `eas login` (user, browser SSO) → `eas init` → project `@srikanth-11/roava` (ID `b3a588ca-…`); `eas.json` (dev + production apk); **local** credentials (`credentials.json`, git-ignored) reusing the existing release keystore so signature/OAuth SHA stay identical.
- [x] **Task 2 — Shareable links.** `lib/links.ts` (`WEB_BASE=https://roava.expo.app`, `destinationShareUrl`); Share swapped to the clean https link; `public/.well-known/assetlinks.json` (release SHA-256) — **verified live 200 application/json**; `app.json intentFilters autoVerify` for the host. Web build renders every route as the fallback (four `.web` stubs for MapLibre/MMKV/google-signin, JOURNEY 22.3). (Rich per-destination OG meta = nice-to-have, not done.)
- [x] **Task 3 — OTA (Observe deferred).** `expo-updates` installed + `updates.url` + `runtimeVersion: appVersion` + channels. **EAS Observe deferred** (newer product, higher risk; sign-in failure is a known Console-config issue, not a telemetry mystery).
- [~] **Task 4 🔐 — Cloud build + deploy.** Web **deployed** to `https://roava.expo.app` (prod). Production APK build running in the cloud (2nd attempt, post-`.npmrc` fix — 1st died on ERESOLVE at install-deps, 22.2). Device verification → Phase 20.
- [ ] **Task 5 — Close-out.** Gates green; JOURNEY 22; commit; debrief; **wait for "Phase Approved."**

**Exit criteria:** production APK built in the cloud and installed on the phone with the full queue (sign-out, rail, gap, brand, maps); a shared destination link is a clean https URL that opens the app when installed and shows a page when not; OTA update path proven; gates green.

## ⏸ DEFERRED / DEVICE (folds into Phase 20 verification)

- [ ] Shared link opens app when installed; shows web page when not
- [ ] OG preview card renders in a messaging app
- [ ] `eas update` reflects a JS tweak on next launch
- [ ] Google sign-in works (post Console fix)
