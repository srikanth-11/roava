# Phase 18 — Map: Custom Pins & Distances

> Branch: `feat/phase-18-map` (to be cut). Emulator OFF — code-complete under tsc+lint; every visual/interactive check goes on the deferred device checklist. **Live-API recon on Photon + OSRM runs FIRST** (the 8.1 discipline) and its findings are logged before any UI is built.

**Goal:** The destination map stops being read-only OSM data. Users add their own attractions — searched by name or dropped by long-press — that persist offline and render in a distinct color; and the map answers "how far?" both as-the-crow-flies (instant, offline) and as a real driving route with ETA.

## Key decisions

1. **Custom pins are user data, stored like trips.** A `customPoisRepository` over MMKV (`roava.custom-pois`), keyed by `destinationId`, versioned + zod-validated + corruption-recovery stash — a near-verbatim reuse of the Phase 12 pattern. RTK `getCustomPois`/`addCustomPoi`/`deleteCustomPoi` with a `CustomPois` tag. They survive airplane mode and reinstalls.
2. **Keyless OSM family, consistent with Overpass.** Geocoding = **Photon** (`photon.komoot.io`, keyless, built for typeahead — pairs with the Phase 6 debounced-search pattern; **Nominatim** documented as fallback). Routing = **OSRM** demo (`router.project-osrm.org`, keyless driving profile). Both carry a proper `User-Agent` like the Overpass client. **Honest limit:** both are best-effort public instances, no SLA — everything degrades (geocoder down → long-press still works; OSRM/offline → haversine only).
3. **Distance has two layers.** `lib/geo.ts` `haversineMeters()` is pure, offline, instant, unit-tested — it powers the "X km away" in every callout and the measure mode. OSRM adds the real route polyline + driving distance/ETA on top, online only, degrading to haversine.
4. **Rendering keeps sources separate.** OSM POIs stay in their clustered teal source untouched. Custom pins get their OWN un-clustered `GeoJSONSource` + layer in a new `mapCustom` token (distinct third color — amber/violet, contrast-checked both map themes) with a pin glyph, so they always stand out and never merge into OSM clusters. Route lines get a `mapRoute` token + line layer.
5. **The map screen will be decomposed** — it's already ~260 lines. Search sheet, add-confirm sheet, measure toolbar, and callout become sub-components under `features/map/` so `[id]/map.tsx` stays legible.

## Tasks

- [x] **Task 1 — Geo foundations + recon.** Photon + OSRM hit live, shapes logged (JOURNEY 21.1). `lib/geo.ts` (`haversineMeters`, `formatDistance`, `formatDuration`, `LatLon`). `Poi` gained `source: 'osm'`; `CustomPoi` carries `source: 'custom'` — one selected-marker union.
- [x] **Task 2 — Custom POIs data layer.** `types/customPoi.ts` (zod, 6 categories), `repositories/customPois.ts` (versioned MMKV doc keyed by destinationId, migrate seam, recovery stash, CRUD), RTK `getCustomPois` + `addCustomPoi`/`deleteCustomPoi` w/ `CustomPois` tag (21.2).
- [x] **Task 3 — Add flows + distinct color.** `services/geocode.ts` (Photon typeahead, keyless, User-Agent, label fallback). `PlaceSearchSheet` (debounced RTK query w/ abort) + `AddPoiSheet` (name/category/note); `onLongPress` → same confirm sheet. Custom pins in their own un-clustered violet source (`mapCustom`); tap → callout w/ delete (21.3).
- [x] **Task 4 — Distances.** `services/routing.ts` (OSRM). Callout "X km away" (haversine) + "Route from you" → `mapRoute` polyline + "12 km · 24 min" summary, degrading offline. **Measure mode** toolbar toggle: tap two points (map or markers), "From my location" seed, straight line + distance + optional Route (21.4).
- [x] **Task 5 — Close-out.** Gates green (tsc + lint); JOURNEY 21; commit; debrief; **wait for "Phase Approved."**

**Exit criteria (code-level):** custom POIs persist per-destination in MMKV and render in a distinct color; addable via BOTH search and long-press; callouts show haversine distance; OSRM route line + ETA online with haversine fallback offline; measure mode computes A↔B; gates green.

## ⏸ DEFERRED RUNTIME VERIFICATION (device pass)

- [ ] Add a pin via search (Photon typeahead → confirm → persists)
- [ ] Add a pin via long-press (drop → name → persists)
- [ ] Custom pins render in the distinct color, separate from OSM dots/clusters
- [ ] Delete a custom pin; survives app relaunch offline
- [ ] Callout shows correct "X km away" from current location
- [ ] "Route" draws the OSRM polyline with plausible distance + ETA
- [ ] Offline: route degrades to straight-line, no crash
- [ ] Measure mode: A→B line + distance; "from me" uses live location
