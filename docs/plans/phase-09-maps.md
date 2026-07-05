# Phase 9 — Maps & Nearby

> Branch: `feat/phase-09-maps`.

**Goal:** A destination map screen: Overpass POIs as clustered markers on a themed Google map, the user's location with a graceful permission-denial fallback, and favorited destinations as saved pins. First native rebuild since Phase 4 — the MMKV@3 swap rides along.

## Prerequisites

1. **User action — Google Maps API key:** Google Cloud console → enable "Maps SDK for Android" → create an API key → restrict it to Android apps with package `com.kasir.roava` (+ the debug SHA-1 from `gradlew signingReport`). Free tier: mobile-native map loads cost nothing. The key goes into app.json's `android.config.googleMaps.apiKey` (baked into the manifest at prebuild — restriction in the console is the real protection, per the extractable-keys rule).
2. **Emulator has Google Play services** (verified: GMS image), so Google Maps renders.

## Key decisions

1. **One native rebuild, two payloads:** `react-native-maps` (config: app.json googleMaps key) **and** the `react-native-mmkv@3` swap (TurboModule-based — closes JOURNEY 7.2's Nitro deferral; `AppStorage`'s interface means zero call-site changes, but the storage-engine swap orphans AsyncStorage data → migrate: read-all-AsyncStorage → write-MMKV once at boot behind a flag). `npx expo run:android` regenerates `android/` via CNG. Build both ABIs? Emulator-only for the phase (x86_64); the arm64 phone build repeats later.
2. **Key-gated degradation:** no Maps key (or map init failure) → the map screen renders the existing POI list instead — the screen is useful either way; the map is an upgrade, not a dependency.
3. **Map screen route:** `destination/[id]/map`, params-carried like weather (JOURNEY 11.5 pattern — free deep link). Entry: a "Map" button on the POI section header.
4. **Markers:** extend `Poi` with `lat`/`lon` (Overpass already returns coords — currently dropped in mapping). Map context re-queries Overpass with `out center 200` (tourism-only, the 10.3 timeout guard stands) — the 200+ marker exit criterion tests clustering for real.
5. **Clustering:** `react-native-map-clustering` (pure JS over react-native-maps, no extra native code). Cluster press → zoom in; marker press → callout with name/category.
6. **Themed maps:** Google JSON map styles generated from the design tokens (light + dark variants in `src/lib/mapStyles.ts`) — the map obeys the theme like every other surface.
7. **expo-location** (already an Expo module — confirm whether it's compiled in; if not it joins the rebuild): `requestForegroundPermissionsAsync` on map open; granted → my-location dot + "near you" distance chips; denied → map centers on the destination, a quiet caption explains, and a "grant location" affordance deep-links to app settings. Denial is a first-class path, not an error.
8. **Saved pins:** favorites (which store no coords) get them lazily — favorited destinations already visited have their details in RTK/AppStorage caches; for the rest, skip silently this phase (Phase 13 owns favorites hardening; note the seam).

## Tasks

- [ ] Task 1: Native prep — install react-native-maps + swap mmkv@3 + app.json key config; `expo run:android` rebuild; verify MMKV registers (JOURNEY 7.2 closure) + AsyncStorage→MMKV boot migration
- [ ] Task 2: Data — `Poi` gains coords; `getNearbyPois` map-context variant (limit 200); `mapStyles.ts` light/dark from tokens
- [ ] Task 3: Map screen — route + params, key-gated map/list fallback, clustered markers + callouts, "Map" entry from PoiSection
- [ ] Task 4: Location — permission request flow, my-location dot, denial fallback (destination-centered + settings affordance); saved favorite pins where coords are cached
- [ ] Task 5: Verify — 200+ markers smooth on emulator, cluster/zoom/callouts, denial path (revoke permission via adb), themed map in both schemes; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** 200+ markers pan/zoom smoothly (clustered); permission-denied path fully usable; map matches the active theme; MMKV actually registers (or the fallback story is documented and the swap reverted); gates green.
