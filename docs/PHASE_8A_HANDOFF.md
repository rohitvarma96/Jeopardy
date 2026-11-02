# Phase 8A - Engineering audit and stabilisation

Date: 2026-10-31. **Phase 8A only; physical-device acceptance remains NOT TESTED.**
The MVP is not fully platform-verified or release-ready. No backend, multiplayer,
payments, new artwork, gameplay-rule changes or screen redesign were introduced.

## Baseline and audit scope

Read all four source DOCX documents, including PH-11/PH-12, the Phase 1-7
handoffs, [gameplay decisions](GAMEPLAY_DECISIONS.md),
[art decisions](ART_DIRECTION.md), [asset inventory](ASSET_MANIFEST.md) and
[previous platform report](PLATFORM_VERIFICATION.md). No standalone Phase 0
handoff exists in this workspace: its foundation evidence is described by
Phase 1 and the previous platform report. No missing handoff was invented.

The previous report's 28 passing suites / 510 tests, typecheck/lint, Android
QA APK and limited emulator observations are historical evidence, not rerun
results. Its iOS exports/Jest checks are not native iOS verification.

Traced launch -> Arena -> offline mode -> cancellable mock search -> ban/pick
draft -> owned fighter -> three owned boosters -> battle -> standard questions,
simultaneous resolution, boosters, alternating clashes and sudden death ->
finishing/outcome -> Results -> capsule -> Vault/history -> replay.

- Phase 4's pure timestamped engine remains authoritative. Reviewed question
  selection/evaluation, public view, fixed AI plans, attack ordering, shield/
  passive/cap interactions, round bonuses, retries, timeout and termination.
  The UI never receives private opponent answers/clash questions or early
  correct indices; AI plans do not read player answers.
- Presentation consumes published resolutions only. Cosmetic work cannot
  dispatch gameplay, delay answers/Continue or control deadlines. Effects
  ignore pointer input, cancel on cleanup and respect OS OR app reduced motion.
- Reviewed deterministic XP/coins, exact level thresholds, capsules, all
  duplicate shard amounts, inventory, ownership, serialized writes, version
  migration, stable IDs, receipts and unsaved-result protection.
- Reviewed all routes, shared safe areas, iOS keyboard avoidance, Android Back,
  disabled battle swipe-back, assets/fonts, lifecycle, announcements, appearance
  and native dependency alignment. Demo missions/rank, locked collection choices,
  future modes and silent future-audio preferences are intentionally disclosed.

## Issues discovered and fixes

No critical product defect was found. Two high-priority integration races and
two small reliability defects were fixed.

| Priority | Defect | Fix and evidence |
| --- | --- | --- |
| High | Leaving loadout during an asynchronous save could start the cancelled battle and force navigation back into it. | Invalidate the save generation on blur/unmount; check it before starting combat. Back and Leave match regression cases pass. |
| High | Leaving fighter selection during its save could confirm against a cleared draft, rejecting the press handler or advancing a stale screen. | The same focus-scoped generation guard prevents stale confirmation/navigation. Back and Leave match regression cases pass. |
| Medium | An unknown Results match ID with an unrelated finished battle offered an ineffective reward retry instead of recovery. | Only the requested/live matching battle gets a retry; unknown IDs display a not-found explanation and Arena recovery. Regression passes. |
| Medium | Animated HP initialized at zero after mounting/remounting, temporarily disagreeing with actual HP and repeating the empty-fill observation. | Initialize the shared value at bounded current HP; later damage still animates for 380 ms and labels remain immediate. Regression passes; native visual follow-up recorded below. |

A completed equipment write may still persist after leaving setup; only its
stale navigation/combat continuation is cancelled. Storage is not rolled back.
No damage, timer duration, booster, passive, reward or rarity policy changed.

An additional **QA-build-only** failure demonstrated why compilation is not
runtime verification: the first hoisted-dependency staged bundle omitted Router
routes and crashed with `No routes found`. Adding a watch folder alone did not
resolve it. The native QA build must explicitly use the canonical source root.
This is not a reason to add custom Metro configuration to the normal app.

## Files changed

Modified application files:

- [Fighter selection](../app/battle/fighter-select.tsx)
- [Loadout](../app/battle/loadout.tsx)
- [Results](../app/battle/result.tsx)
- [Progress/health bars](../src/components/ui/ProgressBar.tsx)

Modified existing tests:

- [Pre-battle/integration tests](../tests/pre-battle/journey.test.tsx)
- [Navigation tests](../tests/navigation.test.tsx)
- [Shared UI tests](../tests/components.test.tsx)

Documentation: this handoff, [README](../README.md) and the current-status pointer
in [platform verification](PLATFORM_VERIFICATION.md). QA APK/screenshots below.
No source files deleted; no dependency manifests, source Expo configuration,
engine/rules, persistence schema or image assets changed.

The pending-storage tests use the existing renderer's event-handler lookup to
invoke a press without awaiting its save, then navigate and await completion.
This is test-only: no extra testing framework or production abstraction.

## Automated verification actually performed

| Check | Current Phase 8A result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0 |
| `npm run lint` | PASS, exit 0 |
| `npx expo install --check` | PASS: Dependencies are up to date |
| Affected UI/integration/reward suites, both Jest platform presets | PASS: 10 suites / 106 tests |
| Critical engine/damage/opponent/view/question suites, both presets | PASS: 10 suites / 346 tests |
| Current combined targeted coverage | 20 suites / 452 tests; 226 per platform |
| Remaining unchanged suites | 8 suites / 74 tests from historical baseline; not rerun |
| Updated iOS production export | PASS: 1,612 modules, 27 assets, Hermes output; JS/assets only |
| Expo Go development-server preparation | PASS: local `/status` and iOS manifest; Brain Brawl, SDK 58, Hermes launch asset |

```powershell
npx jest --config jest.platforms.config.js --runInBand --runTestsByPath tests\pre-battle\journey.test.tsx tests\navigation.test.tsx tests\components.test.tsx tests\battle\animation-smoke.test.tsx tests\rewards.test.tsx
npx jest --config jest.platforms.config.js --runInBand --runTestsByPath tests\battle\engine.test.ts tests\battle\damage.test.ts tests\battle\opponent.test.ts tests\battle\view.test.ts tests\battle\questions.test.ts
npm run typecheck
npm run lint
npx expo install --check
```

Eight new cases cover four save-cancellation branches, complete win/loss UI
journeys, unknown-result recovery and initial HP/update behavior. Full journeys
use real routes/stores/AI/engine, with a controlled clock and mocked native
storage/motion: regulation/clash, payout, capsule, Vault, storage reload,
history reopening, idempotency and Play again. They are **not native E2E**.

Early development runs failed due to test nesting, floating-point equality and
pending-handler/renderer timing; these were corrected before the passing runs.
No initial failed run is represented as passing. The historical full baseline
and current targeted counts must not be added together as independent tests.

## Android build and emulator evidence

**Fresh Android build and limited emulator checks PASS. Physical Android NOT TESTED.**

Deliverable: [brain-brawl-phase8a-qa.apk](qa/brain-brawl-phase8a-qa.apk),
54,415,653 bytes, SHA-256:
`7B17F5B1437128AE6DB08C0F4B276B4C470F5E37683C583F58CFBA2ABEE866D2`.
Bundled Hermes bytecode is 3,178,300 bytes; ABIs arm64-v8a/x86_64;
minimum SDK 24, target 36, compile 37, version 1.0.0/code 1, non-debuggable.
Final signing verification passed; the certificate matches the old QA APK.

Final canonical-root Gradle bundle and assembly both exited 0 (1m10s and
1m56s respectively); the Android bundle included 1,606 modules. The earlier
route-less binaries were not delivered. Direct manual bundling plus excluding
the Gradle bundle task was also attempted, but failed Gradle provider validation;
the final build uses the normal dependency graph, not that workaround.

Emulator: disposable `BrainBrawlPhase8A`, Pixel 7 profile, Android 16/API 36.1
system image, x86_64, software SwiftShader, gesture navigation, 480 DPI.
Reference 390x844 / 1170x2532; compact Profile 360x800 / 1080x2400.
No additional cutout, large-font, three-button or physical-device checks.

Actually observed on the final installed APK:

- Cold launch and full setup with Metro stopped and emulator Wi-Fi/mobile data
  disabled; no ADB reverse was used.
- History ban, Sports pick, Arcane/default loadout -> native battle.
- Four visible answer controls and settled 100/100 HP fills; after a clash,
  Results showed 86/100 with a proportionate settled fill and opponent 100/100.
- Hardware Back opened Forfeit; another Back dismissed it. Background for
  15 seconds/resume showed a valid later question/resolution. This is a sanity
  observation, not a measured timer-drift or exact-once native assertion.
- Explicit forfeit -> Results -> reward page stating no capsule -> Vault.
  Forfeit kept XP 240/400, coins 1250 and shards 40; score 0 vs 14, HP 86 vs 100.
- Force-stop/relaunch retained the receipt: compact Profile reopened
  `reward-match-1`, reward remained capsule-free, Play again -> mode -> Back
  returned safely to Arena. No warning/error output in the final current
  process's ReactNativeJS/AndroidRuntime log query (PID 9548).

UIAutomator failed to obtain an idle tree in active battle; that attempt is
NOT a passed accessibility-tree check. Fresh dumps were removed before each
attempt; native live/modal/resume observations use screenshots and ADB inputs.
No fresh native answer/booster activation, full win, natural loss, sudden death,
capsule payout/unlock/duplicate or frame-rate acceptance is claimed. Reuse the
previous report's limited unchanged reward observations, separately.

Visually inspected screenshots, measured PNG dimensions:

| Android emulator capture | Logical / physical size |
| --- | --- |
| [Arena](qa/phase8a-android-arena.png) | 390x844 / 1170x2532 |
| [Battle / settled HP](qa/phase8a-android-battle.png) | 390x844 / 1170x2532 |
| [Back confirmation](qa/phase8a-android-forfeit.png) | 390x844 / 1170x2532 |
| [Resume](qa/phase8a-android-resume.png) | 390x844 / 1170x2532 |
| [Results / settled damaged HP](qa/phase8a-android-result.png) | 390x844 / 1170x2532 |
| [Forfeit reward](qa/phase8a-android-reward.png) | 390x844 / 1170x2532 |
| [Compact Profile after restart](qa/phase8a-android-profile-360x800.png) | 360x800 / 1080x2400 |

These are emulator captures, not physical screenshots. Metro, the disposable
emulator, isolated ADB server and temporary staging/helpers are cleaned up.

The old APK remains unchanged at:

```text
C:\Users\rohit\.copilot\session-state\15776956-7471-4228-a771-043239cb19b6\files\brain-brawl-android-local-qa.apk
```

Its SHA-256 was rechecked:
`0B00B1DDB9B07615C187154EF78778A0736A159FCFE827ECF84B576F361BE648`.
Use the fresh Phase 8A APK for the fixes, not this historical build.

Native staging is isolated from the workspace: `D:\BB8A`. Source configuration
has no approved production identifiers. QA uses the previously authorized
`com.brainbrawl.app`, release mode with debug signing, arm64-v8a and x86_64.
The inspected old/new signing certificate SHA-256 is
`fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.
Production/store signing is not prepared.

Local build uses JDK 17, Gradle 9.4.1, NDK 27.1.12297006 and CMake 3.22.1.
The short QA project and `CMAKE_OBJECT_PATH_MAX=240` worked with the installed
Ninja 1.10.2; no global SDK replacement was needed. For dependency junctions,
the staged `react` Gradle block must set `root = file("D:\\Jeopardy")`.
The normal project does not need that machine-specific setting.

```powershell
$env:CI='1'
Set-Location 'D:\BB8A\android'
.\gradlew.bat :app:assembleRelease '-PreactNativeArchitectures=x86_64,arm64-v8a' --no-daemon --console=plain --max-workers=2
```

This is the completed temporary staging build record, not an existing build
directory after cleanup. Reproduction requires a new isolated source/config
copy, Expo Android prebuild with the QA identity, the recorded CMake setting
and canonical Gradle source-root setting. No machine-specific path was added
to application source.

### Install on a physical Android device, if available

Transfer the fresh APK by USB and open it in the device's file manager. Allow
"Install unknown apps" for that installer when prompted. Alternatively enable
Developer options/USB debugging, authorize the Windows computer, then:

```powershell
Set-Location 'D:\Jeopardy'
$adb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
& $adb devices -l
# Replace DEVICE_SERIAL with the intended device from the list:
& $adb -s DEVICE_SERIAL install -r 'D:\Jeopardy\docs\qa\brain-brawl-phase8a-qa.apk'
& $adb -s DEVICE_SERIAL shell am start -n com.brainbrawl.app/.MainActivity
```

`-r` preserves application data and the old QA certificate matches. Do not
uninstall/clear data to bypass an unexpected signing failure without first
protecting the player's local progression. This is local QA, not store signing.
For an emulator with Android Studio: start an AVD, select its serial, then use
the same install command. For physical offline checks, stop Metro and disable
networking; this APK carries its JavaScript/assets.

## iPhone workflow from Windows

**Expo Go compatible by configuration/dependency audit. iPhone NOT TESTED.**
No custom native library requires a development build: Expo Router, loaders,
System UI, AsyncStorage, Screens, Safe Area Context, Reanimated 4.7.1 and
Worklets 0.13.0 align with SDK 58; Zustand is JavaScript-only. Expo's current
[Reanimated documentation](https://docs.expo.dev/versions/latest/sdk/reanimated/)
explicitly includes Expo Go and automatic Worklets/Babel configuration.

1. Install/update Expo Go on the iPhone to a version supporting SDK 58.
   App Store Expo Go supports its current SDK; do not upgrade this app blindly
   if a mismatch is reported. Check the SDK support/error first.
2. Put Windows and iPhone on the same trusted Wi-Fi, disable interfering VPNs,
   permit Node through Windows Firewall on private networks, and allow Expo Go
   Local Network access in iOS Settings.
3. Sign Expo CLI and Expo Go into the **same Expo account**. Current physical-iOS
   Expo Go requires this; see [Expo's sign-in guidance](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/).
4. In PowerShell:

   ```powershell
   Set-Location 'D:\Jeopardy'
   npx expo login
   npx expo start --go --lan --port 8091
   ```

   Existing dependencies are installed. On a different/fresh checkout only,
   run `npm ci` first.
5. Scan the terminal QR with the iPhone Camera and tap Open in Expo Go. Keep
   Metro running. `npm run ios`/pressing `i` is for a Mac simulator, not a
   Windows-attached physical iPhone.
6. If LAN fails, check firewall, iOS permission, Wi-Fi client isolation and
   matching accounts. Do not use the localhost URL shown by engineering's
   server check: it points at the Windows machine, not the phone.
7. Test the checklist below and record model, OS, Expo Go version and date.
   Stop Metro with Ctrl+C when finished.

No tunnel, EAS upload/cloud build, Apple sign-in, device registration or paid
service was started. Native iOS builds remain feasible on a compatible Mac or
an authorized EAS macOS builder from Windows. A signed development IPA needs
approved identifiers, developer-client setup and Apple provisioning; none is
required for this Expo Go workflow. React Native's inspected iOS floor is 15.1,
but the installed Expo Go app/SDK can impose additional requirements.

Expo Go proves the shared app can run in its host, not standalone IPA compilation,
production signing, app-specific native settings or bundled offline cold launch.
No new iOS native build/simulator run was performed in Phase 8A.

## Compatibility risk matrix

| Area | Android | iOS | Remaining risk |
| --- | --- | --- | --- |
| Native modules/configuration | SDK alignment PASS; fresh binary evidence below | Expo Go support audited; native compile/runtime NOT TESTED | Standalone iOS integration/signing open |
| Navigation/back/cancel | Shared tests PASS; native scope below | Shared tests PASS; physical gestures NOT TESTED | Android Back vs iOS explicit Forfeit; battle swipe intentionally disabled |
| Safe areas/keyboard/text | Shared structure PASS; limited emulator visuals | Padding/safe areas inspected; native NOT TESTED | Notch/Dynamic Island, home indicator, large text and real keyboards |
| Reanimated/art/HP | Mocked effects PASS; limited native visuals | Worklets/export PASS, native NOT TESTED | Frame pacing, touch latency, image alpha/crop, settled transitions |
| Timers/lifecycle | Engine/lifecycle evidence retained; limited emulator checks | Shared implementation/tests only | Calls/lock/long interruptions, device-clock changes, configuration recreation |
| Rewards/storage | Serialized/idempotency/restart tests PASS; native scope below | AsyncStorage included; native durability NOT TESTED | Interrupted writes/migration faults; unbounded retained receipt ledger |
| Appearance/accessibility | Dark configuration and native APIs inspected | Dark configuration/VoiceOver bridge inspected | Audible TalkBack/VoiceOver, OS motion changes and contrast under real displays |
| Offline/distribution | Bundled QA APK, not store signing | Expo Go requires Metro initially; no standalone IPA | Expo Go cache is not standalone-offline acceptance; no physical target verified |

## Known issues and deferred gaps

- Unfinished setup/battles can be lost after process restart: accepted MVP
  limitation. A crash before the finished-match write succeeds can lose that
  transient result; persisted claims must not duplicate.
- Native iPhone/simulator, physical Android, comparative performance,
  complete native win/sudden-death/all-booster/passive paths remain open.
- Old Android APIs/OEMs, three-button navigation, cutouts, maximum font size,
  long questions, interrupted writes, storage faults and native migrations
  need device testing. Manual device-clock changes and large ledgers are not
  comprehensively validated; do not refactor/clear receipts speculatively.
- Sylva/Titan retain labeled placeholders. Arcane/Shadow PNGs (512x768) and
  Mystic Arena JPEG (1280x720) remain NEEDS_REVIEW; no new image-path/size
  defect was found. Native iOS alpha/font/effect rendering is unverified.
- Demo rank/missions, initial balances, deterministic opponent seed reset,
  local-only identity, silent sound preference and no cloud sync are intentional.
- Historical dependency advisories are not a security clearance; no forced
  dependency upgrade or unrelated security-remediation expansion was performed.

## Phase 8B physical-device checklist - NOT PERFORMED

Run independently on the user's iPhone and an Android device if available.
Record device model/OS, exact APK hash or Expo Go/SDK version, date, pass/fail,
steps and screenshots. Mark unavailable paths NOT TESTED, never inferred.

- [ ] Install/open; cold launch; no native crash or red screen.
- [ ] Arena/Vault/Profile/Settings; identity save, keyboard, avatars, Back.
- [ ] Entire setup, search cancellation, bans/picks, ownership/three boosters.
- [ ] Back/Leave during setup confirmation; no unexpected later navigation.
- [ ] Four answer targets, simultaneous answers, retries, deadlines/timeouts.
- [ ] All six boosters, once-per-match and one-per-question interactions.
- [ ] Damage/HP, caps/bonuses, clash turns/privacy/alternating initiative.
- [ ] Full win and loss; knockout/finisher, results, payout/level-up, replay.
- [ ] Sudden death when reached; do not change production rules to force it.
- [ ] Forfeit/Keep playing; Android Back or iOS explicit control/modal.
- [ ] Capsule/new collectible/duplicate; Vault equip; reopen without regrant.
- [ ] Restart: identity, preferences, inventory, balances and receipts retained.
- [ ] Background/resume, lock/unlock, interruptions; no duplicate resolution.
- [ ] Portrait compact/tall layouts, notch/home indicator, long/large text.
- [ ] HP fills after transitions/modal, motion on/off and OS reduced motion.
- [ ] VoiceOver/TalkBack focus, announcements and accessible answer feedback.
- [ ] Android APK cold/offline launch with Metro stopped. Expo Go iPhone cache
      checks recorded separately; standalone iOS offline acceptance stays open.
- [ ] Record responsiveness/performance and any platform differences.

**Stopped after Phase 8A; awaiting approval before Phase 8B.**
