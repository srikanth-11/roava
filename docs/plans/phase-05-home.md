# Phase 5 — Home & Discovery Feed

> Branch: `feat/phase-05-home`. First LIVE APIs — the Phase 3 architecture meets the real internet.

**Goal:** Home becomes the discovery feed: personalized greeting, trending-destination rail and explore list fed by **GeoDB** (cities) + **Unsplash** (imagery) through a `LiveDestinationsRepository` that drops in behind the existing interface — screens unchanged. Full skeleton pass, pull-to-refresh, staggered entrances, and the real offline test: airplane-mode cold start serves the persisted feed.

## Key decisions

1. **Live repo behind the same interface:** `LiveDestinationsRepository implements DestinationsRepository`; selected when both API keys exist (same env-gating pattern as auth). Mock remains the no-keys fallback.
2. **Rate-limit respect (free tiers):** GeoDB = 1 req/s → one `cities?sort=-population` call. Unsplash demo = 50 req/h → per-city image lookups are **cached in AppStorage** (`roava.image-cache.<id>`) so repeat refreshes cost zero Unsplash calls; only uncached cities fetch.
3. **Unsplash ToS:** store + render photographer credit on cards (attribution is required by their API terms — good habit now, not retrofit later).
4. **Offline-first, for real now:** query fails offline → UI falls back to the persisted `cache.trending` slice with a "saved data" chip. This completes the Phase 3 caveat.
5. **FlashList** for the vertical explore list (v2 — no size estimates needed); horizontal rail uses a nested horizontal FlashList. Reanimated `FadeInDown` staggered entrances.

## Tasks

- [ ] Task 1: `.env` keys trimmed (done); `expo install @shopify/flash-list`; `services/geodb.ts` + `services/unsplash.ts` (typed DTOs, createHttpClient per API, getWithRetry)
- [ ] Task 2: extend `Destination` (imageUrl, photoCredit, population); `LiveDestinationsRepository` (GeoDB top-10 → Unsplash enrich w/ AppStorage image cache); env-gated repo selection
- [ ] Task 3: Home rebuild — greeting (time-of-day + session/guest name), trending rail (expo-image cards → /destination/[id]), explore list, inspiration CTA, skeletons, ErrorState w/ cached fallback + stale chip, pull-to-refresh, staggered entrances
- [ ] Task 4: Verify live data on emulator (both themes), airplane-mode cold start serves cache, 60fps scroll; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** real cities + photos render on Home; refresh works; airplane cold start shows saved feed with offline banner; no Unsplash refetch for cached images; gates green.
