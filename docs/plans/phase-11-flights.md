# Phase 11 — Flights

> Branch: `feat/phase-11-flights`.

**Goal:** Search live aircraft by callsign and track one on a map with a derived status timeline — riding OpenSky's anonymous tier, which makes rate-limit respect and honest empty states the phase's engineering heart.

## OpenSky reality (verify in Task 1 — the standing recon discipline)

- **Anonymous access is keyless** but tight: ~400 credits/day, 10-second data resolution. `/states/all` costs 1–4 credits per call (area-dependent); an `icao24=`-filtered call is the cheap tracked-flight probe.
- `/states/all` unfiltered returns EVERY tracked aircraft (~8k airborne, ~2 MB JSON) — and there is **no server-side callsign filter**. Search therefore fetches one snapshot and filters client-side.
- `/flights/*` (schedules, routes, airports) needs a registered account — out of scope. **Status is derived from ADS-B state honestly**: `on_ground`, `vertical_rate`, and `baro_altitude` → Boarding/On ground → Climbing → Cruising → Descending → Landed. No fake gate/terminal data.
- ADS-B coverage is real-world spotty (oceans, low altitude, some regions): a flight not found is "not visible to the network right now," never "does not exist."

## Key decisions

1. **Snapshot caching, in MEMORY, ~30 s TTL — deliberately NOT disk.** The whole-table lesson (13.2) applies to the fetch shape: one snapshot serves every search keystroke. But live positions rot in seconds — persisting them would serve confidently _wrong_ data offline. The contrast with currency's 12 h disk TTL is the mentor point: **cache duration and medium follow the data's freshness semantics, not a house habit.**
2. **Search UX:** debounced callsign input (Phase 6 pattern) filtering the cached snapshot — instant after the first fetch; result rows show callsign, origin country, altitude, speed. One credit spent per 30 s regardless of typing speed.
3. **Tracking:** selected flight → detail with a MapLibre mini-map (plane marker + heading indicator), stat tiles (altitude, ground speed, heading, vertical rate), and the derived status timeline. **Polling: RTK Query `pollingInterval` 15 s, gated by screen focus** (`useFocusEffect`) — leave the screen, polling stops; anonymous credits are a shared resource.
4. **Route `/flights`** + Home: the two tool cards (currency, flights) become a compact tools row — Home stays a feed, not a dashboard.
5. **Empty/error states:** no match → "Not visible to the network right now" with a one-line ADS-B honesty note; 429 → the existing rate-limit AppError copy; a tracked flight that vanishes mid-poll → "signal lost" state holding the last-seen position (timestamped), not a crash or a silent freeze.
6. **Repository:** `FlightsRepository` over an `opensky.ts` service; `Flight` domain type maps OpenSky's positional array format (indexes, not keys — DTO mapping earns its keep) into named fields.

## Tasks

- [ ] Task 1: Recon (anonymous `/states/all` shape/size/credits headers + `icao24` filter) → `opensky.ts` service (array→DTO mapping), `FlightsRepository` (snapshot memory-cache + search + single-flight), RTK endpoints
- [ ] Task 2: `/flights` search screen — debounced callsign input, result rows, honest empty state; Home tools row (currency + flights cards)
- [ ] Task 3: Flight detail — MapLibre mini-map w/ heading marker, stat tiles, derived status timeline, 15 s focus-gated polling, signal-lost state
- [ ] Task 4: Verify — live search (thousands airborne at any hour), track a flight across ≥2 poll cycles (position visibly moves), leave/return focus gating in logs, bogus-callsign empty state, 429 handling if the quota cooperates; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** a real flight tracks with visible position updates and a truthful status; polling provably stops off-screen; a nonsense callsign gets honesty, not an error; total credits spent during verification stays comfortably double-digit; gates green.
