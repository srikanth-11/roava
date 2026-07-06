# Roava — five-minute demo script

The guided tour, in the order that tells the story best. Works on the emulator
or a phone with the dev build (or, after Phase 18, the release APK).

## 1. Discovery (45 s)

- Open the app → **Home**: greeting, trending rail, explore feed. Mention: GeoDB
  cities + Unsplash photos, every photo attributed (API terms), photos cached to
  disk after first sight.
- Tap **Search**, type "par" → debounced results with prefix highlighting.
  Open the filters sheet — press the hardware back button: _the sheet closes,
  the screen stays_ (Phase 16).

## 2. One destination, many providers (60 s)

- Open **Paris** (or Mumbai): parallax hero, then point at the three snapshot
  cards — weather, local time, currency — **three providers, three independent
  fates**; one failing never takes the row down.
- Scroll the OpenStreetMap sights; tap **Map** → MapLibre with engine-native
  clustering. Tap a cluster — it expands. _No Google, no billing account:
  OpenFreeMap tiles are keyless._
- Back on the detail, tap the **Weather** card → sun arc, hourly rail, 5-day
  list. Free tier has no daily endpoint — the app aggregates 3-hourly slots
  client-side and labels partial days "so far".

## 3. The airplane-mode party trick (90 s)

> The core pitch: **turn on airplane mode now** and keep using the app.

- Home still shows the feed (cached) with a **saved data** badge.
- The destination you just visited still opens — full detail from its
  last-known-good snapshot, badged "saved data"; cards degrade one by one
  (local time still ticks — it's client-side; sights fail with a retry).
- Weather still renders the whole forecast — badged "saved forecast · updated
  N hours ago".
- Currency still converts — "rates from N hours ago". One er-api call cached a
  whole rate table.
- Favorites still shows photos (disk cache). Swipe one away — **undo it**; note
  it comes back with its original "saved N hours ago", not "just now".

## 4. Trips — fully local (60 s)

- Create a trip (dates validate: end can't precede start). Day chips appear,
  one per day.
- Add three itinerary stops; **long-press and drag** to reorder — order
  persists.
- Add a budget entry (note the home-currency default), tick a packing item,
  type a note — watch "Saving… → Saved on this device".
- Kill the app from recents. Reopen. Everything is exactly where it was —
  versioned MMKV storage with corruption recovery underneath.

## 5. Flights + the engineering close (45 s)

- Home → **Flights** → type "UAL" → live aircraft. Open one: position on a
  mini-map, phase chips derived from raw ADS-B state.
- Close with the constraint-as-feature story: anonymous OpenSky bills by query
  _area_, so the tracker polls a ±1.5° box for 1 credit instead of 4 — measured
  empirically, documented in JOURNEY 14.1. **Every API in the app is free-tier;
  the budgets are engineered, not hoped for.**

## If asked "what broke along the way?"

Open [JOURNEY.md](JOURNEY.md) at the chapter index. Personal favorites:
Overpass hiding errors inside HTTP 200 (10.3), the RTK cache-key render loop
(14.2), adb reverse choking on multi-MB bundles (15.4), and the fix that
"didn't work" because airplane toggles had silently killed HMR (16.4).
