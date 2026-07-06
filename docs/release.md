# Release build recipe

The `android/` folder is **generated** (git-ignored; `npx expo prebuild` rebuilds
it), so release wiring lives here + in git-ignored `keys/`.

## One-time (done 2026-07-06)

- `keys/roava-release.keystore` — RSA 2048, alias `roava`, 10 000-day validity
  (generated with `keytool`; passwords in `keys/keystore.properties`).
- `keys/keystore.properties` — read by the Gradle block below. **Both files are
  git-ignored; back them up privately. Losing the keystore = losing the app
  identity.**

## After every `expo prebuild --clean`

Re-apply the signing block in `android/app/build.gradle` (inside `android { }`):

```groovy
def keystoreProps = new Properties()
def keystorePropsFile = rootProject.file('../keys/keystore.properties')
if (keystorePropsFile.exists()) {
    keystorePropsFile.withInputStream { keystoreProps.load(it) }
}
// in signingConfigs { } — alongside the debug entry:
if (keystorePropsFile.exists()) {
    release {
        storeFile file(keystoreProps['storeFile'])
        storePassword keystoreProps['storePassword']
        keyAlias keystoreProps['keyAlias']
        keyPassword keystoreProps['keyPassword']
    }
}
// in buildTypes.release — replace `signingConfig signingConfigs.debug`:
signingConfig keystorePropsFile.exists() ? signingConfigs.release : signingConfigs.debug
```

The fallback keeps `assembleRelease` working (debug-signed) on clones without
the keys.

## Building (deferred to the consolidated verification pass — RAM)

```powershell
cd android
.\gradlew assembleRelease            # APK: android/app/build/outputs/apk/release/
.\gradlew assembleRelease "-PreactNativeArchitectures=arm64-v8a"  # phone-only, faster
```

## What production builds change

- `babel.config.js` strips `console.*` except `error`/`warn`.
- JS dev flags off, Hermes bytecode, embedded bundle (no Metro — the app is
  finally verifiable fully offline, closing the JOURNEY 13.1 harness limit).
- Proguard/resource-shrink stay OFF (RN defaults) — enable only in a phase
  with device verification.
