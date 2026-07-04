# Roava — Master Implementation Plan (Expo)

> **Process contract:** Built one phase at a time. Every phase ends with the full 16-point debrief (architecture, trade-offs, RN concepts, performance, a11y, security, interview questions, homework, branch, commit, improvements) and **waits for "Phase Approved"** before the next phase begins. Before each phase starts, a detailed bite-sized task plan for that phase is written to `docs/plans/phase-NN-<name>.md`.

> **Decision record (2026-07-04):** Project started on bare RN CLI; after completing a bare Phase 0 (32-min first Gradle build, manual SDK/AVD setup, three-config aliasing), the developer chose to **switch to Expo** for iteration speed. The bare-RN experience was kept as learning; native-layer depth is still available on demand via `npx expo prebuild` (CNG) and EAS dev builds. The machine setup from that phase carries over fully.

**Goal:** A production-quality, offline-capable, frontend-first React Native (Expo) travel companion published on Google Play — and a structured path to React Native mastery.

**Architecture:** Feature-based modular monolith on Expo Router. All data flows through a layered API architecture (client → services → repositories → RTK Query → screens). Local-first persistence with MMKV + SecureStore. No custom backend — public APIs consumed directly with keys treated as rate-limited, non-secret free-tier keys.

**Tech stack:** Expo SDK (latest stable) · TypeScript strict · Expo Router · NativeWind v4 · Redux Toolkit + RTK Query · Axios · React Hook Form + Zod · react-native-mmkv · expo-secure-store · Reanimated · Gesture Handler · FlashList · @gorhom/bottom-sheet · react-native-maps · expo-location · expo-notifications · expo-image · react-native-svg · lucide-react-native · Sentry · Firebase Analytics + Crashlytics · Jest + React Native Testing Library + Maestro · EAS Build + EAS Update (OTA) + GitHub Actions.

## Machine State (already done — do not redo)

- ✅ Node 24.18.0 installed via nvm (⚠️ one-time: run `nvm use 24.18.0` in an **elevated** terminal to make it the global default)
- ✅ `JAVA_HOME = C:\Program Files\Android\Android Studio\jbr` (JDK 21), `ANDROID_HOME` set, platform-tools/emulator/cmdline-tools on PATH
- ✅ Android Studio + SDK (platform 36) + cmdline-tools installed; Git 2.55
- ✅ Emulator **`Roava_Pixel`** (Pixel 7, Android 36, Google APIs) created and boot-snapshotted — Expo Go and dev builds run on it
- ✅ Windows gotchas documented: PowerShell `>` corrupts binary output (use `cmd /c`); `nvm use` needs elevation; emulator must be launched detached (`Start-Process`)

---

## Global Constraints

- TypeScript `strict: true` (+ `noUncheckedIndexedAccess`); no `any` outside typed escape hatches.
- No API calls from screens/components — RTK Query endpoints backed by service + repository layers only.
- Every list ≥ ~20 items uses FlashList with memoized items and stable `keyExtractor`.
- Every async surface ships loading (skeleton), empty, error, and offline states — no exceptions.
- All animations: Reanimated on the UI thread, 150–300 ms micro-interactions, spring-based, reduced-motion respected.
- Touch targets ≥ 48×48 dp; text contrast ≥ 4.5:1 in **both** themes; every icon-only control has `accessibilityLabel`.
- No emoji as icons — Lucide (`lucide-react-native`) only, one stroke width app-wide.
- Semantic color tokens only; no raw hex in components.
- Secrets: session tokens in expo-secure-store only; API keys via `EXPO_PUBLIC_*` env vars with the explicit understanding they are extractable from the APK (quota-capped free keys only).
- Mock data lives in `src/mocks/` behind repository interfaces — swappable without touching UI.
- Conventional commits (husky regex gate); one branch per phase; PR description + review checklist per phase.

---

## Design System (locked before Phase 1 builds it)

**Direction: "Modern Explorer"** — warm, organic, premium. Adventure orange as the action color, map teal as wayfinding/secondary, warm off-white surfaces in light mode, deep slate in dark mode. Organic rounded geometry (16–24 px radii), soft natural shadows, generous whitespace, photography-forward layouts.

### Color tokens (semantic, per theme)

| Token | Light | Dark | Role |
|---|---|---|---|
| `primary` | `#EA580C` | `#FB923C` | CTAs, active states |
| `on-primary` | `#FFFFFF` | `#1C1005` | Text/icon on primary |
| `secondary` | `#0891B2` | `#22D3EE` | Maps, links, info accents |
| `accent` | `#D97706` | `#FBBF24` | Highlights, ratings |
| `background` | `#FFF7ED` | `#0B1120` | App background |
| `surface` | `#FFFFFF` | `#1E293B` | Cards, sheets |
| `foreground` | `#0F172A` | `#F1F5F9` | Primary text |
| `muted-foreground` | `#64748B` | `#94A3B8` | Secondary text (≥3:1) |
| `border` | `#FCEAE1` | `#334155` | Dividers, outlines |
| `destructive` | `#DC2626` | `#F87171` | Errors, deletes |
| `success` | `#16A34A` | `#4ADE80` | Confirmations |

Dark mode uses lightened, desaturated variants (never inverted); both themes designed and contrast-tested together.

### Typography

- **Headings:** Satoshi (Fontshare, free) — Bold 700 / Medium 500. **Body/UI:** Inter (`@expo-google-fonts/inter`) — 400/500/600.
- Loaded via `expo-font`, splash-gated. Type scale: 12 · 14 · 16 (base) · 18 · 20 · 24 · 30 · 36. Line-height 1.5 body / 1.2 headings. Tabular figures for prices and timers.

### Shape, motion, texture

- Radii: `sm 8` / `md 12` / `lg 16` / `xl 24` / `full`. Cards `lg`, sheet tops `xl`, primary CTAs pill.
- Elevation: 3-step natural shadow scale (border+surface-tint driven in dark).
- Motion: spring-based, press scale 0.97, staggered list entrances 30–50 ms, shared-element hero transitions, exits ~65% of enter.
- Icons: Lucide, 1.75 stroke, sizes 16/20/24.

### Anti-patterns (enforced in review)

Inconsistent styling between screens · poor dark-mode contrast · emoji icons · mixed icon families · raw hex in components · hover-dependent interactions.

---

## Folder Structure

```
roava/
├── app/                        # Expo Router — routes only, zero business logic
│   ├── (auth)/                 # login, onboarding
│   ├── (tabs)/                 # home, search, trips, favorites, profile
│   ├── destination/[id].tsx
│   └── _layout.tsx             # providers: store, theme, gesture root, sheets
├── src/
│   ├── components/ui/          # design-system primitives (Button, Text, Card…)
│   ├── components/shared/      # composed cross-feature components
│   ├── features/<feature>/     # components/, hooks/, api/, types/, utils/ per feature
│   ├── services/               # api client, interceptors, error mapping
│   ├── repositories/           # data access interfaces + impls (live/mock)
│   ├── store/                  # RTK store, slices, RTK Query api defs
│   ├── lib/                    # mmkv, secure-store, theme, haptics, analytics
│   ├── hooks/                  # global hooks (useTheme, useOnline, useDebounce)
│   ├── mocks/                  # isolated mock data
│   └── types/                  # global types
├── assets/fonts|images|illustrations/
└── docs/plans/                 # this plan + per-phase task plans
```

**Rule:** screens compose features; features call hooks; hooks call RTK Query; RTK Query calls repositories; repositories call services. Nothing skips a layer downward.

---

## Public API Map & Key-Safety Verdicts

| Feature | API | Auth model | Mobile-safe? |
|---|---|---|---|
| Cities/countries | GeoDB Cities (RapidAPI free) | header key | ⚠️ extractable — free tier, quota-capped |
| Weather/AQI | OpenWeather | query key | ⚠️ same |
| Attractions/POI | Overpass API (OSM) | none | ✅ |
| Map tiles | react-native-maps (Google provider) | key restricted by package + SHA-1 | ✅ |
| Currency | open.er-api.com | none | ✅ |
| Flights | OpenSky Network | anonymous (rate-limited) | ✅ |
| Imagery | Unsplash (demo tier) | key | ⚠️ 50 req/h — cached aggressively |
| Auth | Google Sign-In | OAuth (no client secret) | ✅ |

Where a key is extractable we ship it only because it is a free, quota-capped, non-billing key; the production path (thin proxy) is documented but not built, per the frontend-first rule.

---

## Phases

### Arc A — Foundation (0–3)

**Phase 0 · Project Foundation & Tooling** — `feat/phase-00-foundation`
`npx create-expo-app` (TypeScript), strict tsconfig + `@/` alias (Expo/Metro reads tsconfig paths natively — one config, not three), ESLint (+ a11y plugin), Prettier, Husky + lint-staged + conventional-commit hook, folder skeleton, `EXPO_PUBLIC_*` env strategy + `.env.example`, README, run in **Expo Go** on `Roava_Pixel` and optionally on a physical phone (QR scan).
*Teaches:* Expo vs bare RN (what CNG/prebuild does with the `android/` folder we hand-managed before), Expo Go vs dev builds, Metro, mobile env vars.
*Exit:* app hot-reloads in Expo Go on the emulator; commit gates fire.

**Phase 1 · Design System & UI Kit** — `feat/phase-01-design-system`
NativeWind v4 token set (CSS-variable themes), fonts via expo-font splash-gated, primitives: `Text`, `Button` (variants/loading/haptic), `Card`, `Input`, `Badge`, `Skeleton`, `EmptyState`, `ErrorState`, `Screen`, `Icon`. Theme store (light/dark/system) in MMKV. Hidden dev gallery screen rendering every primitive in both themes.
*Exit:* gallery passes contrast + touch-target audit in both themes.

**Phase 2 · Navigation Shell & Onboarding** — `feat/phase-02-navigation`
Expo Router: 5-tab shell (Home, Search, Trips, Favorites, Profile), auth group, destination detail route, typed routes, deep-linking scheme (`roava://`), Android back handling, custom animated tab bar (Reanimated), 3-slide onboarding with persisted skip.
*Exit:* cold start lands correctly for new vs returning user; `npx uri-scheme open roava://destination/paris --android` works.

**Phase 3 · State & Data Layer** — `feat/phase-03-data-layer`
Redux Toolkit + RTK Query with `axiosBaseQuery`, interceptors (timeout, retry/backoff, typed `AppError` mapping), repository interfaces + mock impls, MMKV persistence for selected slices, `useOnline` (NetInfo) + offline banner.
*Exit:* demo screen shows loading/empty/error/offline states from a mock repo; airplane-mode relaunch serves cache.

### Arc B — Identity & Discovery (4–7)

**Phase 4 · Auth & Profile** — `feat/phase-04-auth` — Google Sign-In (`@react-native-google-signin/google-signin`) — **first EAS development-build milestone** (Expo Go can't run it); session in SecureStore; guest mode. *Exit:* session survives app kill; works in the dev build.
**Phase 5 · Home & Discovery Feed** — `feat/phase-05-home` — greeting, trending (GeoDB+Unsplash via expo-image), rails, FlashList, skeletons, MMKV-cached offline cold start. *Exit:* 60 fps scroll; airplane-mode feed.
**Phase 6 · Search** — `feat/phase-06-search` — debounced GeoDB search, filters in bottom sheet, MMKV history, rate-limit-aware UX (1 req/s free tier).
**Phase 7 · Destination Details** — `feat/phase-07-destination` — parallax hero, weather/time/currency snapshots, Overpass POIs, independent section degradation, favorite toggle, share deep link.

### Arc C — Core Travel Tools (8–12)

**Phase 8 · Weather** — full feature: hourly/7-day, UV, AQI, animated sunrise arc (SVG), TTL cache + offline fallback.
**Phase 9 · Maps & Nearby** — react-native-maps via config plugin (dev build), expo-location permission flow with denial fallback, Overpass markers + clustering, themed map styles, saved locations. *Exit:* 200+ markers smooth; denial path usable.
**Phase 10 · Currency** — live rates, favorite pairs, offline-cached with staleness banner — flagship offline-first showcase.
**Phase 11 · Flights** — OpenSky search/track, live map position, status timeline, polling with rate-limit respect, honest empty states.
**Phase 12 · Trip Planner** — offline-first crown: trips, drag-reorder itineraries (Gesture Handler + Reanimated), budget, packing checklist, notes; RHF+Zod; 100% local via repository interface; versioned schema. *Exit:* full lifecycle in airplane mode.

### Arc D — Retention & Polish (13–15)

**Phase 13 · Favorites & Offline Hardening** — unified favorites, swipe-to-remove + undo, offline snapshots, app-wide offline audit.
**Phase 14 · Notifications** — expo-notifications: scheduled trip reminders, packing nudges, weather-alert checks; Android channels; 13+ permission UX; notification deep links.
**Phase 15 · Settings, A11y & Polish** — settings (theme, notif prefs, cache, privacy, about); TalkBack pass, font-scale, reduced-motion, touch-target and contrast sweeps app-wide.

### Arc E — Production (16–17)

**Phase 16 · Observability, Testing & Performance** — Sentry (EAS source maps), Firebase Analytics + Crashlytics, error boundaries; Jest (repos/transforms/slices), RNTL (primitives + critical flows), Maestro golden path; release-build profiling, Hermes profile, startup budget < 2 s TTI.
**Phase 17 · CI/CD & Play Store Launch** — EAS profiles (dev/preview/production), Play App Signing, versioning, adaptive icon/splash, store listing + Data Safety form, internal → closed → production rollout, **EAS Update OTA** strategy + rollback, GitHub Actions (PR checks + EAS build triggers).
*Exit:* **Roava live on Google Play.**

---

## Future-Ready Seams

AI planner/chat behind repository interfaces · premium via `lib/flags.ts` + new route group · backend swaps in behind repositories · trips carry `ownerId` + schema versioning · budget module isolated · trip data readable via one selector module (widgets/Wear later).

## Top Risks & Mitigations

1. **Dev-build wall (Phases 4/9):** Google Sign-In and Maps don't run in Expo Go — EAS development build introduced deliberately in Phase 4 as a teaching milestone. The `Roava_Pixel` emulator and machine setup from the bare-RN phase already satisfy the local requirements.
2. **Free-API fragility:** aggressive caching, debounce, honest degraded states designed in.
3. **Exposed API keys:** per-API verdict table; quota-capped free keys only; proxy path documented, not built.
4. **Scope creep:** hard phase gates; new ideas go to `docs/plans/backlog.md`.
5. **Windows quirks:** documented in Machine State above.
