# Phase 2 — Navigation Shell & Onboarding

> Branch: `feat/phase-02-navigation`.

**Goal:** 5-tab shell with a custom animated tab bar, onboarding flow gated by a persisted flag, typed routes, destination detail route, and deep linking configured — the skeleton every feature phase hangs screens on.

## Route architecture

```
src/app/
├── _layout.tsx            # root: fonts, theme, Stack { index, (tabs), onboarding, destination }
├── index.tsx              # gate: redirect → /onboarding (first run) or /home
├── onboarding.tsx         # 3 slides, animated dots, skip, persisted flag
├── (tabs)/
│   ├── _layout.tsx        # Tabs with custom AnimatedTabBar
│   ├── home.tsx           # placeholder screens this phase —
│   ├── search.tsx         # each gets its real feature in Phases 5–13
│   ├── trips.tsx
│   ├── favorites.tsx
│   └── profile.tsx        # hosts dev-gallery link in __DEV__
├── destination/[id].tsx   # typed param route, deep-link target
└── dev-gallery.tsx
```

Why `/home` instead of `(tabs)/index`: the root `index.tsx` is the onboarding gate (`<Redirect>`), so tab routes get explicit names. Deep links stay clean: `/home`, `/destination/paris`.

## Key decisions

1. **Onboarding gate = declarative `<Redirect>`** in `index.tsx` reading `StorageKeys.onboardingDone` — no imperative navigation in effects (avoids race with router mount).
2. **Custom tab bar** via `tabBar` prop: surface bg + border-t, Lucide icons, active tint primary, animated indicator + icon scale (Reanimated `.get()/.set()`), haptic on tab press, safe-area bottom inset, 48dp+ targets, `accessibilityState.selected`.
3. **Deep linking:** `"scheme": "roava"` in app.json (takes effect in dev builds/production). **Expo Go limitation:** custom schemes don't route in Expo Go — verify now with `exp://<host>/--/destination/<id>` via adb; `roava://` becomes testable at Phase 4's dev build. Log as JOURNEY entry.
4. **Placeholder tab screens** use design-system primitives + `EmptyState` — every screen looks intentional even before its feature phase.

## Tasks

- [ ] Task 1: Restructure routes (gate index, tabs group with 5 screens, destination/[id]); typecheck passes with typed routes
- [ ] Task 2: `AnimatedTabBar` (Reanimated indicator, haptics, a11y, safe area)
- [ ] Task 3: Onboarding — 3 slides (value props w/ Lucide art), horizontal pager, animated dots, Skip + Get Started → persist flag → replace to /home
- [ ] Task 4: app.json scheme + deep-link verification via adb (exp:// form); Android back behavior check (back from tab → exits, back from destination → returns)
- [ ] Task 5: Screenshots (onboarding, tabs light/dark, destination via deep link), JOURNEY entries, commit, debrief, **wait for "Phase Approved"**

**Exit criteria:** fresh install lands on onboarding → completes to tabs; relaunch skips onboarding; all 5 tabs navigate with animated bar in both themes; deep link opens destination detail; gates green.
