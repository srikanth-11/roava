# Phase 12 — Trip Planner

> Branch: `feat/phase-12-trips`.

**Goal:** The offline-first crown: create trips, build drag-reorderable day-by-day itineraries, track a budget, tick a packing checklist, keep notes — with **zero network dependency by design**. The exit bar is the whole lifecycle running in airplane mode.

## Key decisions

1. **100% local behind the repository interface:** `TripsRepository` over MMKV (AppStorage) — same seam as everything else, so a future sync backend slots in without touching screens. Data serialized as one `roava.trips.v{N}` document.
2. **Versioned schema + migration seam, from day one:** every stored document carries `schemaVersion`; the repository runs `migrate(old)` on load. The Phase 9 storage-swap orphaning lesson (7.2/12.1), institutionalized before it can bite — Phase 12's data is the first the user genuinely cannot afford to lose.
3. **First RTK Query MUTATIONS:** `builder.mutation` + `invalidatesTags`/`providesTags` (`['Trips']`, per-trip tags) — the read/write lifecycle over a _local_ repository teaches invalidation without network noise.
4. **Forms: react-hook-form + zod + @hookform/resolvers** (all pure JS — no rebuild). Zod schemas double as the trip document validators inside the repository (one source of truth for shape).
5. **Drag-reorder: `react-native-draggable-flatlist`** — pure JS over the already-compiled RNGH + Reanimated. Long-press to lift, haptic on drop, order persisted immediately.
6. **IDs without native crypto:** a tiny `newId()` (timestamp base36 + random suffix) in `lib/ids.ts` — collision-safe for local, single-device data; swaps for UUIDs when sync arrives.
7. **Model:** `Trip` (name, optional linked destination, startDate/endDate, notes, timestamps) with child collections `ItineraryItem` (dayIndex, order, title, time?, note?), `BudgetEntry` (amount, currency — reusing the Phase 10 formatter, category, note), `PackingItem` (label, packed). Dates as ISO strings; day count derived.
8. **Screens:** the Trips tab becomes real (list + empty state + create form); `trip/[id]` with section navigation (Itinerary / Budget / Packing / Notes); every form RHF+Zod with inline errors.
9. **Trips tab badge of honor:** everything on these screens must work in airplane mode — loading, creating, editing, reordering, deleting, killing the app and coming back.

## Tasks

- [x] Task 1: Data — zod schemas as source of truth, `lib/ids.ts`, `TripsRepository` (versioned doc, migrate seam, recovery stash, CRUD incl. reorder), first mutations + `TripCommand` union
- [x] Task 2: Deps + Trips tab — list, empty state, RHF+Zod create form (end ≥ start refine verified by form use)
- [x] Task 3: `trip/[id]` — day chips, add/delete items, drag-reorder persisted (verified offline via `input draganddrop`)
- [x] Task 4: Budget (₹9,200 = Stay 8,000 + Food 1,200 verified), Packing (1/2 packed verified), Notes (autosave verified)
- [x] Task 5: Verify — **entire lifecycle in airplane mode + process kill → all intact (JOURNEY 15.1**; bundle reload needs network — dev-harness footnote 13.1); migration seam is passthrough-only at v1 (first real test = schema v2, honest deferral); delete-trip confirm built (Alert) — untested visually; JOURNEY 15; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** airplane-mode lifecycle passes end to end including an app kill; reorder feels physical (lift/drop haptics, 60fps); forms reject bad input with human errors; a schema-version bump routes through the migration seam; gates green.
