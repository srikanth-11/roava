# Phase 9 — Maps & Nearby

> Branch: `feat/phase-09-maps`.

**Goal:** A destination map screen: Overpass POIs as clustered markers on a themed vector map, the user's location with a graceful permission-denial fallback, and favorited destinations as saved pins. First native rebuild since Phase 4 — the MMKV@3 swap rides along.

## Stack decision: MapLibre + OpenFreeMap (zero keys, zero cards)

Google Maps SDK needs a billing-backed Cloud account even at $0 — against the frontend-first, free-keys-only rule. Instead:

- **`@maplibre/maplibre-react-native`** — open-source fork of Mapbox GL Native; ships an Expo config plugin; no account anywhere.
- **OpenFreeMap tiles** (`tiles.openfreemap.org`) — free hosted OSM vector tiles, keyless, no usage caps published; style JSONs (e.g. `liberty`, `bright`, `positron`) served the same way. Attribution "© OpenStreetMap contributors" is the only obligation — rendered on-map, same discipline as Unsplash credits.
- **Clustering is built into MapLibre** (`ShapeSource` with `cluster` on GeoJSON) — no extra JS library, and it's the same engine pattern Mapbox users know.

## Key decisions

1. **One native rebuild, two payloads:** MapLibre (config plugin) **and** the `react-native-mmkv@3` swap (TurboModule-based — closes JOURNEY 7.2's Nitro deferral; `AppStorage`'s interface means zero call-site changes, but the engine swap orphans AsyncStorage data → one-time read-AsyncStorage → write-MMKV migration at boot). `npx expo run:android` regenerates `android/` via CNG.
2. **Task 1 recon (8.1/10.1 discipline):** fetch OpenFreeMap's style list before coding — confirm which styles exist for the light theme and whether a dark style is hosted; if no hosted dark, decide between shipping the light style in both themes (honest) or a minimal self-authored dark style JSON (stretch).
3. **Map screen route:** `destination/[id]/map`, params-carried like weather (JOURNEY 11.5 pattern — free deep link). Entry: a "Map" button on the POI section header.
4. **Markers:** extend `Poi` with `lat`/`lon` (Overpass returns coords — currently dropped in mapping). Map context re-queries Overpass with `out center 200` (tourism-only, the 10.3 timeout guard stands) — the 200+ marker exit criterion tests clustering for real.
5. **GeoJSON pipeline:** POIs → FeatureCollection → `ShapeSource cluster` → circle layers for clusters (count in a SymbolLayer) + icon layer for singles; marker press → callout card (name/category); cluster press → camera zoom.
6. **expo-location:** request on map open; granted → MapLibre UserLocation puck + distance chips; denied → map centers on the destination, quiet caption + "grant location" affordance to app settings. Denial is a first-class path, not an error.
7. **Saved pins:** favorites with cached coords render as heart pins; favorites without coords skip silently (Phase 13 owns favorites hardening; seam noted).
8. **Fallback:** if the map fails to init (tiles unreachable offline, native issue), the screen renders the existing POI list — the map is an upgrade, not a dependency.

## Tasks

- [x] Task 1: Recon (all 5 OpenFreeMap styles live incl. dark) + native prep — MapLibre + mmkv@3 + expo-location installed, nitro removed; 12m rebuild; **MMKV registered** + boot migration (JOURNEY 12.1)
- [x] Task 2: Data — `Poi` gains coords; `getNearbyForMap` (6 km / 200); GeoJSON mapping; themed style URLs
- [x] Task 3: Map screen — v11 API (`Map`/`GeoJSONSource`/`Layer`, JOURNEY 12.3), engine clustering + expansion-zoom taps, callouts, attribution, list fallback, "Map" entry from PoiSection
- [x] Task 4: Location — permission flow verified BOTH ways (deny → banner + Settings; grant → banner clears); saved-pins seam deferred to Phase 13 (coords rarely cached)
- [x] Task 5: Verify — Paris ~200 POIs clustered smooth; Mumbai cluster expansion + callout; deep links cold & warm; JOURNEY 12; commit; debrief (dark map → Phase 15); **wait for "Phase Approved"**

**Exit criteria:** 200+ markers pan/zoom smoothly (clustered); permission-denied path fully usable; attribution rendered; MMKV actually registers (or the swap is reverted with the story documented); gates green.
