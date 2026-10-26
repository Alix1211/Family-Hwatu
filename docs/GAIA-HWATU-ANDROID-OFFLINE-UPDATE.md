# GAIA Hwatu: Android offline / remote update handoff

## Scope and isolation
- Working branch: `gaia-city-hwatu` only.
- Existing Family-Hwatu app, branch, package ID and user data must remain untouched.
- GAIA Hwatu is an independent install with its own Android applicationId.
- Existing web rules and game state must not be changed during the packaging work.

## Confirmed branch changes
- Web entry page and PWA manifest renamed to 가이아 화투.
- Six opponent display names changed to 나래, 다희, 미정, 서린, 유하, 윤경.
- Voice-actor label for player changed to 케인; existing user-supplied display names may still take precedence.

## Pending asset integration
- Local preparation includes six portraits and 99 *provisionally segmented* MP3 clips.
- Audio clips are NOT yet verified against the original 99-line script; do not assert correct event mapping.
- Portraits and audio binaries are NOT yet uploaded or wired into the app.
- Existing audio actor identifiers are retained to avoid breaking the current game until event mapping is validated.

## Android design
1. Package the production web app inside an Android WebView container (e.g. Capacitor) with all JS/CSS/cards/AI/assets bundled locally; never depend on an online page to play.
2. Assign a unique applicationId to GAIA Hwatu, independent of Family-Hwatu. Preserve the same ID for future upgrades.
3. Store game saves in persistent app-private storage; migrate carefully and back up before updating content.
4. At launch, use bundled content by default. When online, optionally fetch a small HTTPS release manifest from a trusted project release endpoint. Failure/offline must not block launch.
5. Content updates must be versioned, hash-verified, installed atomically, and rollback-safe. Do not download executable native code or change native capabilities via a content update. Use a new signed APK for native changes.
6. Prompt the player before applying updates. Do not claim unattended APK installation: Android requires an appropriate user-approved install flow or managed distribution.
7. Use release signing with a durable protected keystore. Debug APK is for testing only.
8. Test airplane-mode cold launch, AI match, voice, images, saves, app restart, update rollback, and reinstall/upgrade preserving data.

## Remaining implementation
- Verify 99 audio segments and map event identifiers to exact clip IDs.
- Add six portrait images and UI binding.
- Audit current web app for server dependencies (login, profile, match APIs); remove/replace these only in GAIA variant to make it truly offline.
- Implement Android project, release manifest check, verified content updater, signed release workflow.
- Build and install-test on an Android device.
- No APK build or deployment has yet been performed.
