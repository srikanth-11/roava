# Phase 8 — Weather

> Branch: `feat/phase-08-weather`.

**Goal:** The full weather feature: a destination weather screen with current conditions, hourly and daily forecasts, UV and air quality, an animated SVG sunrise/sunset arc, and a TTL-cached offline fallback — engineered honestly around what OpenWeather's free tier actually serves.

## Free-tier reality (verify in Task 1 before any code — the 8.1/10.1 discipline)

- `/data/2.5/weather` (current) — free, already used in Phase 7.
- `/data/2.5/forecast` — free: **3-hourly buckets for 5 days**. There is no free daily endpoint.
- `/data/2.5/air_pollution` — free: AQI 1–5 + components.
- **One Call 3.0 (true daily + UV) requires a billing-backed subscription — not for this project.**
- Daily forecast therefore **aggregates the 3-hourly buckets client-side** (min/max per calendar day in the destination's timezone — reuse the Phase 7 tz normalization). Day 5 may be partial: render honestly ("so far").
- UV: keyless **Open-Meteo** (`api.open-meteo.com/v1/forecast?hourly=uv_index`) as a secondary free provider, or the UV tile degrades. Decide in Task 1 after verifying both endpoints with the real key.

## Key decisions

1. **One repository, one screen fetch:** `WeatherRepository.getFullWeather(lat, lon, timezone)` composes current + forecast + AQI (+ UV) with `Promise.allSettled` — each sub-source degrades its own tile, never the screen (Phase 7's section pattern, one level deeper).
2. **TTL + stale-if-error via AppStorage,** mirroring `currency.ts`: fresh ≤ 30 min → serve; stale → refetch; refetch fails → serve stale with a "saved forecast · {age}" banner. This is the offline fallback and the Phase 10 dress rehearsal.
3. **Sunrise arc = react-native-svg (already compiled into the dev build — verified, no rebuild)** + Reanimated: sun position animates along a semicircular `Path` from sunrise→sunset progress in the destination's local time; `.get()`/`.set()` only (React Compiler). Reduced-motion: static position (Phase 15 wires the OS setting; leave the seam).
4. **Route:** `destination/[id]/weather` pushed from the Phase 7 weather card (card gains a chevron + `accessibilityHint`). City context (coords + tz + name) rides in via params — no refetch of the city record. **New route file ⇒ restart Metro with `--clear` and reload the app (JOURNEY 6.2/9.1).**
5. **Hourly rail:** horizontal FlashList of the next ~8 three-hour buckets (icon, temp, hour in destination tz). Daily list: 5 aggregated rows (weekday, min–max bar, dominant condition icon).
6. **AQI tile:** OpenWeather's 1–5 index mapped to semantic labels/colors (success/warning/destructive tokens) with the component breakdown behind a tap (bottom sheet reuse).
7. **Mock parity:** `MockWeatherRepository` grows the same `getFullWeather` shape so the screen is fully drivable keyless.

## Tasks

- [ ] Task 1: API recon with the real key (forecast, air_pollution, Open-Meteo UV) — lock the UV decision; extend `openweather.ts` service + DTOs
- [ ] Task 2: Repository — `getFullWeather` composition (allSettled, per-source degradation), daily aggregation in destination tz, TTL cache + stale-if-error; RTK endpoint; mock parity
- [ ] Task 3: Weather screen — route + params, current header, hourly rail, daily list, AQI tile, stale banner; every tile owns loading/error states
- [ ] Task 4: Sunrise arc — SVG semicircle + animated sun position from sunrise/sunset in local tz; day/night handling (before sunrise / after sunset states)
- [ ] Task 5: Verify — live city + airplane-mode stale-serve + keyless mock run; both themes; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** weather screen loads from the Phase 7 card in < 1 perceived s (cache-warm); airplane mode serves the saved forecast with honest staleness; each tile (current/hourly/daily/UV/AQI/arc) degrades independently; arc animates smoothly and parks correctly outside daylight hours; gates green.
