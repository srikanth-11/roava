# Phase 20 — Web Landing Polish

> Branch: `feat/phase-20-web`. **Web-only** — deploys via `eas deploy` (cloud, RAM-free); does NOT touch the phone APK or need a rebuild. Iterate by redeploying to `roava.expo.app` and viewing in a browser.

**Goal:** The web at `roava.expo.app` is the React Native app on react-native-web — it reads like a stretched phone app. Its ONLY job is the share fallback (what a link recipient without the app sees). Make the shared destination page a real web landing that shows the place and invites them into the app, and stop every other page from stretching.

## Design direction (Roava's brand, on web)

Reuse the established identity — don't invent a new one. Orange `#EA580C` (CTAs), teal `#0891B2` (accents), cream `#FFF7ED` (ground), slate `#0F172A` (ink); Satoshi (display) + Inter (body).

- **Hero = thesis:** the shared destination's own Unsplash photo, full-bleed, scrim, the R-compass mark, the place name in large Satoshi. "Someone's exploring **Mumbai** on Roava."
- **Signature:** that hero moment + the compass needle motif from the icon — the one memorable thing; everything else quiet.
- **Layout:** full-bleed hero → centered `max-w-4xl` content column (a taste of what the app does for this place) → footer (attribution + brand). Desktop wide; mobile web single-column. NativeWind `md:`/`lg:` breakpoints (react-native-web — NOT shadcn).
- **Copy:** active, honest — "Open in Roava", "Get the app", "Weather that works offline".

## Tasks

- [ ] **Task 1 — Global web shell.** A web-only max-width/centered container so no route stretches edge-to-edge on desktop (`Screen` web modifier or Platform-gated wrapper). Broad, cheap.
- [ ] **Task 2 — Web destination landing.** `destination/[id]/index.web.tsx` overriding the RN detail route on web: full-bleed hero (live destination photo/name/country via the existing query), Open-in-app + Get-app CTAs, a "what Roava does here" taste (weather · sights · currency · trips), footer. **Open Graph meta** via `expo-router/head` (og:title/description/image = the destination photo) → rich link previews in WhatsApp/Messages.
- [ ] **Task 3 — Deploy + verify + close.** `eas deploy --prod`; view `roava.expo.app/destination/<id>` in a desktop + mobile browser (screenshot); JOURNEY; commit; debrief; **wait for "Phase Approved."**

**Exit criteria:** the shared destination URL renders as a real web landing (not a stretched app screen), responsive on desktop and mobile web, with working Open-in-app / Get-app CTAs and OG preview; other web routes no longer stretch full-width; deployed live to `roava.expo.app`.

## Deferred

- Root `roava.expo.app` marketing landing (optional; shares point at `/destination`, not root).
- A store/download page (the APK link is an EAS artifact for now).
