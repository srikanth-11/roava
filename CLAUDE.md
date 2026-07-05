@AGENTS.md

# Roava — Project Context (read this first in every session)

Roava is a production-quality, offline-capable travel companion app (Expo SDK 57, TypeScript strict, Expo Router) built as a **phased learning + portfolio project**. The developer is a 5+ year web dev (React/Next/Node) mastering React Native; act as mentor as well as engineer — explain the _why_, contrast with web, never hide complexity.

## Process contract (non-negotiable)

1. Build **one phase at a time** per `docs/plans/2026-07-04-roava-master-plan.md`. Never start the next phase without the user replying **"Phase Approved"**.
2. Before starting a phase, write its bite-sized task plan to `docs/plans/phase-NN-<name>.md`.
3. End every phase with the 16-point debrief (architecture, trade-offs, RN concepts, perf, a11y, security, interview questions, homework, branch, commit message, improvements).
4. **Every problem + solution gets logged in `docs/JOURNEY.md`** (Problem → Diagnosis → Solution → Lesson) as it happens — no exceptions.
5. Update the **Current Status** section below at every phase boundary.

## Key documents

- `docs/plans/2026-07-04-roava-master-plan.md` — architecture, design system tokens, 18 phases, API map, risks
- `docs/JOURNEY.md` — every problem/solution so far + Windows survival-kit table
- `README.md` — machine setup, run instructions

## Hard rules (from the master plan)

- No API calls from screens — layers: screens → features → hooks → RTK Query → repositories → services
- Every async surface: loading (skeleton) / empty / error / offline states
- Semantic color tokens only (no raw hex in components); Lucide icons only (no emoji icons)
- Touch targets ≥ 48dp; contrast ≥ 4.5:1 in both themes; `accessibilityLabel` on icon-only controls
- Secrets: expo-secure-store; `EXPO_PUBLIC_*` keys are extractable — free quota-capped keys only
- Conventional commits (husky-enforced); one branch per phase
- No custom backend — public APIs only (frontend-first rule)

## Machine facts (Windows 11)

- Node 24.18.0 via nvm — global symlink active (`node --version` → 24.18.0 in any terminal); the per-session PATH workaround is no longer needed (JOURNEY 9.3)
- `JAVA_HOME` = Android Studio JBR (JDK 21); `ANDROID_HOME` set; AVD **`Roava_Pixel`** (Pixel 7, API 36) exists
- Launch emulator/Metro **detached** (`Start-Process`); binary output via `cmd /c` redirects (PowerShell 5.1 corrupts it); see JOURNEY.md survival kit for the rest
- Physical phone connects via **LAN** (`npx expo start`, no --tunnel): Wi-Fi profile is Private + user env var `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3` (DHCP IP — goes stale if the router reassigns; JOURNEY 9.3). Fallback if it times out: `--tunnel`, or the elevated port-8081 firewall rule in JOURNEY 9.3. (Historic: Expo Go SDK 57 was sideloaded from expo.dev/go; retired since the Phase 4 dev build.)

## Current Status (update at every phase boundary)

- **Phase 0 (Foundation): APPROVED & merged to main.**
- **Phase 1 (Design System): APPROVED & merged to main.** 10 primitives in `src/components/ui`, tokens as CSS vars, theme store persisted behind `AppStorage`, dev gallery at `/dev-gallery`. Reanimated uses `.get()/.set()` (React Compiler requirement).
- **Phase 2 (Navigation Shell): APPROVED & merged.** Tab shell + AnimatedTabBar, onboarding gate, destination/[id] deep-link target (`roava://` live at Phase 4 dev build).
- **Phase 3 (Data Layer): APPROVED & merged.** Layering locked (screens → hooks → RTK Query queryFn → repositories → services); AppError taxonomy; persistence rehydrated pre-render; useOnline + OfflineBanner; /dev-data harness. Guard RTK errors with `isAppError`. Live-API cache-serving branch proves out in Phase 5.
- **Phase 4 (Auth & Dev Build): APPROVED & merged** (approval recorded 2026-07-05). Branch `feat/phase-04-auth`. **Dev build is now the runtime** (`com.kasir.roava` via `npx expo run:android`, no EAS account; launch with the exp+roava:// dev-client URL or from dev-launcher "recently opened"). Auth: `AuthRepository` (Google impl gated on `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in .env — user must create Google Cloud OAuth clients, see phase-04 plan; Mock impl active meanwhile), sessions in SecureStore, restore-on-boot thunk, sign-in screen (Google + guest), session-aware Profile with confirm sign-out. Verified: mock sign-in → kill → restore; sign-out wipes; `roava://` deep links live (warm; cold goes via dev-launcher, JOURNEY 7.3). **MMKV deferred** (Nitro not registering under SDK 57, JOURNEY 7.2 — AsyncStorage active behind AppStorage; try mmkv@3 at next native rebuild).
- **Phase 5 (Home & Discovery Feed): APPROVED & merged** (approval recorded 2026-07-05). Branch `feat/phase-05-home`. Live APIs active (user's keys in .env): `LiveDestinationsRepository` (GeoDB top cities host `wft-geo-db.p.rapidapi.com` + Unsplash photos with AppStorage image cache + rendered attribution), env-gated live/mock selection. Home = greeting (session name), trending rail + explore FlashList, skeletons, pull-to-refresh, staggered entrances, stale-cache fallback. **Offline-first proven vs real API** (airplane cold start → cached feed + saved-data chip). Debug tip: `adb logcat -s ReactNativeJS:*` beats Metro log (web-SSR noise, JOURNEY 8.3).
- **Phase 6 (Search): APPROVED & merged (2026-07-05).** Branch `feat/phase-06-search`. Debounced (600ms) GeoDB city search with AbortSignal cancellation through queryFn→axios; prefix-highlight rows; population FiltersSheet (@gorhom bottom-sheet; GestureHandlerRootView + BottomSheetModalProvider now in root layout); search history in AppStorage (max 10, clear button, written on result tap). Verified live: "par" → Paris et al with highlights; filters; history persisted. **After installing packages, restart Metro with --clear** (JOURNEY 9.1).
- **Current: Phase 7 — Destination Details** — branch `feat/phase-07-destination`, plan at `docs/plans/phase-07-destination-details.md`; build not started. **User action:** free key from openweathermap.org into `.env` as `EXPO_PUBLIC_OPENWEATHER_API_KEY` (weather card degrades gracefully until then — not a build blocker). Phone: arm64 dev-build APK built & served for sideload 2026-07-05 (JOURNEY 9.5 — install confirmation pending).
- Backlog: commitlint graduation; MMKV swap at Phase 4. (Done 2026-07-05: permanent LAN fix for phone — JOURNEY 9.3.)
