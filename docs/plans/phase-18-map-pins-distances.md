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

- [ ] **Task 1 — Geo foundations + recon.** Live-API recon on Photon (search shape, rate policy) and OSRM (route response, geometry) → logged. `lib/geo.ts` (`haversineMeters`, `formatDistance`, `LatLon`). Extend the marker model with a `source: 'osm' | 'custom'` discriminator; `CustomPoi` type.
- [ ] **Task 2 — Custom POIs data layer.** `types/customPoi.ts` (zod), `repositories/customPois.ts` (versioned MMKV doc keyed by destinationId, migrate seam, recovery stash, CRUD), RTK query + two mutations with `CustomPois` tag.
- [ ] **Task 3 — Add flows + distinct-color rendering.** `services/geocode.ts` (Photon typeahead, keyless, User-Agent, AppError). Search button → debounced results sheet → provisional pin → confirm sheet (name/category/note) → add. `onLongPress` → provisional pin → same confirm sheet. Custom pins render in their own source/color/glyph; tap → callout with delete.
- [ ] **Task 4 — Distances.** `services/routing.ts` (OSRM → {distanceM, durationS, geometry}). Callout gains "X km away" (haversine, instant) + "Route" action → drawn polyline (`mapRoute`) + "12 km · 24 min" label, degrading to haversine offline. **Measure mode** toolbar toggle: pick A + B (POI tap or long-press; "from me" seeds A with user location) → line + distance; optional route.
- [ ] **Task 5 — Close-out.** Gates (tsc + lint); JOURNEY chapter; commit; debrief; **wait for "Phase Approved."**

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
