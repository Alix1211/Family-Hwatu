# GAIA City Hwatu Android test APK

This GAIA-only Android packaging project follows `docs/GAIA-HWATU-ANDROID-OFFLINE-UPDATE.md`.
It is separate from the original Family-Hwatu Android native-app plan: GAIA runs a locally bundled WebView with an offline account and game settlement store. It does **not** connect to or modify the Family-Hwatu server or user data.

## Build

Prerequisites: Node.js, JDK 17, Android SDK platform/build-tools 35 and Gradle 8.13.

From repository root:

1. `npm install`
2. `VITE_GAIA_ANDROID=1 npm run build`
3. Copy the contents of `services/api/wwwroot/` to `apps/android/app/src/main/assets/`.
4. Run `gradle -p apps/android assembleDebug` (or import `apps/android` into Android Studio).

The installable test APK is `apps/android/app/build/outputs/apk/debug/app-debug.apk`.

Application ID: `com.gaiacity.hwatu` (different from Family-Hwatu). The first test build uses versionCode `1`. Preserve the application ID for upgrades.

The test APK is signed with a debug key. A stable release key and device-level validation are **not complete**; do not distribute it as a production release or rely on a subsequent debug build being upgrade-compatible.

## Offline behavior and limitations

- Card art, AI rules and current committed sound assets are bundled inside the APK.
- GAIA-local identity (`케인`), virtual balances and game data are persisted in Android WebView private storage.
- Backend login, remote profile upload, synced family accounts and cloud multiplayer are not included.
- The six portraits and 99 newly segmented voice clips from the handoff are **not present in this branch**, so this APK uses the existing game assets.
- Remote content updating and automatic rollback have not yet been implemented.
- Saving across app restarts is coded and covered by API tests, but a physical-device cold launch, match, audio and upgrade test are still required.
