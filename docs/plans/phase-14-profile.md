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

- [ ] Task 1: `settingsSlice` (homeCurrency) + WHITELIST entry + migrate all `HOME_CURRENCY` consumers to the selector
- [ ] Task 2: Profile tab — Account card (session identity, sign out) + Preferences section (theme segmented control, home-currency row → CurrencyPickerSheet reuse)
- [ ] Task 3: Offline-data section (`getAllKeys()` on AppStorage, prefix counts, clear-with-confirm sparing user data) + About section (attributions, version)
- [ ] Task 4: Verify — theme switch applies live + survives restart; home currency ripples (detail card, converter, new budget entry) + survives restart; cache clear drops caches but trips/favorites/session survive; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** theme + home currency both persist across force-stop; changing home currency visibly changes the detail CurrencyCard and converter default without code edits; clear-cache leaves trips, favorites, and session intact (verified by inspection after clearing); gates green.
