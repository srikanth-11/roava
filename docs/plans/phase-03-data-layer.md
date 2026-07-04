# Phase 3 — State & Data Layer

> Branch: `feat/phase-03-data-layer`.

**Goal:** The layered data architecture every feature phase plugs into: Axios client with typed error mapping + retry, RTK Query over repositories, selective slice persistence via AppStorage, and the app-wide online/offline model — proven by a dev demo screen showing loading/empty/error/offline states and an airplane-mode cold start served from cache.

## Layering (locked)

```
screens → feature hooks → RTK Query endpoints → repositories → services (axios)
```

- **services/** own HTTP: instance factory, timeout, retry w/ exponential backoff (idempotent GETs only), dev logging, `unknown → AppError` mapping.
- **repositories/** own data access: interface per domain + implementations (mock now, live per feature phase). RTK Query endpoints call repositories via `queryFn` — screens never know the source.
- **store/** owns state: RTK store, api slice, feature slices, hand-rolled persistence (listener middleware + AppStorage) for whitelisted slices — teaches the mechanism redux-persist hides; MMKV swap later stays invisible.

## Key decisions

1. **`AppError` taxonomy:** `kind: 'network' | 'timeout' | 'rate-limit' | 'server' | 'client' | 'unknown'` + `userMessage` + `retryable`. UI switches on kind, never on axios internals.
2. **Hand-rolled persistence** over redux-persist: RTK `createListenerMiddleware` writes whitelisted slices to AppStorage (debounced); store rehydrates before first render. Fewer deps, full understanding, engine-agnostic.
3. **Mock repository with controls:** `MockDestinationsRepository` supports latency + failure injection so every UI state is reproducible on demand.
4. **Offline model:** `useOnline` (NetInfo) + global `OfflineBanner` in root layout; cached data renders with a "stale" affordance when offline.
5. **Airplane-mode testing note:** adb-reverse tunnels survive airplane mode (qemu pipe, not network) — dev bundle still loads while NetInfo correctly reports offline.

## Tasks

- [ ] Task 1: Deps (`@reduxjs/toolkit react-redux axios`, `expo install @react-native-community/netinfo`); `services/errors.ts` (AppError + mapper), `services/http.ts` (factory, interceptors, retry, dev logging)
- [ ] Task 2: `store/` (store, listener persistence, rehydration gate), `types/destination.ts`, `mocks/destinations.ts`, `repositories/destinations.ts` (interface + mock), api slice with `getTrending` via queryFn; `useOnline` + `OfflineBanner`; providers in root layout
- [ ] Task 3: `/dev-data` demo screen (states on demand: loading/empty/error/offline + cached list, pull-to-refresh); verify all states + airplane-mode cold start on emulator; JOURNEY entries; commit; debrief; **wait for "Phase Approved"**

**Exit criteria:** demo screen reproduces all four states from the mock repo; airplane-mode relaunch renders last-fetched list with offline banner; gates green; screens contain zero axios/fetch imports.
