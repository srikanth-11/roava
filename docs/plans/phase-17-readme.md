# Phase 17 — README & Portfolio Polish

> Branch: `feat/phase-17-readme`. Docs-only — no emulator, no builds.

**Goal:** The repo's public face matches the work inside it: a README that tells the architecture and offline-first story, real screenshots from the verified sessions, a navigable JOURNEY, and a demo script for walking someone through the app.

## Key decisions

1. **README structure:** hero (what + why) → screenshots grid → feature map (phase-by-phase) → architecture (layering diagram, offline-first patterns) → tech stack table → API map (all free/keyless, the constraint as a feature) → setup/run (dev-build workflow) → docs index (JOURNEY as the crown jewel).
2. **Screenshots from the verification sessions** — the emulator captures that verified each phase live in `docs/screenshots/` with descriptive names; an "offline receipts" row showing the saved-data badges is the differentiator.
3. **JOURNEY gets a chapter index** at the top — 19 chapters deserve a table of contents.
4. **`docs/demo.md`** — a 5-minute guided walkthrough (the portfolio-interview script), including the airplane-mode party trick.

## Tasks

- [x] Task 1: 11 screenshots curated into `docs/screenshots/` (6.8 MB) — each candidate VERIFIED by eye first (caught three miscasts, incl. the 14.2 render-loop error screen posing as the flight tracker)
- [x] Task 2: README rewritten — screenshots grid + offline receipts row, feature map, architecture diagram, API table, corrected run instructions (dev build, not the stale Expo Go copy)
- [x] Task 3: JOURNEY 19-chapter index table; `docs/demo.md` five-minute script (airplane-mode party trick as the centerpiece)
- [x] Task 4: Gates; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** README renders clean on GitHub (checked in markdown preview terms), screenshots referenced correctly, JOURNEY navigable, demo script complete; gates green.
