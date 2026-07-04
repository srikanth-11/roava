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
