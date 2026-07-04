# Phase 6 — Search

> Branch: `feat/phase-06-search`.

**Goal:** Debounced city search over GeoDB with request cancellation, a bottom-sheet population filter, prefix-highlighted results, and persisted search history — engineered around the free tier's 1 req/s limit.

## Key decisions

1. **Debounce 600 ms in a `useDebounce` hook** — under GeoDB's 1 req/s budget for continuous typing; `getWithRetry` already backs off on 429.
2. **Cancellation:** RTK Query `queryFn` receives an `AbortSignal`; it flows into axios so superseded keystrokes abort at the socket, not just get ignored.
3. **Search = cities only this phase** (one request per query). Countries resolve implicitly (city rows show country); attractions arrive with Overpass in Phase 7. Keeps every keystroke to a single rate-limited call.
4. **History:** AppStorage JSON array (max 10, most-recent-first, dedupe by id), written on result tap, cleared via button; shown when the query is empty.
5. **Filters bottom sheet (@gorhom):** minimum-population chips (Any / 100k+ / 1M+ / 5M+). Requires `GestureHandlerRootView` + `BottomSheetModalProvider` in the root layout (was pending anyway).
6. **Highlight:** result names render the matched prefix in primary color via nested `Text`.
7. **No Unsplash in search** — result rows are icon rows (quota discipline); imagery belongs to detail/home surfaces.

## Tasks

- [ ] Task 1: `@gorhom/bottom-sheet` installed; root layout gains GestureHandlerRootView + BottomSheetModalProvider; `useDebounce` hook
- [ ] Task 2: `geodb.searchCities(prefix, minPopulation, signal)`; `SearchRepository` (interface + live + mock) + history helpers; `searchCities` RTK Query endpoint with abort wiring
- [ ] Task 3: Search screen — Input w/ clear button, debounced query, skeleton rows, results FlashList (highlighted prefix, tap → destination + history write), empty/error states, history list w/ clear, filter chip row + FiltersSheet
- [ ] Task 4: Verify: type "par" → Paris results; abort visible on fast typing (logcat); filter changes results; history survives restart; both themes; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** results < 800 ms perceived after pause; no keyboard jank; history persists; 429s degrade gracefully; gates green.
