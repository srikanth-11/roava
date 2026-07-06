# Phase 16 — Production Hardening

> Branch: `feat/phase-16-hardening`. Emulator OFF — code-level; runtime items go on the deferred checklist. **No Gradle builds this phase** (RAM) — release config is written, not exercised.

**Goal:** The app stops assuming a happy path it can't guarantee: render crashes get a friendly recovery screen, hardware back behaves everywhere, garbage deep-link params degrade honestly, and the release build is configured (signing, console stripping) ready for its first real build later.

## Key decisions

1. **Crash safety, two layers:** a shared `CrashScreen` (friendly copy + "Try again" remount affordance + error detail in dev) used by (a) expo-router's route-level `ErrorBoundary` export on the param-driven routes (`destination/[id]*`, `trip/[id]`, `flights/[icao24]`) and (b) a root boundary in `_layout` as the last line. Render crashes become a screen, not a white void.
2. **Hardware back closes sheets:** one `useSheetBackHandler(ref)` hook — tracks the modal's open state via `onChange`, registers a `BackHandler` listener only while open, dismisses and consumes the event. Applied to all four sheets (search filters, converter's two pickers via its host screen, create-trip, home-currency picker).
3. **Deep-link garbage audit:** every param route must survive `roava://destination/garbage`, `/trip/nonexistent`, `/flights/xyz` — no crash, honest error state, working back. Code-audit + guard fixes (e.g. NaN coords already guarded on the map — verify the pattern holds everywhere).
4. **Release hygiene without a build:** `babel` drops `console.*` (except error/warn) in production; a release keystore is generated with `keytool` (cheap, no Gradle) and wired into `android/` signing config — **keystore + passwords git-ignored, verified before commit**; `app.json` version/metadata sanity pass.
5. **Proguard stays off** (RN default) — enabling it unexercised would be a landmine; noted for a future phase WITH device verification.

## Tasks

- [x] Task 1: `CrashScreen` + root boundary + `ErrorBoundary` exports on all 5 param routes (destination id/weather/map, trip, flight) — JOURNEY 19.1
- [x] Task 2: `useSheetBackHandler` inside all 3 sheet COMPONENTS (covers every instance; listener registered only while open) — 19.2
- [x] Task 3: Garbage audit — zero fixes needed (guards were already everywhere); caught a "Home currency currency" copy bug — 19.3
- [x] Task 4: babel prod console strip (error/warn kept); keystore + properties in git-ignored `keys/` (`git check-ignore` verified), Gradle block w/ debug fallback, durable recipe in `docs/release.md` — 19.4
- [x] Task 5: Gates green; JOURNEY 19; commit; debrief; **wait for "Phase Approved"**

**Exit criteria (code-level):** every param route exports ErrorBoundary; all sheets dismiss on hardware back by construction; keystore artifacts ignored by git (verified with `git status`); gates green.

## ⏸ DEFERRED RUNTIME VERIFICATION (consolidated end-of-build pass)

- [ ] Throw inside a route in dev → CrashScreen renders, "Try again" recovers
- [ ] Hardware back closes each of the four sheets (and does NOT exit the app)
- [ ] `roava://destination/garbage`, `/trip/junk`, `/flights/xyz` → honest error states, back works
- [x] Release build assembles and installs (`gradlew assembleRelease`) — DONE EARLY 2026-07-06: signed (apksigner-verified), installed on the phone, user-confirmed running standalone (JOURNEY 20)
