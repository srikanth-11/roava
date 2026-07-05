# Phase 13 — Favorites & Offline Hardening

> Branch: `feat/phase-13-favorites`.

**Goal:** The Favorites tab becomes real (finally consuming the Phase 7 slice), removal gets the swipe + undo treatment, and the whole app takes an offline-hardening pass: destination details gain last-known-good snapshots, and every surface passes an airplane-mode honesty audit.

## Key decisions

1. **Unified favorites list:** the tab renders `favoritesSlice.items` (persisted since Phase 7) with photos via expo-image's disk cache — images are offline-native for anything ever seen. Tap → destination detail (which snapshots now make offline-capable). Sorted most-recently-saved first.
2. **Swipe-to-remove + undo:** RNGH's swipeable rows (JS-only over the compiled native gesture handler) reveal a delete action; removal is optimistic with a 5-second undo bar. Undo needs to restore the EXACT item (original `savedAt`), so the slice gains a `favoriteRestored(item)` reducer — `favoriteToggled` would mint a fresh timestamp and reorder history.
3. **Offline snapshots — repository-level, app-wide:** `getDestinationById` caches its last-known-good `DestinationDetail` per id in AppStorage (no TTL — last-good is the point) and serves it stale-if-error with an `isStale` flag; the detail screen shows the established "saved data" badge instead of the full-screen error. This hardens EVERY revisited destination, not just favorites — and incidentally guarantees coords exist for favorited cities (the Phase 9 map-pins seam unblocks for free, future work).
4. **App-wide airplane audit — the hardening half:** walk all nine surfaces offline (Home, Search, destination detail, weather, map, currency, flights, trips, favorites) against one standard: _no silent failures, no fake data, every dead end labeled honestly with a path back._ Fix whatever falls short (the map's tile-failure fallback and Search's offline behavior are the two suspected weak spots).
5. **No new natives, no new routes** — pure JS phase; Fast Refresh all the way (no Metro --clear needed).

## Tasks

- [x] Task 1: Favorites tab — list rows (photo, name, country, saved-when), tap-through, empty state; `favoriteRestored` reducer
- [x] Task 2: Swipe-to-remove (RNGH ReanimatedSwipeable) + 5s undo bar (verified: undo preserves original savedAt — "saved 6 hours ago" survived; expiry path finalizes)
- [x] Task 3: Offline snapshots — verified cold-store airplane detail from snapshot + "saved data" badge, cards degrading independently (JOURNEY 16.2)
- [x] Task 4: Nine-surface airplane audit, screenshot each — ALL honest; one fix: map floating header hid under the OfflineBanner overlay → banner-aware offset (16.3); bonus: weather stale badge verified live (Phase 8 loop closed), MapLibre tile cache serves visited cities offline; stale-HMR trap documented (16.4)
- [x] Task 5: Verify; JOURNEY Chapter 16; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** favorites work fully offline including photos; undo actually restores (same savedAt, same position); a previously-visited destination opens offline with the saved-data badge; the nine-surface audit has a screenshot per surface and zero dishonest states; gates green.
