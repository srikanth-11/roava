# Phase 14 — Profile & Settings

> Branch: `feat/phase-14-profile`.

**Goal:** The Profile tab becomes the app's control room: theme, home currency, offline-data management, and attributions — all real, all persisted, no new routes.

## Key decisions

1. **Everything inline on the Profile tab** — sections (Account / Preferences / Offline data / About) on the existing tab. No new routes, no Metro `--clear`, Fast Refresh all the way.
2. **Theme picker activates the Phase 1 machinery:** System / Light / Dark segmented control writing the persisted theme store that has existed since Phase 1. The dark VISUAL pass remains Phase 15 — switching to dark may look rough in spots; that is a known, stated limitation, not a bug.
3. **Home currency graduates from constant to setting:** new persisted `settingsSlice` (`homeCurrency`, default `'INR'`) added to the persistence WHITELIST. The `HOME_CURRENCY` constant's consumers (detail CurrencyCard, converter default target, budget entry currency) all move to a selector. Historical budget entries are safe by construction — they stored their currency at write time (Phase 12 schema).
4. **Offline-data section with surgical clear:** counts of cached artifacts by prefix (destination photos, detail snapshots, weather, rate tables) via a new `getAllKeys()` on the `AppStorage` interface (MMKV and AsyncStorage both support enumeration — the Phase 4 interface bet pays out again). "Clear cached data" = destructive confirm, deletes ONLY re-downloadable prefixes — **never trips, favorites, settings, session, search history**.
5. **About = attribution goodwill:** the APIs that power the app for free get their credits (Unsplash, OpenStreetMap/Overpass, GeoDB, OpenWeather, Open-Meteo, er-api, OpenSky, OpenFreeMap) + app version via `expo-constants`.

## Tasks

- [x] Task 1: `settingsSlice` (homeCurrency) + WHITELIST entry + all `HOME_CURRENCY` consumers migrated to `selectHomeCurrency` (constant renamed `DEFAULT_HOME_CURRENCY`, slice-only)
- [x] Task 2: Profile tab — Preferences card (existing theme control + home-currency row → CurrencyPickerSheet reuse, label widened to string)
- [x] Task 3: `OfflineDataCard` (`getAllKeys()` on AppStorage both engines, five cache buckets, clear-with-confirm sparing user data) + About card (8 API attributions + version via expo-constants)
- [x] Task 4: Gates green (tsc + lint); JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria (code-level, met):** gates green; all HOME_CURRENCY reads go through the slice; clear list contains only re-downloadable prefixes.

## ⏸ DEFERRED RUNTIME VERIFICATION (user directive 2026-07-06: emulator/Metro stopped to save RAM — one consolidated pass after all phases)

- [ ] Theme switch applies live; choice survives force-stop
- [ ] Home currency change ripples: detail CurrencyCard quote, new budget entry currency + amount label
- [ ] Home currency survives force-stop (settings slice persistence round-trip)
- [ ] Budget with mixed currencies renders grouped totals (primary big number + "+ X" captions)
- [ ] Offline-data counts look sane; Clear empties buckets; trips/favorites/session/theme intact after clear
- [ ] CurrencyPickerSheet opens from Profile, search works, selection dismisses
- [ ] MMKV `getAllKeys()` returns expected keys (interface addition unproven on device)
