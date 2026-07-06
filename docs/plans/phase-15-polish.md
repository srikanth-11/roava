# Phase 15 — Polish & Dark Theme

> Branch: `feat/phase-15-polish`. Emulator is OFF (RAM directive) — this phase is code-level; every visual claim lands on the deferred checklist.

**Goal:** Pay down the polish deferrals accumulated since Phase 7: a dark-theme correctness sweep, motion consistency, and one voice for stale-data and empty states.

## Key decisions

1. **Dark theme is a token audit, not a redesign.** The semantic token system has existed since Phase 1 and most code uses it. The sweep: grep out every raw hex / Tailwind literal color (`bg-white`, `text-black`, `slate-*`, `#fff`…) in `src/` outside the token definitions, replace with semantic tokens; audit `palette.ts` for gaps; confirm scheme-driven surfaces (map style URLs, keyboardAppearance, StatusBar) all follow `resolved` theme.
2. **Motion polish = Reanimated entering/layout transitions on the plain-View lists** (packing, budget entries, favorites undo bar, trip sections) — FlashList/DraggableFlatList manage their own items and are left alone. **Respect `useReducedMotion()`** — animations collapse to instant when the OS asks.
3. **One voice for staleness:** shared `StaleBadge` component (warning-variant Badge + optional age label) replacing the four ad-hoc stale indicators (home feed chip, detail "saved data", weather "saved forecast", currency "rates from X ago" caption stays since it's inline prose — converts where it's a badge).
4. **Empty-state audit:** every EmptyState carries icon + title + actionable message; no dead ends.

## Tasks

- [x] Task 1: Dark sweep — ZERO non-token colors found in src (discipline held); one fix: Input placeholderTextColor inline literals → palette (JOURNEY 18.1); scheme surfaces (StatusBar, map styles, sheets) all palette-driven ✓
- [x] Task 2: `lib/motion.ts` presets (ReduceMotion.System baked in) — packing/budget rows, undo bar, trip section crossfade, Home staggers unified (18.2)
- [x] Task 3: `StaleBadge` + `staleAgeLabel` adopted at 4 badge sites; CurrencyCard stays prose (deliberate); all 10 EmptyStates pass the audit (18.3)
- [x] Task 4: Gates green; JOURNEY 18; commit; debrief; **wait for "Phase Approved"**

**Exit criteria (code-level):** zero non-semantic colors outside token files; all mutable plain-View lists animate with reduced-motion guard; one StaleBadge component serves all badge-shaped staleness; gates green.

## ⏸ DEFERRED RUNTIME VERIFICATION (consolidated end-of-build pass)

- [ ] Dark theme visual walk of all screens (incl. map dark style, hero scrim, sheet backgrounds)
- [ ] Entering/layout animations look right; reduced-motion device setting collapses them
- [ ] StaleBadge renders correctly in all four homes
