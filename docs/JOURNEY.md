# Roava — Build Journey & Troubleshooting Log

> A chronological record of every significant problem hit while building Roava, how it was diagnosed, how it was solved, and what it taught us. **Standing rule: every new problem + solution gets an entry here, in the phase it occurred.**

Format per entry: **Problem → Diagnosis → Solution → Lesson.**

---

## Chapter 1 — The Bare React Native Era (2026-07-04, morning)

The project began on **bare React Native CLI + Android Studio** (deliberately, to learn the native layer). A full Phase 0 was completed — RN 0.86 scaffolded, built, and running on an emulator — before the stack decision was reversed. These problems and lessons carried over.

### 1.1 Node too old

- **Problem:** Active Node was 18.20.5; RN 0.86 requires ≥ 22.11 (`engines` field).
- **Diagnosis:** `node --version` + template `package.json`.
- **Solution:** `nvm install 24.18.0` (Node 24 LTS).
- **Lesson:** Mobile RN tooling pins Node hard. Check `engines` before anything else.

### 1.2 `nvm use` → "Access is denied"

- **Problem:** Switching Node globally failed.
- **Diagnosis:** nvm-windows swaps a symlink in `C:\Program Files\nodejs` — needs an elevated terminal.
- **Solution (workaround):** prepend `%APPDATA%\nvm\v24.18.0` to `PATH` per command/session. **Permanent fix (still pending):** run `nvm use 24.18.0` once as Administrator.
- **Lesson:** On Windows, know which tools need elevation; per-session PATH prefixes are a clean workaround.

### 1.3 System Java too NEW

- **Problem:** Java 25 installed, but Gradle/AGP support only JDK 17–21.
- **Solution:** `JAVA_HOME = C:\Program Files\Android\Android Studio\jbr` (Studio's bundled JDK 21).
- **Lesson:** Backwards from the web world — for Android builds, _newer Java is often broken_. Use Android Studio's JBR; it's always compatible.

### 1.4 Git too old for lint-staged

- **Problem:** Pre-commit hook crashed: lint-staged 17 requires Git ≥ 2.32; installed was 2.31 (2021).
- **Solution:** `winget install Git.Git` → Git 2.55.
- **Lesson:** Quality gates have their own dependencies; a 5-year-old Git carries CVEs anyway.

### 1.5 RN 0.86 template bug — missing Jest preset

- **Problem:** `jest` failed: `Preset @react-native/jest-preset not found`.
- **Diagnosis:** RN 0.86 moved the preset to a separate package the template forgot to declare.
- **Solution:** `npm i -D @react-native/jest-preset@0.86.0`.
- **Lesson:** Fresh-off-the-press RN versions ship template bugs. Read the error literally.

### 1.6 sdkmanager licenses wouldn't accept via pipe

- **Problem:** `("y`n"*15) | sdkmanager --licenses` hung waiting for input (PowerShell → .bat stdin flakiness).
- **Solution:** write `y` lines to a file, redirect via cmd: `cmd /c "sdkmanager --licenses < ys.txt"`.
- **Lesson:** For interactive CLIs on Windows, file-redirected stdin through `cmd /c` is the reliable pattern.

### 1.7 Expand-Archive failed on cmdline-tools zip

- **Problem:** PowerShell's `Expand-Archive` errored mid-extraction and rolled back.
- **Solution:** `tar -xf` (bsdtar ships with Windows 10+) handled the same zip fine.
- **Lesson:** `tar` is the more robust extractor on modern Windows.

### 1.8 Emulator died mysteriously mid-session

- **Problem:** Emulator vanished ~8 minutes after launch.
- **Diagnosis:** It was launched as a child of a shell command with a 10-minute timeout — the timeout killed the process tree.
- **Solution:** launch detached: `Start-Process emulator.exe -ArgumentList "-avd","Roava_Pixel"`.
- **Lesson:** Long-lived processes (emulator, Metro) must be detached from the command that starts them.

### 1.9 PowerShell corrupted a binary screenshot

- **Problem:** `adb exec-out screencap -p > file.png` produced an invalid PNG (bytes `ff fe` = UTF-16 BOM).
- **Diagnosis:** PowerShell 5.1's `>` re-encodes streams as UTF-16 text.
- **Solution:** binary-safe redirect through cmd: `cmd /c "adb exec-out screencap -p > file.png"`.
- **Lesson:** Never pipe binary data through PowerShell 5.1 redirects.

### 1.10 The 32-minute first build (not a bug — a lesson)

- **What happened:** first `gradlew assembleDebug` took 32 min: Gradle distribution + dependency downloads + **NDK 27 (~3 GB)** + New-Architecture codegen + C++ compilation.
- **Lesson:** Bare RN debug builds compile an entire Android app. One-time cost; incremental builds drop to ~30s–2min. This build wall was a major factor in the stack switch below.

---

## Chapter 2 — The Great Stack Switch (2026-07-04, midday)

### 2.1 Decision: bare RN → Expo

- **Context:** Bare Phase 0 was complete and working, but the developer experience (build wall, three-config aliasing, manual native management, Android Studio friction) outweighed the native-learning benefit.
- **Decision:** scrap the bare codebase, restart on **Expo SDK 57**. Native depth remains reachable later via `npx expo prebuild` and EAS dev builds (Phase 4+).
- **Kept:** all environment work (Node 24, JDK 21, ANDROID_HOME, `Roava_Pixel` AVD), the design system, and every lesson above.

### 2.2 Deleting node_modules hit the Windows path limit

- **Problem:** `Remove-Item -Recurse` failed on paths > 260 chars (deep Gradle build artifacts).
- **Solution:** robocopy empty-dir mirror: `robocopy empty_dir target /MIR`, then remove.
- **Lesson:** classic Windows MAX_PATH issue; robocopy is the standard escape hatch.

---

## Chapter 3 — The Expo Era (2026-07-04, afternoon)

Phase 0 (Expo edition): scaffold → tooling → running app took **minutes** (vs hours bare). Expo Go auto-installed on the emulator; hot reload verified on-screen.

### 3.1 Template `.gitignore` does NOT ignore `.env`

- **Problem:** Expo's template ignores `.env*.local` but not `.env` — our secrets file would have been committed.
- **Solution:** added `.env` to `.gitignore` before the first commit that could leak it.
- **Lesson:** never assume a template's gitignore covers your secret files. Verify with `git status` before committing.

### 3.2 Emulator "System UI isn't responding" ANR loop

- **Problem:** persistent ANR dialog on the emulator; app was fine behind it, but the dialog kept returning.
- **Diagnosis:** emulator restored from snapshot while under heavy load (Expo Go install + first 44s bundle) wedged the System UI process.
- **Solution:** cold boot: `emulator -avd Roava_Pixel -no-snapshot-load`.
- **Lesson:** snapshots are fast but fragile under load; cold boot cures weird emulator states.

### 3.3 Physical phone: "Failed to download remote update" (java.io.IOException)

- **Problem:** scanning the QR on a real phone failed instantly.
- **Diagnosis (two stacked causes):**
  1. The QR advertised `exp://172.27.160.1:8081` — a **WSL/Hyper-V virtual adapter IP** that exists only inside the PC. Real Wi-Fi IP was `192.168.1.3`.
  2. The Wi-Fi connection's Windows firewall profile was **Public**, where node.exe had Block rules — even the right IP would have been refused.
- **Solution:** `npx expo start --tunnel` (routes via Expo's `exp.direct` relay — immune to both). **Permanent fix documented:** set the Wi-Fi network profile to Private + `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3`.
- **Lesson:** on Windows machines with WSL/Docker/Hyper-V, Metro may advertise a virtual adapter. Tunnel mode is the universal unblocker; LAN mode needs the right IP _and_ an open firewall.

### 3.4 Phone Expo Go: "incompatible SDK version"

- **Problem:** after fixing connectivity, Expo Go from the Play Store refused the project — SDK mismatch (project = SDK 57).
- **Diagnosis:** Expo Go supports exactly one SDK version; the Play Store build didn't match 57. (The emulator never hit this because Expo CLI auto-installs the matching Expo Go — found cached at `~/.expo/android-apk-cache/Expo-Go-57.0.2.apk`.)
- **Solution (used Option A):** uninstalled Play-Store Expo Go on the phone → downloaded the **SDK 57** Expo Go APK from **https://expo.dev/go** in the phone browser → allowed install from unknown source → installed → rescanned QR successfully.
- **Lesson:** Expo Go is version-locked to one SDK. For a real device, get the matching APK from expo.dev/go. This limitation disappears in Phase 4 when we switch to our own EAS development build.

---

## Chapter 4 — Phase 1: Design System (2026-07-04, evening)

### 4.1 a11y ESLint plugin vs ESLint 9

- **Problem:** `eslint-plugin-react-native-a11y` peer-depends on ESLint ≤8; project uses ESLint 9 → `ERESOLVE` install failure.
- **Diagnosis:** plugin's peer range is stale; its rules are plain rule objects that still run under ESLint 9.
- **Solution:** `npm i -D eslint-plugin-react-native-a11y --legacy-peer-deps`, wired through `FlatCompat` (plugin is eslintrc-style, config is flat).
- **Lesson:** RN ecosystem plugins often lag ESLint majors; `--legacy-peer-deps` + FlatCompat is the standard bridge — verify the rules actually execute.

### 4.2 `has-accessibility-hint` rule noise

- **Problem:** the plugin's `/all` preset demands an `accessibilityHint` wherever an `accessibilityLabel` exists — flagged every primitive.
- **Solution:** disabled that one rule with a comment; labels are the requirement, hints are supplementary per RN a11y docs.
- **Lesson:** adopt a11y presets critically — keep the rules that create access, drop the ones that create noise.

### 4.3 React Compiler rejects Reanimated `.value` writes

- **Problem:** `expo lint` errored "This value cannot be modified" on `scale.value = withSpring(...)` in Button.
- **Diagnosis:** SDK 57 enables React Compiler; its immutability analysis forbids direct mutation of hook-returned objects. Reanimated added `.get()`/`.set()` precisely for this.
- **Solution:** `scale.set(withSpring(...))` and `scale.get()` inside `useAnimatedStyle`.
- **Lesson:** with React Compiler on, use Reanimated's accessor API — new-code standard from here on.

### 4.4 MMKV can't run in Expo Go (design decision, pre-empted)

- **Problem:** the plan said "theme persisted in MMKV," but react-native-mmkv needs custom native code — unavailable in Expo Go until the Phase 4 dev build.
- **Solution:** `src/lib/storage.ts` defines an async `AppStorage` interface with an AsyncStorage implementation; MMKV slots in behind the same interface later with zero call-site changes.
- **Lesson:** the repository/interface pattern isn't just for APIs — any swappable dependency (storage, analytics) earns an interface.

---

## Chapter 5 — Phase 2: Navigation Shell (2026-07-04, night)

### 5.1 `BottomTabBarProps` type wouldn't resolve

- **Problem:** custom tab bar importing `BottomTabBarProps` from `@react-navigation/bottom-tabs` → TS couldn't find the types.
- **Diagnosis:** the package was only a _transitive_ dependency (via expo-router); TS type resolution needs it declared directly.
- **Solution:** `npm i @react-navigation/bottom-tabs --legacy-peer-deps` (expo install choked on the a11y plugin's stale peers).
- **Lesson:** import only from packages you declare — transitive deps are an implementation detail that TS rightly refuses to see.

### 5.2 Custom URL schemes don't work in Expo Go

- **Problem:** the plan says deep links use `roava://`, but Expo Go can't register our custom scheme.
- **Diagnosis:** Expo Go is a shared host app — its manifest owns `exp://`; per-project schemes only exist in dev/production builds where WE own the manifest.
- **Solution:** verify deep linking now via `exp://<host>/--/destination/paris` (adb intent); `roava://` becomes real at Phase 4's dev build. `scheme: "roava"` already configured in app.json.
- **Lesson:** the `/--/` separator marks where the in-app path starts in Expo Go links; scheme config is inert until you own the binary.

---

## Chapter 6 — Phase 3: Data Layer (2026-07-04, late night)

### 6.1 RTK Query error is a union, not your type

- **Problem:** `error.userMessage` failed to typecheck — RTK Query types errors as `AppError | SerializedError` (its own fallback for exceptions thrown outside your queryFn contract).
- **Solution:** the `isAppError` type guard (already in `services/errors.ts`) narrows before rendering.
- **Lesson:** even with a typed baseQuery, RTK Query reserves the right to hand you a `SerializedError` — always guard at the UI boundary.

### 6.2 "Unmatched Route" after adding a new route file

- **Problem:** deep-linking to freshly created `/dev-data` showed Expo Router's Unmatched Route screen.
- **Diagnosis:** the app was running a bundle built before the file existed; new _route files_ (unlike edits) need a fresh bundle, and the deep link raced it.
- **Solution:** force-stop the app and relaunch so it fetches the current bundle.
- **Lesson:** Fast Refresh patches modules; new routes change the router manifest — reload the app after adding route files.

### 6.3 Airplane-mode testing with a dev server (technique)

- **Insight:** adb `reverse` tunnels ride the emulator's qemu pipe, not the network — so `exp://127.0.0.1:8081` still serves the bundle in airplane mode while NetInfo correctly reports offline. Perfect setup for offline UX testing in development.
- **Caveat noted:** Expo Go stalls ~60s on startup probing for updates before falling back to the tunnel — patience, not breakage.

---

## Chapter 7 — Phase 4: Auth & the Dev Build (2026-07-05)

### 7.0 The dev-build milestone (context)

- `npx expo run:android` produced Roava's own binary (`com.kasir.roava`): CNG prebuild generated `android/` from app.json, local Gradle built it in 17 min (NDK/Gradle caches from the bare era reused). No EAS account needed. Expo Go is retired for this project.

### 7.1 First dev build failed: MMKV needs Nitro Modules

- **Problem:** `expo run:android` failed at `react-native-mmkv/android/build.gradle`: "Project with path ':react-native-nitro-modules' could not be found."
- **Diagnosis:** MMKV v4 is built on the **Nitro Modules** architecture; `react-native-nitro-modules` is a required peer dependency npm didn't auto-install (peers aren't installed under `--legacy-peer-deps`).
- **Solution:** `npm i react-native-nitro-modules --legacy-peer-deps`, rebuild.
- **Lesson:** when using `--legacy-peer-deps` you own peer management manually — read each native library's install docs for its peers; Gradle errors name the missing project.

### 7.2 MMKV still not registered at runtime — deferred by design

- **Problem:** even after a clean `prebuild --clean` + rebuild, runtime error: "The native NitroModules Turbo/Native-Module could not be found" → AppStorage falls back to AsyncStorage.
- **Diagnosis:** Nitro's runtime registration appears incompatible with brand-new Expo SDK 57 / RN 0.86 as of today; Gradle compiles it but the TurboModule never registers.
- **Decision:** ship on AsyncStorage — this is exactly why `AppStorage` is an interface with a graceful fallback. Backlog: try `react-native-mmkv@3` (TurboModule-based, no Nitro) at the next native rebuild (Phase 9 requires one anyway).
- **Lesson:** interfaces + fallbacks turn "blocking native issue" into "backlog item." Also: storage engine swaps orphan existing data (onboarding flags "reset" when MMKV briefly activated) — a migration step is needed when the swap really happens.

### 7.3 Dev-client deep-link behavior ≠ production

- **Observation:** cold-start `roava://destination/tokyo` lands in the dev-launcher first; the link is delivered to the app after a server is selected (and is replayed on next launch). Warm-app links route instantly. Production builds route directly.
- **Also noted:** back from a cold-start deep link exits the app (deep-linked screen is the only stack entry) — acceptable now; Phase 7 will make Home sit beneath destination screens.
- **Lesson:** test deep links warm in dev clients; trust cold-start behavior only in release builds.

---

## Chapter 8 — Phase 5: Live APIs (2026-07-05)

### 8.1 GeoDB 404: wrong RapidAPI host

- **Problem:** first live request → `404 {"message":"API doesn't exists"}`.
- **Diagnosis:** reproduced outside the app with PowerShell + the same key → RapidAPI's 404 means the _host header_ matched no API. Correct host is `wft-geo-db.p.rapidapi.com` (not `wft-geodb-cities...`).
- **Solution:** fixed host; verified with a direct request before touching app code.
- **Lesson:** when an API fails, reproduce with curl/PowerShell first — isolates "my code" from "their endpoint" in seconds. RapidAPI 404s are host-level, 403s are subscription-level.

### 8.2 Offline-first proven against a real API

- **Result:** airplane-mode cold start → GeoDB fails → feed renders from persisted `cache.trending` with "saved data" chip + offline banner. Photos still render because **expo-image's disk cache** is its own second cache layer.
- **Bonus lesson:** three cache layers now cooperate — RTK Query (memory), cache slice via AppStorage (state), expo-image (image files). Know which layer serves what.

### 8.3 Metro log noise: web SSR renders the app on localhost hits

- **Observation:** health-checking `http://localhost:8081` makes Expo's router-server render the app for _web_ — firing real API calls from Node and spamming SSR stack traces into the Metro log.
- **Lesson:** for debugging device behavior, trust `adb logcat -s ReactNativeJS:*` over the Metro terminal; and don't poll Metro's root URL casually when SSR is enabled (`web.output: static`).

---

## Running Tally — Windows RN Developer Survival Kit

| #   | Rule                                                                                                        | Origin |
| --- | ----------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Check `engines.node` first; manage Node with nvm                                                            | 1.1    |
| 2   | `nvm use` needs an elevated terminal                                                                        | 1.2    |
| 3   | `JAVA_HOME` → Android Studio's `jbr` folder, never "latest Java"                                            | 1.3    |
| 4   | Interactive CLI input: file-redirect through `cmd /c`                                                       | 1.6    |
| 5   | Extract zips with `tar -xf`, not Expand-Archive                                                             | 1.7    |
| 6   | Launch emulator/Metro detached (`Start-Process`)                                                            | 1.8    |
| 7   | Binary output never through PowerShell `>` — use `cmd /c`                                                   | 1.9    |
| 8   | Delete deep node_modules with robocopy mirror                                                               | 2.2    |
| 9   | Verify `.env` is git-ignored before first commit                                                            | 3.1    |
| 10  | Weird emulator state → cold boot (`-no-snapshot-load`)                                                      | 3.2    |
| 11  | Phone can't reach Metro → `--tunnel`; long-term: Private network profile + `REACT_NATIVE_PACKAGER_HOSTNAME` | 3.3    |
| 12  | Expo Go SDK mismatch → matching APK from expo.dev/go                                                        | 3.4    |
