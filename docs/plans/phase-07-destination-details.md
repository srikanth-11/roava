# Phase 7 — Destination Details

> Branch: `feat/phase-07-destination`.

**Goal:** A destination detail screen composed of **independently degrading sections** — parallax Unsplash hero, weather / local-time / currency snapshot cards, Overpass POIs — plus favorite toggle, share deep link, and Home sitting beneath deep-linked screens. One failing API must never blank the screen; this phase's architectural heart is section-level resilience.

## Prerequisite (user action, not a build blocker)

- Free key from openweathermap.org → `.env` as `EXPO_PUBLIC_OPENWEATHER_API_KEY`. Until present, the weather card renders its "unavailable" state — by design.

## Key decisions

1. **City by id via GeoDB `GET /v1/geo/cities/{cityId}`** — `DestinationsRepository.getDestinationById(id)` (live + mock parity), RTK Query endpoint keyed by id. Keeps the screen to a single rate-limited GeoDB call; every other section hits a different provider.
2. **Independent section degradation** — each section (hero, each snapshot card, POIs) owns its loading/empty/error/offline states. Compose from existing primitives (`Skeleton`, `ErrorState`, `EmptyState`); no full-screen error unless the city lookup itself fails.
3. **Parallax hero:** Reanimated scroll-driven transform using `.get()`/`.set()` (React Compiler rule, JOURNEY 4.3); Unsplash photo through the existing AppStorage image cache **with rendered attribution** (hard rule from Phase 5); back overlay + favorite heart within 48dp targets.
4. **Snapshot row, three cards, three cost profiles:** Weather = OpenWeather current conditions (key-gated); Local time = pure client computation from GeoDB timezone (zero API cost); Currency = open.er-api rate vs home currency (constant `INR` for now — Settings owns it in Phase 15), cached via AppStorage with staleness display (previews Phase 10's flagship pattern).
5. **Overpass POIs:** one bounded around-query (tourism/attraction tags, ~20 results, timeout + single retry — good citizenship on the shared public instance), category chips, honest empty state ("no sights mapped here yet").
6. **Favorites seed:** `favorites` slice persisted behind AppStorage, optimistic heart toggle; schema (id, name, country, photo ref, savedAt) deliberately matches what Phase 13's unified favorites will consume.
7. **Share:** RN `Share.share` with `roava://destination/{id}` — full behavior verifiable warm in the dev client; cold-start caveat stays JOURNEY 7.3 until release builds.
8. **Home beneath deep links:** `unstable_settings.initialRouteName` so a cold `roava://destination/tokyo` backs out to Home instead of exiting (closes the 7.3 observation).

## Tasks

- [x] Task 1: Plumbing — `geodb.getCityById`, repository method (live + mock), RTK Query endpoint; `initialRouteName` fix; verify deep link → back lands on Home
- [x] Task 2: Hero — parallax header w/ cached Unsplash photo + attribution, back overlay, skeleton state; favorite heart (wired in Task 5)
- [x] Task 3: Snapshot row — weather card (key-gated, graceful "unavailable"), local-time card, currency card w/ cached rate + staleness; each degrades independently
- [x] Task 4: POIs — Overpass service + repository + endpoint, category chips, POI rows, empty/error states, rate-limit courtesy (park selectors dropped — dense-city timeout, JOURNEY 10.3)
- [x] Task 5: Favorites slice + persisted optimistic toggle; share button; airplane-mode audit; JOURNEY; commit; debrief (dark-mode visual pass deferred to Phase 15 — explicit-light pref active); **wait for "Phase Approved"**

**Exit criteria:** cold deep link backs out to Home; killing any single API (wrong key, airplane mode, Overpass down) degrades only its own section; favorite survives restart; parallax stays 60 fps; contrast + touch-target audit passes both themes; gates green.
