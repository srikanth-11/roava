# Phase 1 — Design System & UI Kit

> Branch: `feat/phase-01-design-system`. Tokens/typography/motion specs live in the master plan §Design System ("Modern Explorer").

**Goal:** NativeWind-powered design system with semantic tokens in both themes, custom fonts, and 10 production-grade primitives — provable via a dev-only gallery screen that passes contrast + touch-target audit in light AND dark.

## Key technical decisions

1. **NativeWind v4 + tailwindcss 3.4.x** (NativeWind 4 is NOT compatible with Tailwind v4 — pin `tailwindcss@^3.4`).
2. **Theme switching:** semantic CSS variables (`--color-primary` etc.) defined in `global.css` under `:root` (light) and `.dark:root` (dark); `tailwind.config.js` maps token names → `var(...)`. Manual control via NativeWind `colorScheme.set()`, persisted selection (light/dark/system).
3. **Storage constraint (Expo Go):** react-native-mmkv needs a custom native build — unavailable until the Phase 4 dev build. Ship `src/lib/storage.ts` as an interface with an AsyncStorage implementation now; swap to MMKV later with zero call-site changes. (Repository pattern applied to storage.)
4. **Fonts:** Satoshi (headings) from Fontshare + Inter (body) via `@expo-google-fonts/inter`; loaded with `useFonts`, gated by `expo-splash-screen`.
5. **Icons:** `lucide-react-native` + `react-native-svg` (via `npx expo install` for SDK-matched version).
6. **Haptics:** `expo-haptics` on Button press (light impact), respecting a future settings toggle.
7. **a11y lint:** add `eslint-plugin-react-native-a11y` via FlatCompat (plugin is eslintrc-style).

## Tasks

### Task 1: Dependencies & NativeWind wiring

- [ ] `npx expo install react-native-svg @react-native-async-storage/async-storage expo-haptics`
- [ ] `npm i nativewind tailwindcss@^3.4.0` + `npm i -D prettier-plugin-tailwindcss`
- [ ] `npm i lucide-react-native @expo-google-fonts/inter`
- [ ] `tailwind.config.js` (content paths src/**), `global.css` (@tailwind directives + token vars), `metro.config.js` wrapped with `withNativeWind`, `babel.config.js` with nativewind jsxImportSource preset, `nativewind-env.d.ts` types
- [ ] Smoke test: a `className="bg-primary"` view renders orange in Expo Go

### Task 2: Tokens & theme store

- [ ] All master-plan tokens as CSS vars (light `:root` / dark `.dark:root`) + tailwind color/radius/spacing mapping
- [ ] `src/lib/storage.ts` — `AppStorage` interface + AsyncStorage impl
- [ ] `src/lib/theme.ts` + `src/hooks/useTheme.ts` — mode = light|dark|system, persisted, applies `colorScheme.set()`
- [ ] Root layout: theme provider + status-bar style follows theme

### Task 3: Fonts

- [ ] Download Satoshi (Fontshare) → `assets/fonts/` (Bold 700, Medium 500); Inter via google-fonts package
- [ ] `useFonts` in root `_layout.tsx`, splash held until loaded (`expo-splash-screen`)
- [ ] Font families exposed as Tailwind `font-heading` / `font-body`

### Task 4: Primitives (`src/components/ui/`)

Each: typed props, both themes, a11y (role/label/state), 48dp min touch target.

- [ ] `Text` — variants: display, h1, h2, h3, body, body-sm, label, caption; color prop from tokens
- [ ] `Icon` — Lucide wrapper, sizes 16/20/24, token colors, 1.75 stroke
- [ ] `Button` — variants: primary, secondary, outline, ghost, destructive · sizes sm/md/lg · loading (spinner) · disabled · haptic on press · press scale 0.97 (Reanimated)
- [ ] `Card` — surface + border + radius-lg, optional pressable
- [ ] `Input` — label, helper, error state, left/right icon slots, focus ring
- [ ] `Badge` — variants: default, success, warning, destructive, outline
- [ ] `Skeleton` — shimmer via Reanimated loop, radius variants
- [ ] `EmptyState` — icon + title + message + optional action button
- [ ] `ErrorState` — same shape + retry action
- [ ] `Screen` — SafeArea wrapper, bg token, optional scroll, edges control
- [ ] Barrel export `src/components/ui/index.ts`

### Task 5: Dev gallery + verification

- [ ] `src/app/dev-gallery.tsx` (`__DEV__`-only) rendering every primitive/variant + theme toggle
- [ ] ESLint a11y plugin wired (FlatCompat) — lint passes
- [ ] Screenshot audit: gallery in light and dark on emulator; contrast + touch targets checked
- [ ] JOURNEY.md entries for any problems; commits; 16-point debrief; **wait for "Phase Approved"**

**Exit criteria:** gallery renders all primitives in both themes at 60fps; lint/typecheck/gates green; no raw hex in component code.
