# Roava 🧭

A modern, offline-capable travel companion — discover destinations, plan trips, track flights, check weather, and travel smarter.

Built with **Expo** as a production-quality, frontend-first React Native application. See `docs/plans/2026-07-04-roava-master-plan.md` for the full architecture and phase roadmap.

## Tech Stack

Expo SDK 57 (React Native 0.86, New Architecture) · TypeScript (strict) · Expo Router · NativeWind · Redux Toolkit + RTK Query · MMKV · Reanimated · FlashList

## Machine Setup (Windows)

| Tool                 | Version                         | Notes                                                                         |
| -------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Node                 | 24.x LTS                        | via nvm-windows: `nvm install 24.18.0 && nvm use 24.18.0` (elevated terminal) |
| Android Studio + SDK | platform 36                     | only needed for the emulator and later EAS dev builds                         |
| Emulator             | `Roava_Pixel` (Pixel 7, API 36) | or use a physical phone with the Expo Go app (QR scan)                        |

Environment variables (needed for emulator/dev-build workflows):

```
JAVA_HOME    = C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
PATH        += %ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator
```

## Running the App

```bash
npm install
cp .env.example .env    # fill in API keys (never commit .env)

npm start               # Metro + Expo dev server
# press "a" to open on the Android emulator (auto-installs Expo Go)
# or scan the QR code with the Expo Go app on your phone
```

## Scripts

| Script              | Purpose                                 |
| ------------------- | --------------------------------------- |
| `npm start`         | Expo dev server (press `a` for Android) |
| `npm run android`   | Start + open on Android directly        |
| `npm run lint`      | ESLint (eslint-config-expo)             |
| `npm run typecheck` | `tsc --noEmit`                          |

Commit-time gates (husky): lint-staged (ESLint + Prettier on staged files), full typecheck, and Conventional Commits message format (`feat(scope): subject`).

## Project Structure

```
src/
├── app/              # Expo Router routes ONLY (screens & layouts, no logic)
├── components/ui/    # design-system primitives
├── components/shared/# composed cross-feature components
├── features/         # feature modules (components/hooks/api/types per feature)
├── services/         # API client, interceptors, error mapping
├── repositories/     # data-access interfaces + implementations (live/mock)
├── store/            # Redux Toolkit + RTK Query
├── lib/              # mmkv, secure-store, theme, haptics
├── hooks/            # global hooks
├── mocks/            # isolated mock data
└── types/            # global types
```

Layering rule: screens → features → hooks → RTK Query → repositories → services. Nothing skips a layer.

## Environment Variables

Expo loads `.env` natively. Only `EXPO_PUBLIC_*` prefixed vars reach app code — and they are **compiled into the binary and extractable**. Free, quota-capped API keys only; real secrets (session tokens) live in expo-secure-store at runtime.

## Troubleshooting

- **Stale cache weirdness:** `npx expo start --clear`
- **Doctor:** `npx expo-doctor` diagnoses dependency/config issues
- **Emulator not detected:** start it first (`emulator -avd Roava_Pixel`), check `adb devices`
