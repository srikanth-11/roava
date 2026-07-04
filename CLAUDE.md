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

- Node 24.18.0 via nvm — **global `nvm use` still pending (needs elevated terminal)**; workaround: prepend `%APPDATA%\nvm\v24.18.0` to PATH per session
- `JAVA_HOME` = Android Studio JBR (JDK 21); `ANDROID_HOME` set; AVD **`Roava_Pixel`** (Pixel 7, API 36) exists
- Launch emulator/Metro **detached** (`Start-Process`); binary output via `cmd /c` redirects (PowerShell 5.1 corrupts it); see JOURNEY.md survival kit for the rest
- Physical phone: Expo Go **SDK 57 sideloaded** from expo.dev/go (Play Store version mismatched); phone connects via `npx expo start --tunnel` (Wi-Fi profile is Public + WSL adapter IP issue — permanent fix documented in JOURNEY 3.3)

## Current Status (update at every phase boundary)

- **Phase 0 (Foundation): APPROVED & merged to main.**
- **Phase 1 (Design System): APPROVED & merged to main.** 10 primitives in `src/components/ui`, tokens as CSS vars, theme store persisted behind `AppStorage`, dev gallery at `/dev-gallery`. Reanimated uses `.get()/.set()` (React Compiler requirement).
- **Phase 2 (Navigation Shell): APPROVED & merged.** Tab shell + AnimatedTabBar, onboarding gate, destination/[id] deep-link target (`roava://` live at Phase 4 dev build).
- **Phase 3 (Data Layer): APPROVED & merged.** Layering locked (screens → hooks → RTK Query queryFn → repositories → services); AppError taxonomy; persistence rehydrated pre-render; useOnline + OfflineBanner; /dev-data harness. Guard RTK errors with `isAppError`. Live-API cache-serving branch proves out in Phase 5.
- **Phase 4 (Auth & Dev Build): COMPLETE** — awaiting "Phase Approved". Branch `feat/phase-04-auth`. **Dev build is now the runtime** (`com.kasir.roava` via `npx expo run:android`, no EAS account; launch with the exp+roava:// dev-client URL or from dev-launcher "recently opened"). Auth: `AuthRepository` (Google impl gated on `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in .env — user must create Google Cloud OAuth clients, see phase-04 plan; Mock impl active meanwhile), sessions in SecureStore, restore-on-boot thunk, sign-in screen (Google + guest), session-aware Profile with confirm sign-out. Verified: mock sign-in → kill → restore; sign-out wipes; `roava://` deep links live (warm; cold goes via dev-launcher, JOURNEY 7.3). **MMKV deferred** (Nitro not registering under SDK 57, JOURNEY 7.2 — AsyncStorage active behind AppStorage; try mmkv@3 at next native rebuild).
- **Next: Phase 5 — Home & Discovery Feed** (GeoDB + Unsplash live repositories replace mocks, FlashList rails, skeletons, offline cold-start feed. Needs `EXPO_PUBLIC_GEODB_API_KEY` + `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` in .env — free-tier keys from rapidapi.com/wirefreethought and unsplash.com/developers.)
- Backlog: commitlint graduation; permanent LAN fix for phone (Private network profile + `REACT_NATIVE_PACKAGER_HOSTNAME`); MMKV swap at Phase 4.
