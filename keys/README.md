# keys/

Release-signing material. **Nothing here except this README is committed** —
`.gitignore` excludes `*.keystore` and `keys/keystore.properties`.

- `roava-release.keystore` — the release signing key (alias `roava`). Losing it
  means losing the ability to update an installed app. Back it up privately.
- `keystore.properties` — store/key passwords + path, read by
  `android/app/build.gradle` at build time.

The `android/` folder is generated (git-ignored, rebuilt by `npx expo
prebuild`) — after a `--clean` prebuild, re-apply the signing wiring with the
recipe in `docs/release.md`.
