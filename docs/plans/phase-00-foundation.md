# Phase 0 — Project Foundation & Tooling (Expo)

> Executes against the Expo master plan. Branch: `feat/phase-00-foundation`.

**Goal:** Roava (Expo) hot-reloads in Expo Go on the `Roava_Pixel` emulator, with commit-time quality gates (strict TS, ESLint, Prettier, Conventional Commits) active.

**Carried over from machine setup (do not redo):** Node 24 via nvm, JAVA_HOME (JDK 21), ANDROID_HOME + PATH, Git 2.55, AVD `Roava_Pixel` (API 36).

## Tasks

### Task 1: Scaffold
- [ ] Move `roava/docs` aside; `npx create-expo-app@latest roava` (default template = TypeScript + Expo Router); restore `docs/`
- [ ] `npm run reset-project` to clear example screens (keep clean `app/` with `_layout.tsx` + `index.tsx`); delete `app-example/`
- [ ] `git init -b main`, initial commit, branch `feat/phase-00-foundation`

### Task 2: TypeScript & structure
- [ ] tsconfig: `strict` (template default) + `noUncheckedIndexedAccess`, alias `@/*` → `./src/*` (Expo's Metro reads tsconfig paths natively — one config, vs three on bare RN)
- [ ] Folder skeleton: `src/{components/ui,components/shared,features,services,repositories,store,lib,hooks,mocks,types}` + `assets/fonts` (template has `assets/images`)
- [ ] Verify `npx tsc --noEmit` passes

### Task 3: Lint/format/commit gates
- [ ] `npx expo lint` to scaffold eslint.config.js (eslint-config-expo flat config); add Prettier
- [ ] husky + lint-staged: pre-commit = lint-staged (eslint --fix + prettier) + `tsc --noEmit`; commit-msg = Conventional Commits regex
- [ ] Verify: bad commit message rejected, good one passes

### Task 4: Env strategy
- [ ] `.env` + `.env.example` with `EXPO_PUBLIC_*` vars (Expo loads .env natively — no library needed, unlike bare RN's react-native-config)
- [ ] `.env` git-ignored; README documents the extractability caveat

### Task 5: Run & verify
- [ ] Confirm `Roava_Pixel` emulator running (relaunch detached if not)
- [ ] `npx expo start --android` → auto-installs Expo Go on emulator, opens app
- [ ] Screenshot proof; edit `app/index.tsx`, confirm hot reload
- [ ] README (Expo edition), commits, 16-point debrief, **wait for "Phase Approved"**

**Exit criteria:** app hot-reloads in Expo Go on the emulator; gates fire on commit; README reproduces setup.
