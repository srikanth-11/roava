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

## Chapter 9 — Phase 6: Search (2026-07-05)

### 9.1 Red screen: "Unable to resolve ./getKeyboardAnimationConfigs"

- **Problem:** after installing `@gorhom/bottom-sheet`, Metro's red screen claimed a file inside the package didn't exist — but it was right there on disk.
- **Diagnosis:** Metro was running when the package was installed; its file-map snapshot predated the install. "None of these files exist" from Metro often means _stale file map_, not missing files.
- **Solution:** restart Metro with `--clear`.
- **Lesson:** installing dependencies while Metro runs → restart Metro. Check the disk before believing "file doesn't exist."

### 9.2 Tab screens keep their state (feature and footgun)

- **Observation:** returning to the Search tab, the input still held the previous text and filter — React Navigation keeps tab screens mounted. Typed text appended to old text during automated testing ("Parispar").
- **Lesson:** tab state persistence is usually desired UX (search survives tab hops), but design for it deliberately — and remember it when writing UI automation.

### 9.3 Permanent LAN fix applied (closes 3.3's backlog item)

- **Context:** executed the permanent fix documented in 3.3 so the phone can reach Metro over LAN instead of `--tunnel`.
- **Applied & verified (2026-07-05):**
  1. Wi-Fi profile confirmed **Private** (`Get-NetConnectionProfile`). The node.exe **Block** firewall rules exist only on the Public profile; Private has "Node.js JavaScript Runtime" Allow rules.
  2. `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3` set as a **user-level** env var (`[Environment]::SetEnvironmentVariable("REACT_NATIVE_PACKAGER_HOSTNAME","192.168.1.3","User")`) — matches the Wi-Fi adapter's DHCP IP.
  3. End-to-end proof: a test Metro on port 8082 served a manifest with `hostUri: 192.168.1.3:8082` and all bundle/asset URLs on the real Wi-Fi IP (previously advertised the WSL adapter `172.27.160.1`).
- **Caveats:**
  - User env vars only reach **new** processes — restart the terminal (and Metro) before `npx expo start`; an already-running Metro keeps advertising the old IP.
  - The IP is DHCP-assigned. If the router hands out a different address later, the var goes stale — update it, or reserve `192.168.1.3` for this PC in the router's DHCP settings.
  - Residual risk: the Private Allow rules name `C:\Program Files\nodejs\node.exe`, but node actually runs from the resolved nvm path (`%APPDATA%\nvm\v24.18.0\node.exe`) — firewall rules match resolved paths, so they may not apply. If the phone still times out in LAN mode, add a port-scoped rule from an **elevated** PowerShell: `New-NetFirewallRule -DisplayName "Expo Metro (TCP 8081)" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -Profile Private`.
- **Bonus finding:** `C:\Program Files\nodejs` now symlinks to `%APPDATA%\nvm\v24.18.0` and plain `node --version` → 24.18.0 — the elevated `nvm use` happened at some point, so 1.2's per-session PATH workaround is obsolete.
- **Lesson:** environment changes (network profile, env vars, firewall) only bind at process start — restart the process chain to pick them up. And when symlinks are involved, port-scoped firewall rules beat program-path rules.

### 9.4 "Failed to download remote update" — again (the 9.3 caveat bites)

- **Problem:** right after 9.3, the phone still failed with the classic 3.3 error.
- **Diagnosis (evidence before theory):** port 8081 was still owned by the _same_ node PID started **before** the env var existed — and its manifest advertised `hostUri: 127.0.0.1:8081` (**localhost mode**, from the emulator's `expo run:android`/adb-reverse workflow, cf. 6.3). The phone was literally being told to download the app from itself. `adb devices` confirmed only the emulator attached — adb reverse makes localhost work there, masking the problem.
- **Solution:** kill the stale Metro; relaunch plain `npx expo start` from a shell where `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.3` is set → manifest re-queried, now `hostUri: 192.168.1.3:8081`. (Emulator still fine in LAN mode — it reaches the host's LAN IP via NAT, plus adb reverse remains.)
- **Debug technique worth keeping:** ask the dev server what it's handing out — `Invoke-WebRequest http://localhost:8081 -Headers @{"expo-platform"="android"; "Accept"="application/expo+json"}` and read `hostUri` from the manifest. One request tells you exactly what URL every client will be given (in PS 5.1 decode `$r.Content` with `[Text.Encoding]::UTF8.GetString`).
- **Lesson:** "env var set" ≠ "env var active." A server keeps the environment it was born with — check the _process start time_ against when you changed the environment. And a Metro that works on the emulator proves nothing about the phone: adb reverse and LAN are different transports.

### 9.5 Phone scan → "Expo Go is closing" — the dev build never made it to the phone

- **Problem:** with 9.4 fixed (QR advertising the right LAN IP), scanning on the phone made Expo Go flash open and immediately close.
- **Diagnosis:** with `expo-dev-client` installed, `expo start` QRs encode `exp+roava://expo-development-client/?url=...`. Expo Go doesn't own that scheme — its scanner fires the intent and exits, and **no app on the phone could answer it**: `com.kasir.roava` was only ever installed on the _emulator_ (Phase 4). Expo Go couldn't run the project anyway — google-signin and nitro-modules are compiled-in native code since Phase 4. Bonus trap: pulling the emulator's installed APK as a shortcut failed — it contains **only x86_64** libs (`run:android` builds just the target device's ABI), useless on an arm64 phone.
- **Solution:** one-time arm64 build, no cable needed: `cd android; .\gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a` (11m 35s — NDK/Gradle caches reused), then served `app-debug.apk` over LAN with a tiny node HTTP server for phone-browser download + sideload (same unknown-sources flow as 3.4).
- **Lesson:** a dev-client QR is only useful if the dev client is installed _on that device_ — and per-device ABI builds mean "it runs on the emulator" ≠ "I have an APK for my phone." When handing builds around, check the `lib/` ABIs inside the APK before assuming portability.

---

## Chapter 10 — Phase 7: Destination Details (2026-07-05, evening)

### 10.1 GeoDB timezones aren't IANA — `Europe__Paris`

- **Problem (caught pre-code):** the 8.1 discipline — test the endpoint before writing the mapper — showed GeoDB's city detail `timezone` field uses `__` separators (`Europe__Paris`). `Intl.DateTimeFormat` would have thrown "invalid time zone" at runtime.
- **Solution:** normalize in the repository mapper: `city.timezone.replace(/__/g, '/')`.
- **Lesson:** test the exact fields you're about to consume, not just that the endpoint answers. Formats lie in the details.

### 10.2 Overpass 406s anonymous clients

- **Problem (caught pre-code):** the first Overpass probe returned `406 Not Acceptable`.
- **Diagnosis:** the shared public instance rejects requests without an identifying User-Agent.
- **Solution:** `User-Agent: Roava/0.1 (Expo learning project)` on the axios client.
- **Lesson:** keyless shared APIs enforce citizenship instead of quotas — identify yourself.

### 10.3 Overpass hides fatal errors inside HTTP 200

- **Problem:** Paris rendered the honest-looking "No sights mapped yet" empty state — but a manual query had found 8 POIs there hours earlier.
- **Diagnosis:** replicated the app's _exact_ query in PowerShell: HTTP **200**, `elements: []`, and the truth buried in a field — `remark: "runtime error: Query timed out in 'query' at line 1 after 14 seconds."` The `leisure=park` union leg scans too much geometry in hyper-dense OSM areas: Paris blew the 10 s budget while Mumbai passed. A city-dependent silent failure wearing an empty state as a disguise.
- **Solution:** (1) treat a `remark` containing "error" as a thrown failure → the section shows ErrorState + retry, never a false "nothing here"; (2) drop the park selectors — tourism-only completes in ~2 s everywhere tested; parks return with Phase 9's maps.
- **Lesson:** "200 OK" is a transport statement, not a truth statement. Some APIs report failure in-band — find and check the body's own error channel. And in a union query, one heavy leg times out the whole thing.

### 10.4 Second persisted slice broke TypeScript inference

- **Problem:** adding `favorites` to the persistence WHITELIST made `result[slice] = JSON.parse(raw)` fail: TS demanded the value satisfy `CacheState & FavoritesState` (both at once).
- **Diagnosis:** with a union-typed loop variable, TS can't correlate WHICH key goes with WHICH value type — so it intersects them.
- **Solution:** a generic helper, `loadSlice<K extends PersistedSlice>(slice: K, …)`, re-ties key to value per call.
- **Lesson:** loop variables are unions; generics restore the key↔value correlation. This appears the moment any keyed registry grows past one entry.

### 10.5 The verification environment fought back (RAM starvation)

- **Symptoms, stacked:** dev client "Failed to download remote update"; emulator Chrome spinning forever; two emulator launches dying silently; System-UI ANRs; `adb install` hanging; package service "Broken pipe"; a cold boot that came up **without the app installed**.
- **Root cause:** **1.3 GB free of 15.8 GB host RAM.** Metro had bloated to 2.6 GB over hours of bundling; qemu holds ~2 GB. Every "bug" above was this one resource squeeze wearing different masks.
- **Solution:** recycle Metro (fresh instance is ~10× smaller), cold-boot the emulator, reinstall from the x86_64 APK pulled earlier (9.5's "useless for the phone" pull became the emulator's recovery installer).
- **Lessons:** when _everything_ flakes at once, check host resources before debugging any single failure. Long-lived Metro processes bloat — recycle between sessions. Keep a pulled APK as reinstall insurance. And `adb shell pm path android` is the real "package manager ready" probe — `sys.boot_completed=1` lies during late boot.

### 10.6 Verified behaviors worth recording

- **Deep-link anchor works:** cold `roava://destination/144571` → Paris; back → **Home**, not exit. Bonus live proof: Home's trending query fired _beneath_ Paris simultaneously, tripped GeoDB's 1 req/s (429), and `getWithRetry`'s backoff recovered it on the retry.
- **Offline audit:** uncached city in airplane mode → the one designed full-screen ErrorState ("You're offline") with retry; a cached city renders **completely** — expo-image disk cache (hero), RTK cache (weather, POIs), client computation (local time), and no-fetch logic (INR same-as-home) all cooperating.
- **Favorites survive force-stop** (AppStorage rehydration through the persistence whitelist).
- **Share sheet** carries `Check out Mumbai, India on Roava → roava://destination/56521`.

---

## Chapter 11 — Phase 8: Weather (2026-07-05, night)

### 11.1 The free tier has no daily forecast — design around it

- **Problem:** the plan said "hourly/7-day," but OpenWeather's daily endpoint (One Call 3.0) requires a billing-backed subscription; UV likewise.
- **Solution:** `/data/2.5/forecast` (free, 3-hourly × 5 days) aggregated client-side into daily min/max in the destination's timezone — with a truncated last day labeled "so far" instead of pretending to be complete. UV from **Open-Meteo**, a second keyless provider, rather than a credit-card gate.
- **Lesson:** design around what the tier actually serves, not what the docs advertise. A second free provider often beats upgrading the first. And honest partial data ("so far") beats silently wrong aggregates.

### 11.2 React Compiler forbids `Date.now()` in render

- **Problem:** `expo lint` errored "Cannot call impure function during render" — three times in SunArc (sun-position math needs the current time).
- **Solution:** snapshot the clock once via lazy state: `const [now] = useState(() => Date.now())` — initializers may be impure; render must not be. Same family as JOURNEY 4.3's `.get()/.set()` rule; LocalTimeCard had already established the pattern.
- **Lesson:** under the React Compiler, render purity is a compile-time contract. Time-dependent UI takes a snapshot (or a ticking state), never a live read.

### 11.3 The screen that rendered perfectly but didn't scroll

- **Problem:** the weather screen looked flawless — and the AQI/UV tiles below the fold were unreachable. A swipe did nothing; two identical screenshots proved it.
- **Diagnosis:** `Screen` defaults `scroll={false}`; the content simply overflowed a static View.
- **Solution:** `<Screen scroll>`.
- **Lesson:** "renders correctly" and "is usable" are different claims — only _driving_ the UI (scroll, tap, navigate) catches the second kind. No typecheck can see a missing scroll container.

### 11.4 Nesting a route under `[id]` (and a Windows git trap)

- **Problem:** `destination/[id].tsx` can't have children; the weather route needs `destination/[id]/weather`.
- **Solution:** restructure to `destination/[id]/index.tsx` + `weather.tsx` — URLs unchanged. Windows trap: `git mv "src/app/destination/[id].tsx" …` fails because git treats `[id]` as a pathspec wildcard — `git --literal-pathspecs mv` is the escape. New route files → Metro `--clear` (9.1 rule held).
- **Lesson:** file→directory route conversion is free in expo-router; brackets in paths need `--literal-pathspecs` for every git file operation.

### 11.5 Param-carrying routes are free deep-link targets

- **Insight:** the weather screen takes coords/tz/name as query params (to avoid refetching the city). That made `roava://destination/56521/weather?lat=…&lon=…` a working deep link for free — which is exactly how the offline test forced the repository path (different RTK cache key, same 3-decimal disk cache key) and proved the whole screen serves from AppStorage in airplane mode.
- **Lesson:** designing screens to ride on params instead of hidden state makes them deep-linkable and independently testable as a side effect.

---

## Chapter 12 — Phase 9: Maps & Nearby (2026-07-05, late night)

### 12.1 MMKV finally registers — JOURNEY 7.2 closed

- **Problem (inherited):** react-native-mmkv v4 (Nitro architecture) compiled but never registered under SDK 57; AsyncStorage had carried the app since Phase 4.
- **Solution:** swap to `react-native-mmkv@3` (TurboModule architecture) riding the Phase 9 rebuild. `storage.ts` needed ZERO code changes — the `MmkvLike` interface matched v3's API exactly. A one-time boot migration copies `roava.*` keys from AsyncStorage so nothing resets. Verified: zero "[storage] MMKV unavailable" warnings post-rebuild.
- **Lesson:** when a native lib fails, check which _architecture generation_ it targets, not just the version. And an interface + fallback turns an engine swap into a boot-time detail — the Phase 3 investment paying out one more time.

### 12.2 Google Maps needs a credit card — the OSM stack didn't

- **Problem:** the plan assumed react-native-maps, which on Android means the Google Maps SDK — and Google Cloud requires billing details even at $0.
- **Solution:** `@maplibre/maplibre-react-native` (open-source Mapbox fork) + **OpenFreeMap** hosted vector tiles: zero keys, zero cards, zero signup (styles probed: liberty/bright/positron/dark/fiord all live). Clustering is built into the engine. Bonus symmetry: the POIs come from OSM via Overpass and now render on OSM tiles.
- **Lesson:** interrogate the "standard" choice's account requirements before adopting it. The open ecosystem often has the better-integrated answer.

### 12.3 MapLibre v11 is a redesigned API — installed types are the truth

- **Problem:** the first map screen draft used the API every tutorial shows (`MapView`, `ShapeSource`, `CircleLayer`, camelCase styles) — 10 type errors.
- **Diagnosis:** v11 renamed the world: `Map`, `GeoJSONSource` (`data`, not `shape`), one unified `<Layer type="circle">` taking spec-style `paint`/`layout` (kebab-case), `initialViewState` on Camera, and a proper `getClusterExpansionZoom()` on the source ref.
- **Solution:** read the package's own `.d.ts` files and rewrite against them; the typechecker became the API recon tool.
- **Lesson:** for fast-moving native libs, `node_modules/**/*.d.ts` outranks every tutorial, blog, and memory. Typecheck a thin slice early — before writing 200 lines against a ghost API.

### 12.4 Typed routes regenerate on the dev server's schedule

- **Problem:** `router.push('/destination/[id]/map')` was a type error — the route existed on disk but not in the generated union.
- **Diagnosis:** expo-router's route types (`.expo/types/router.d.ts`) regenerate when the dev server processes the route tree — a route added while Metro runs may not appear until a restart (which the new-route-file rule required anyway).
- **Lesson:** a route-type error on a file you just created means "regenerate," not "rename." Generated artifacts have their own refresh cycles.

### 12.5 Patterns that held under fire

- **Cluster tap:** `getClusterExpansionZoom(cluster_id)` → `easeTo` — the engine tells you the exact zoom where the cluster unpacks (verified: Mumbai's "2" split cleanly).
- **Permission state:** `pm grant` via adb reflects on the next screen mount — the denial banner vanished without a reinstall. Denial-as-first-class UX verified both ways.
- **Paris at map scale:** tourism-only Overpass at 6 km/200 results stayed inside the 10-second budget even on the densest OSM city — the 10.3 park exclusion keeps paying rent. ~200 markers clustered smoothly (43/12/10/9-size bubbles).
- **Param-carried routes (11.5):** the map screen deep-linked cold (Mumbai) and warm (Paris) with zero extra work.

---

## Chapter 13 — Phase 10: Currency (2026-07-05, night)

### 13.1 The offline showcase, proven in its strongest form

- **The claim:** a traveler with no connection still gets a conversion, plus the truth about its age.
- **The proof, decomposed:**
  1. **Zero-network disk serving:** on a fresh cold boot (network AVAILABLE), the converter rendered "rates from 17 min ago" with **zero er-api requests in the log** — the repository's 12 h TTL served MMKV disk cache and never touched the wire. Stronger than an offline test: the network was there and deliberately unused.
  2. **Airplane conversion:** with radios off, tapping a saved pair converted from the cached table under the OfflineBanner — "rates from 18 min ago."
  3. **Persistence:** last pair and saved pairs rehydrated across force-stop (currencySlice through the whitelist).
- **Honest limitation:** a true _cold boot_ in airplane mode is impossible in the dev harness — the dev client fetches its bundle from Metro, and the manifest's bundle URL rides the LAN IP. Production builds embed the bundle, so the cold path there reduces to (1)+(3), both proven.
- **Lesson:** "works offline" decomposes into cache persistence, cache serving, and staleness honesty — each provable separately even when the harness can't fake the whole journey.

### 13.2 Whole-table caching beats per-pair caching

- **Insight:** er-api returns ~160 quotes per base in one response. Caching the TABLE (per base) instead of the PAIR means one fetch makes every quote for that base available offline — picker changes and swaps are instant and free.
- **Cost check:** a table is ~4 KB JSON — MMKV shrugs.
- **Lesson:** cache at the API's natural response granularity, not the UI's consumption granularity.

### 13.3 One-boot native-module registration glitch (observed, resolved)

- **Problem:** after many Fast Refreshes + an airplane-mode ANR recovery, one app boot threw `TurboModuleRegistry.getEnforcing: 'MLRNCameraModule' could not be found` at the map route's import — with expo-router warning "missing the required default export" as the downstream symptom (the throwing module exports nothing).
- **Diagnosis:** the binary was correct (install timestamp = the Phase 9 build; maps had verified on it). A fresh process registered the module fine; the glitch never recurred.
- **Lesson:** a "module not found" that contradicts a verified binary is a boot-state problem, not a build problem — restart the process before rebuilding anything. And a router's "missing default export" warning can mean "the module threw during import," not "you forgot to export."

### 13.4 Emulator IME toolbar eats taps

- **Problem:** the first tap on a picker row did nothing — the emulator's on-screen IME toolbar overlaid the list edge and consumed the touch.
- **Lesson (automation):** after `adb shell input text`, the IME may leave chrome on screen; tap once to dismiss or aim clear of the keyboard's bounding strip. Same family as 9.2's "tab state persists" automation gotcha.

---

## Chapter 14 — Phase 11: Flights (2026-07-05, late night)

### 14.1 Credits are the constraint, not the data rate

- **Recon finding:** OpenSky's anonymous tier bills by query AREA — a global call costs 4 credits even when `icao24`-filtered down to 166 bytes (measured via `X-Rate-Limit-Remaining`). The ~400/day budget, not the 10 s data resolution, dictates the design.
- **Solution:** searches share one 30 s in-memory snapshot (4 credits buys every keystroke); tracking polls pass a ±1.5° bbox around the last fix (1 credit) at a 30 s interval — an hour of tracking ≈ 120 credits.
- **Lesson:** read the rate-limit headers during recon and do the arithmetic BEFORE picking a polling interval. The plan said 15 s; the measured cost said 30.

### 14.2 A moving value in an RTK query arg = a render loop

- **Problem:** red screen "Too many re-renders" on the second poll. The tracked aircraft's position fed the bbox, the bbox lived in React state, and the state fed the RTK query arg — so every fix changed the cache key, churned the subscription, and looped render-phase adjustments.
- **Solution:** the query arg is now STABLE (icao24 + the seed position from search params); the repository keeps a module-level `Map<icao24, lastPos>` and applies the moving bbox internally at fetch time. React state holds only what the UI renders.
- **Lesson:** RTK Query args are cache identities — never put a value in one that changes as a RESULT of the query. State that exists to steer the next fetch belongs in the data layer, not in React.

### 14.3 Memory cache vs disk cache is a semantics decision

- **Design note, proven out:** flight positions get 30 s in MEMORY; currency tables get 12 h on DISK. Persisting live positions would serve confidently wrong data offline — worse than nothing. Cache duration AND medium follow the data's freshness semantics, not a house habit.

### 14.4 Verified behaviors worth recording

- **Search:** 25 live UAL flights from one snapshot, "positions 0s old", callsign trailing-space trim earning its keep.
- **Tracking:** UAL2137 visibly crossed Wyoming between two 30 s polls (Casper → Riverton, ~50 km at 784 km/h heading 278° — the physics check out); "Cruising" chip derived from 0.0 m/s vertical rate; heading arrow icon rotated to match.
- **Focus gating:** zero OpenSky requests in 65 s after leaving the tracker — polling provably stops off-screen.
- **Honesty:** a bogus callsign gets "Not visible to the network" with the ADS-B coverage explanation, not an error.

---

## Chapter 15 — Phase 12: Trip Planner (2026-07-06, small hours)

### 15.1 The crown's lifecycle, verified offline end to end

- **The run:** airplane mode ON → created "Kyoto in autumn" (RHF+Zod form) → three itinerary items with times → drag-reordered Day 1 → ₹8,000 Stay + ₹1,200 Food (₹9,200 total with category breakdown) → packed 1 of 2 items → autosaved a note → **force-stopped the process → relaunched → every byte intact** in the drag-reordered order.
- **Honest footnote:** the process-death relaunch needed a brief network window for the DEV CLIENT's bundle fetch (the 13.1 harness limitation); every data operation and every read ran in airplane mode. Production embeds the bundle.
- **Lesson:** local-first isn't a cache strategy — it's an architecture. When the repository IS the source of truth, offline stops being a special case.

### 15.2 Mutations over a local repository — invalidation without network noise

- **Insight:** the app's first RTK mutations (`createTrip`/`deleteTrip`/`updateTrip`) invalidate `Trips` tags exactly like a remote API would — screens re-render from the repository with zero manual refetch plumbing. Teaching invalidation on local data first removed all the network confounders.
- **Boilerplate control:** nine near-identical write endpoints collapsed into one `updateTrip` mutation taking a typed `TripCommand` union; the repository keeps explicit, testable methods.

### 15.3 Data the user can't re-download gets seatbelts

- Versioned document (`schemaVersion` + stepwise `migrate()` fallthrough seam, ready before it's needed) and **corruption recovery that stashes unparseable bytes under a recovery key instead of discarding them**. Losing the handle to data is recoverable; overwriting it is not. (Migration seam is passthrough-only at v1 — its first real test arrives with schema v2, by design.)

### 15.4 Emulator-week wisdom, condensed

- Tonight's tooling battles in one line each: a dev-client cold boot cannot happen in airplane mode (bundle via Metro — decompose the offline claim, 13.1); **adb reverse chokes on multi-MB bundle streams** (tiny manifest fine, 8 MB bundle dies mid-stream → LAN mode for the emulator, tunnel only for small payloads); a Metro that answers `/status` can still be dead at the bundler — **health-check the bundle endpoint, not the ping** (`curl .../entry.bundle` before blaming anything downstream); `input draganddrop` drives long-press drag lists from adb.

---

## Chapter 16 — Phase 13: Favorites & Offline Hardening (2026-07-06)

### 16.1 Undo restores the exact item, not a re-creation

- **Problem:** swipe-to-remove + undo looks trivial — remove, then re-add on undo. But `favoriteToggled` mints a fresh `savedAt`, so an undone favorite would jump to the top of history with a lying "just now" label.
- **Solution:** a dedicated `favoriteRestored(item)` reducer re-inserts the EXACT removed item, position recomputed from its original `savedAt`. Verified with paired mid-window/post-undo screenshots: "saved 6 hours ago" survived the round trip. The expiry path (bar times out → removal finalizes) verified separately.
- **Lesson:** undo is state restoration, not action repetition. If replaying the forward action can't reproduce the old state exactly, the slice needs a restore-shaped door.

### 16.2 Offline snapshots at the repository seam — one fix, every screen

- The last-known-good `DestinationDetail` cache lives INSIDE `getDestinationById` (write-on-success, serve-on-failure with `isStale: true`), so RTK, screens, and future callers all inherit it without knowing it exists. The detail screen adds one line: a "saved data" badge when `isStale`.
- Verified: cold store + airplane → Favorites → Mumbai renders full detail from snapshot, badge shown, cards degrading independently (local time computes, currency serves its own disk cache, POIs honestly fail with retry).
- **Lesson:** hardening at the repository layer multiplies; hardening in a screen is a one-off.

### 16.3 The audit that closed old loops

- Nine surfaces walked in airplane mode, screenshot each. Two loops from past phases closed themselves: the **weather stale badge** ("saved forecast · updated 5 hours ago · Refresh") finally rendered live — deferred since Phase 8 for want of an expired TTL; and **MapLibre's ambient tile cache** turned out to serve previously-viewed cities fully offline.
- One dishonest state found and fixed: the map's floating header (back + "Sights failed — retry") anchored at `top-0 pt-12` — UNDER the absolute-overlay OfflineBanner (z-50, rendered after the Stack), hiding the retry affordance exactly when it mattered. Fix: banner-aware `pt-28` when `useOnline()` is false.
- **Lesson:** overlays that appear conditionally create layouts that only exist in that condition — audit screens IN the condition, not just in the happy path.

### 16.4 The fix that "didn't work" — stale HMR bundle

- **Problem:** the map-header fix showed no effect across a Fast Refresh AND a full screen remount. Two more "fix attempts" beckoned.
- **Diagnosis:** the day's airplane toggles had killed the HMR socket; the app was running a bundle predating BOTH edits. Remounting re-runs the same stale JS. A force-stop + fresh bundle load made the original fix work, unchanged.
- **Lesson:** when a UI fix has no effect at all (not wrong — absent), verify the code is actually running before touching it again. On a dev client, connectivity games kill HMR silently.

---

## Chapter 17 — Phase 14: Profile & Settings (2026-07-06)

### 17.1 Process shift: verification batched to the end

- The machine was RAM-starved again, so the emulator and Metro are OFF: from this phase until the build finishes, per-phase gates are typecheck + lint only, and every phase plan carries an explicit **"deferred runtime verification" checklist** for one consolidated device pass at the end.
- **Lesson:** when the verification loop gets expensive, don't silently skip it — write down exactly what remains unproven so the debt is visible and collectable.

### 17.2 A constant becomes a setting — the migration pattern

- `HOME_CURRENCY` had three consumers (detail card, budget, converter default). The migration: rename the constant to `DEFAULT_HOME_CURRENCY` (now referenced ONLY by the slice's initial state) so the compiler finds every stale consumer as a build error, then point them all at `selectHomeCurrency`.
- Budget totals stopped assuming one currency: entries always stored their currency (Phase 12 schema), so totals now group by it — largest bucket is the headline number, others append as captions. Old data stays truthful after the setting changes.
- **Lesson:** when a constant becomes a setting, make the old name unresolvable. Renaming forces the compiler to find every consumer; keeping a deprecated alias guarantees a stale read survives.

### 17.3 The React Compiler effect rule, third encounter

- `setBuckets` inside a `useCallback` invoked from `useEffect` → "setState synchronously within an effect." Same family as Phase 8 (Date.now in render) and Phase 11 (sync setState in effect). Fix: inline the storage read with an explicit `.then` + `live` cancellation flag so the async boundary is visible to the compiler.
- **Lesson:** the compiler can't see through your own hooks — an async `useCallback` reads as synchronous at the call site. Make the asynchrony syntactic (`.then`) where the lint needs to see it.

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
| 13  | Everything flaking at once → check free RAM first; recycle long-lived Metro                                 | 10.5   |
| 14  | External API "200 OK" ≠ success — check the body's own error channel (Overpass `remark`)                    | 10.3   |
| 15  | A fix with NO effect (not wrong — absent) → verify the running bundle first; airplane toggles kill HMR      | 16.4   |
