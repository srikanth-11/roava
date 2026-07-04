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

- **Phase 0 (Foundation): COMPLETE** — awaiting "Phase Approved". Branch `feat/phase-00-foundation` (unmerged, 6 commits). App verified in Expo Go on emulator + physical phone; hot reload proven; husky gates verified live.
- **Next: Phase 1 — Design System & UI Kit** (NativeWind v4 tokens, Satoshi/Inter via expo-font, 10 primitives, light/dark theme store in MMKV, dev gallery screen). Fold `eslint-plugin-react-native-a11y` rules in here.
- Backlog: commitlint graduation; permanent LAN fix for phone (Private network profile + `REACT_NATIVE_PACKAGER_HOSTNAME`).
