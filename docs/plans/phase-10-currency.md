# Phase 10 — Currency

> Branch: `feat/phase-10-currency`.

**Goal:** The flagship offline-first tool: a currency converter with live rates, favorite pairs, and honest staleness — built so a traveler with no data connection still gets an answer (plus the truth about how old it is). Everything rides the already-keyless open.er-api.

## Key decisions

1. **Whole-table caching per base:** er-api returns ALL ~160 rates for a base in one call. `CurrencyRepository` grows `getRateTable(base)` — TTL 12 h + stale-if-error, AppStorage-cached per base (same pattern as `getRate`, one level up). One cached table converts the base to _anything_ offline; ten favorite pairs cost at most a handful of tables.
2. **Staleness is a first-class UI state**, not an error: fresh (quiet) → aging (caption "rates from X ago") → stale-served-offline (warning Badge + refresh affordance). The pattern Weather rehearsed, now the headline.
3. **Route `/currency`** — a standalone tool screen (deep-linkable per the 11.5 pattern, no params needed). Entry: a tool card on Home next to the search banner. (A future "Tools" hub can absorb it; one tool doesn't earn a hub yet.)
4. **Converter UX:** big amount input (numeric keypad), from → to currency rows, swap button, result rendered large with `Intl.NumberFormat` (Hermes has full ICU — correct thousands separators per currency, free). Inverse rate shown as a caption ("1 INR = 0.0092 EUR").
5. **Currency metadata:** extend `lib/currencies.ts` with a `CURRENCY_META` map (code → name, symbol) covering the codes already in `COUNTRY_CURRENCY` (~50). Picker = searchable bottom sheet (the Phase 6 @gorhom pattern) listing code, symbol, and name.
6. **Favorite pairs:** new `currencySlice` — `favoritePairs: {base, quote}[]` (max ~8, dedupe) + `lastPair` — persisted via the WHITELIST (third slice; the 10.4 generic `loadSlice` absorbs it with two lines). Star toggles the current pair; tapping a saved pair loads it instantly from cached tables.
7. **Mock parity:** none needed — er-api is keyless, and offline behavior IS the feature under test.

## Tasks

- [ ] Task 1: Data — `getRateTable(base)` w/ TTL + stale-if-error; `CURRENCY_META`; `currencySlice` (favorite pairs + last pair) wired into store/persistence; RTK endpoint
- [ ] Task 2: Components — AmountInput, CurrencyPickerSheet (searchable), RateResult (big number + inverse caption), StalenessBanner
- [ ] Task 3: `/currency` screen — converter (amount, from/to, swap), favorite pairs rail (star/save/tap-to-load), staleness states; Home tool card entry
- [ ] Task 4: Verify — live conversion; pair favoriting + persistence across restart; **airplane-mode cold start converts from cached tables with honest staleness** (the showcase); both directions of swap; JOURNEY; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** offline cold start converts any previously-cached pair and says how old the rate is; favorite pairs survive restart; swap + picker feel instant (no refetch when the table is cached); gates green.
