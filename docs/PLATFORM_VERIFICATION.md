# Brain Brawl: mandatory iOS and Android verification

Audit recorded: 2026-10-31. Scope: Phases 0-7 only.

Historical baseline retained. For subsequent engineering fixes, current checks,
the refreshed APK and Windows-to-iPhone Expo Go instructions, see the
[Phase 8A handoff](PHASE_8A_HANDOFF.md). This report's original observations
are not new Phase 8A or physical-device results.

**Release acceptance remains OPEN.** Android native QA compilation and limited
emulator journeys succeeded. iOS native compilation/runtime and both platforms'
physical-device acceptance have not been performed successfully. Shared code,
iOS Jest results and iOS JavaScript exports do not establish working native iOS
feature parity.

## Evidence levels and test environment

- **Static:** first-party application, tests, scripts, assets and configuration
  inventoried/scanned; platform-facing implementations and game/storage paths
  reviewed. Installed native dependency autolinking/podspecs and resolved Expo
  configuration were inspected. This is not a line-by-line third-party security
  audit or a native runtime test.
- **Jest:** Android/iOS Expo presets run in Node with mocked native APIs.
- **Export:** production Metro/Hermes JavaScript and assets, not an Xcode build.
- **Native build:** an actual platform binary compiled.
- **Emulator runtime:** an installed application exercised on the named emulator.
- **Physical runtime:** separate acceptance, never inferred from an emulator.

| ID | Environment | Actually used |
|----|-------------|---------------|
| H1 | Windows; Node 24.13.0, npm 11.6.2, Microsoft OpenJDK 17.0.18 | Source/config inspection, both Jest projects/exports, Android native build; no Xcode/CocoaPods |
| E1 | Disposable Pixel 7-profile AVD `BBQA15776956`; Android 16, API 36; x86_64; emulator 36.3.10.0; software SwiftShader GPU | Standalone Android QA APK; 390x844 and 360x800 logical layouts, hole cutout; Arena also captured at font scale 2 |
| EG1 | Same Android emulator, Expo Go fallback | Separate preliminary smoke run/data; not counted as standalone APK evidence |
| iOS Simulator | Unavailable on this Windows host | NOT TESTED |
| Physical Android / iPhone | No connected devices or supplied test results | NOT TESTED; reported separately below |

Display overrides were 1170x2532 and 1080x2400 pixels at 480 DPI. The reference
and compact screenshots are Android emulator captures, not iOS/device captures.
Only Arena was captured at font scale 2; that screenshot is not Profile evidence.

## Platform verification matrix

In every iOS feature row, native working parity remains **NOT TESTED**. H1 is a
host, not an iOS simulator. E1 always means Android, never a physical device.

| Feature or area | Android verification status | iOS verification status | Device/emulator used | Issues identified | Fixes completed |
|-----------------|-----------------------------|-------------------------|----------------------|-------------------|-----------------|
| Phase 0: Expo configuration and dependency alignment | Compatibility check PASS; resolved config inspected; QA native build PASS | Resolved config/autolinking inspected; native compile BLOCKED | H1; E1 Android only | Recommended Expo/Router patches missing; System UI dependency missing; production identity/signing unapproved | Expo/Router aligned; SDK-matched `expo-system-ui` installed; QA identity isolated |
| Native binary and bundled offline start | Release-mode arm64-v8a/x86_64 APK built; standalone launch PASS without Metro | Native command blocked on Windows; no Xcode compilation or IPA | H1; E1 Android only; no iOS device | Windows native object-path limit; no Mac available | Task-local CMake/Ninja workaround built Android; iOS remains unresolved |
| Phase 1: Arena/Vault/Profile navigation and route recovery | Tabs/setup/Settings navigation observed; unknown deep-link recovery to Arena PASS; other guards covered by Jest | iOS Jest PASS; source inspected; native NOT TESTED | H1; E1 Android only | iOS back/navigation runtime unverified | No Android-exclusive navigation implementation found; existing iOS battle swipe restriction retained |
| Phase 1/7: safe areas, portrait layout, keyboard and status bar | Reference/compact/cutout screens and identity input exercised; large-font Arena checked; not exhaustive | Safe-area and iOS keyboard implementation inspected; Jest PASS; native NOT TESTED | H1; E1 Android only | iOS notches/home indicator/keyboard unverified; font-scale route reset observed | Native dark-style dependency added; no layout redesign |
| Phase 2: fighter/arena assets, font/icons and composition | Bundled art/icons rendered on E1; registry/asset tests PASS; not every collectible rendered | Production asset export/Jest PASS; native decoding/font/rendering NOT TESTED | H1; E1 Android only | No iOS visual comparison; no exhaustive asset/device coverage | Existing assets retained; no new art or replacement imagery |
| Phase 3: offline mode and mock matchmaking | Play-to-battle journey PASS; cancellation/focus behavior additionally covered by Jest | iOS Jest PASS; shared implementation inspected; native NOT TESTED | H1; E1 Android only | No native iOS journey; not every Android cancellation branch exercised | No Android-only gameplay dependency found |
| Phase 3: category draft, fighter ownership and loadout | History ban, Space pick, Arcane and saved loadout entered native battle; ownership/draft cases Jest PASS | iOS Jest PASS; native NOT TESTED | H1; E1 Android only | Native coverage limited to exercised selections | Three stale snapshot-version test assertions aligned with version 3; persistence policy unchanged |
| Phase 4: answers, damage, HP, rounds, question clock and loss | Real native answer/loss observed; background/resume observed; full engine cases Jest PASS | iOS Jest PASS; lifecycle implementation inspected; native NOT TESTED | H1; E1 Android only | No native iOS timing test; native battle coverage partial; immediate HP-fill frame needs settled follow-up | No engine rule changes |
| Phase 4: six boosters, fighter passives, clash and sudden death | Jest PASS; controls/art present in native battle; exhaustive native activation, win and sudden-death runs NOT TESTED | iOS Jest PASS; native NOT TESTED | H1; E1 Android only for displayed controls | No full native interaction/edge-case acceptance on either platform | No speculative gameplay changes |
| Phase 4/7: Forfeit, Android hardware Back and modal cancellation | Hardware Back opened confirmation; Back canceled it; explicit confirmation recorded a later forfeit and no capsule | Explicit Forfeit/shared modal and disabled battle swipe inspected; Jest PASS; native NOT TESTED | H1; E1 Android only | iOS gesture/modal/safe-area behavior unverified | Existing platform-appropriate Back handling preserved |
| Phase 5: Reanimated effects, numeric fallback and reduced motion | Native combat/art and saved motion preference exercised; animation/motion Jest PASS; no FPS or complete fixture run | Worklet/export/podspec inspection and Jest PASS; native animations NOT TESTED | H1; E1 Android only | No comparative smoothness/performance measurement; OS reduced-motion/screen-reader runtime acceptance pending | Existing cleanup/static fallback retained |
| Phase 6: results, XP, coins, levels and match statistics | Native loss payout and restart observed; three saved losses including a forfeit observed; win/level-boundary/zero-XP forfeit policy Jest PASS | iOS Jest PASS; native NOT TESTED | H1; E1 Android only | Native win/level-up not exercised; forfeit zero-XP/coin values not separately captured | No reward-policy changes |
| Phase 6: capsule, duplicate shards, Vault and idempotency | Native duplicate common capsule added 5 shards; reopened reward stayed revealed; saved balances retained; Vault observed | iOS Jest PASS; AsyncStorage implementation inspected; native NOT TESTED | H1; E1 Android only | Native iOS receipt persistence/fault handling unverified; not every rarity/unlock exercised | Existing serialized writes/receipts retained |
| Phase 7: name/avatar, Profile/history, saved preferences and errors | AndroidQA/Star saved and survived force-stop; Settings/recorded history observed; failure/migration cases Jest PASS | iOS Jest PASS; native NOT TESTED | H1; E1 Android only | Native iOS input/keyboard/storage/migration/error UX unverified | Version-3 regression assertions corrected; no destructive storage changes |
| Phase 7: accessibility announcements and touch labels | Accessible native labels observed; Android bridge non-duplication Jest PASS; audible TalkBack NOT TESTED | iOS announcement scheduling/grouping/background suppression Jest PASS; audible VoiceOver NOT TESTED | H1; E1 Android only | `accessibilityLiveRegion` alone is Android-only | Explicit iOS announcement hook wired into text, panels, loading and battle reveal labels |
| App lifecycle, local persistence and offline behavior | Standalone force-stop/relaunch retained earned/player data; 15-second background/resume returned to valid battle state; offline journeys PASS | Lifecycle/storage source and Jest PASS; native NOT TESTED | H1; E1 Android only | Live battle/setup intentionally transient after process restart; native fault injection/config-change continuity incomplete | Existing timestamp catch-up and fail-closed/serialized persistence retained |
| Functionality/rendering/performance comparison | Android observations recorded only; no benchmark/FPS acceptance | No native observations or benchmark | E1 Android only; no iOS device | Cross-platform differences cannot be measured without iOS; older Android/OEM coverage absent | No unverified performance claims or redesign |

## Physical-device verification matrix

The user offered separate Android/iPhone testing. No device model, OS version,
build or completed result was supplied. Those offers are not performed tests.

| Feature or area | Android verification status | iOS verification status | Device/emulator used | Issues identified | Fixes completed |
|-----------------|-----------------------------|-------------------------|----------------------|-------------------|-----------------|
| Install, cold start and offline restart | NOT TESTED | NOT TESTED | None; physical models/OS unknown | Mandatory physical release gate open | None verified physically |
| Phases 0-7 feature journey and persistence | NOT TESTED | NOT TESTED | None | Emulator/Jest cannot substitute | None verified physically |
| Safe areas, keyboard, large text and screen reader | NOT TESTED | NOT TESTED | None | VoiceOver/TalkBack and real-device rendering open | Announcement implementation fixed; audible acceptance pending |
| Background/resume, interruption, reduced motion and performance | NOT TESTED | NOT TESTED | None | Native lifecycle/FPS/thermal comparison open | None verified physically |

## Fixes and unresolved observations

### Completed changes

1. [Dependency manifest](../package.json) and lockfile now use Expo `~58.0.22`,
   Expo Router `~58.0.29` and Expo System UI `~58.0.7`. Android prebuild had
   explicitly warned that dark `userInterfaceStyle` needed System UI.
2. [The iOS announcement bridge](../src/hooks/useLiveAnnouncement.ts) calls the
   iOS accessibility announcement API only while active. Polite messages queue;
   Android retains native live-region behavior without duplicate bridge calls.
   Shared text/panels/loading and grouped battle reveal labels are wired.
   Automated tests prove scheduling, not audible VoiceOver behavior.
3. [Platform Jest projects](../jest.platforms.config.js) provide reproducible
   Android/iOS preset runs. Three outdated pre-battle assertions now expect the
   Phase 7 version-3 snapshot; no production persistence migration was changed.
4. Windows Android compilation succeeded using the isolated native build
   workaround below. It was not added as a product feature or global SDK patch.

### Remaining differences and acceptance gaps

- Android hardware Back and iOS explicit Forfeit/no battle back-swipe are
  intentionally different controls. iOS runtime behavior remains unverified.
  iOS keyboard avoidance uses padding; Android uses native resize. Shadows
  include both iOS shadow properties and Android elevation.
- Changing Android emulator font scale returned the app to Arena; persisted
  identity/balances survived. Cause and active-battle impact were not confirmed.
  Configuration-change live-state continuity remains an explicit follow-up.
- An immediate post-modal/question-transition screenshot showed numeric HP
  with temporarily empty-looking fills. The scrolling battle body can remount,
  and HP fill animates from zero over 380 ms. No settled follow-up established
  whether this frame was only the initial tween or a persistent rendering issue;
  it is not claimed fixed or diagnosed.
- Native wins, sudden death, every booster/passive/collectible, interrupted
  storage writes and all failure/migration paths were not exhaustively exercised.
- Native iOS build, simulator rendering, timers/lifecycle, audible VoiceOver,
  both physical targets and comparative performance are unresolved.
- Sound is an intentionally saved future-audio preference; neither platform
  currently plays audio. Static navigation, demo rank/missions and transient
  live battles remain intentional product behavior, not new platform features.
- Installations reported 45 npm vulnerability notices. No security audit or
  automatic audit remediation was performed; dependency compatibility is not
  a security clearance.

## Commands and actual results

| Check | Actual result |
|-------|---------------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npx expo install --check` | PASS |
| `npm run test:platforms` | PASS: 28 suites / 510 tests across both projects |
| Focused affected-UI checks | PASS: 8 suites / 60 tests |
| Production Android and iOS Metro/Hermes exports | Both PASS; JavaScript/assets only |
| iOS native prebuild/build attempt | Windows skipped/rejected iOS generation/build; no Xcode compile occurred |
| Android staged Gradle release build | PASS; installed APK runtime checks on E1 |
| iOS Simulator / physical Android / physical iPhone | NOT TESTED |

Installed native dependencies include React Native 0.88.1, Reanimated 4.7.1,
Worklets 0.13.0, Safe Area Context 5.10.1, Screens 4.30.1 and AsyncStorage 2.2.0.
Their iOS autolinking/podspec presence was inspected, not compiled by CocoaPods.
Resolved iOS configuration included dark interface style, portrait orientations
and `UIViewControllerBasedStatusBarAppearance: false`. Source
[Expo configuration](../app.json) has no approved release identifiers; inspection
placeholder identifiers were not saved into it.

### Android QA artifact and reproducible build record

Delivered artifact: `brain-brawl-android-local-qa.apk`, 54,396,692 bytes.

- Package: `com.brainbrawl.app`, authorized **local QA only**.
- ABIs: `arm64-v8a`, `x86_64`; other architectures were not built for this APK.
- Release mode, manifest `debuggable=false`; generated **debug signing
  certificate**, not production/store signing.
- Minimum SDK 24; target SDK 36; compile SDK/build tools 37.
- Bundled Hermes bytecode: `assets/index.android.bundle`, 3,177,756 bytes.
- SHA-256: `0B00B1DDB9B07615C187154EF78778A0736A159FCFE827ECF84B576F361BE648`.

The isolated native QA copy used Gradle 9.4.1, NDK 27.1.12297006, Kotlin 2.2.10
and CMake 3.22.1. The successful command was:

```powershell
$env:CI='1'
Set-Location 'D:\BBQA-15776956\android'
.\gradlew.bat :app:assembleRelease '-PreactNativeArchitectures=x86_64,arm64-v8a' --no-daemon --console=plain --max-workers=2
```

Windows CMake/Ninja initially exceeded native object-path limits. A task-local
Ninja 1.13.2 and short CMake staging directory, with
`CMAKE_OBJECT_PATH_MAX=240`, resolved the recorded build. An attempted limit of
128 was too short for the generated target prefix. QA-only Gradle additions:

```groovy
// Inside android.defaultConfig:
externalNativeBuild {
    cmake {
        arguments "-DCMAKE_OBJECT_PATH_MAX=240",
            "-DCMAKE_MAKE_PROGRAM=D:\\BBQA-15776956-tools\\ninja.exe"
    }
}

// Inside android, outside defaultConfig:
externalNativeBuild {
    cmake {
        buildStagingDirectory "D:\\BBQA-15776956-cxx"
    }
}
```

These paths describe the completed disposable build, not persistent directories
or source configuration. Reproduction needs equivalent local paths/tooling.
No global SDK Ninja was replaced, paid/cloud build started or source uploaded.

### Observed standalone Android journeys

- Bundled launch and play worked with Metro stopped, airplane mode enabled and
  Wi-Fi/mobile data disabled. The task's Metro reverse mapping was removed
  before final checks. An isolated ADB server on port 5038 avoided a stalled
  shared/default server without stopping it.
- A real loss recorded score 20 vs 100, HP 0 vs 80 and one correct answer.
  It granted 55 XP / 25 coins: 295/400 XP and 1275 coins. A duplicate common
  50:50 capsule granted 5 shards, taking the balance to 45.
- Force-stop/relaunch retained AndroidQA/Star, earned balances and preferences.
  Reopening `reward-match-1` showed an already-revealed reward without another
  capsule-open action; balances remained unchanged at that checkpoint.
- A subsequent Space setup entered battle. After 15 seconds backgrounded, the
  app returned to a valid later question/resolution with HP 90. Timer catch-up
  resolves the overdue current question, not every future unattended question.
  Hardware Back opened Forfeit and a second Back canceled it.
- That later battle naturally ended. Arena then showed 345/400 XP, 1300 coins
  and 45 shards. A fresh third battle was explicitly forfeited; its reward page
  stated that forfeited matches grant no capsule. Profile recorded three
  losses, including `Defeat (forfeit)` for `reward-match-3`.
- A nonexistent native deep link displayed Page not found; Arena home recovered.
  A final standalone force-stop/start succeeded; no warnings/errors appeared in
  the queried current-process ReactNativeJS/AndroidRuntime log filters.

UIAutomator sometimes could not obtain an idle hierarchy during active battle
updates. The helper was corrected to discard its old dump before each attempt;
failed fresh dumps were not counted as successful interactions. Native coverage
above relies on observed controls/screens and saved statistics, not presumed
automation completion. The separate Expo Go run does not supplement APK stats.

Individual emulator startup observations were 3002 ms on initial installed-app
launch and 675 ms on a later cached cold launch. These are not benchmarks,
physical performance results, FPS measurements or an iOS comparison.

### Screenshot evidence: Android emulator only

- [Standalone loss](qa/platform-audit-android-result.png)
- [Duplicate capsule](qa/platform-audit-android-reward.png)
- [Compact Profile](qa/platform-audit-android-profile-360x800.png)
- [Compact Settings](qa/platform-audit-android-settings-360x800.png)
- [Arena at font scale 2](qa/platform-audit-android-arena-font-scale-2.png)
- [Battle](qa/platform-audit-android-battle.png)
- [Background/resume](qa/platform-audit-android-battle-resume.png)
- [Hardware-Back confirmation](qa/platform-audit-android-forfeit.png)
- [Hardware-Back cancellation](qa/platform-audit-android-keep-playing.png)

Captures show different journey checkpoints, not the final state simultaneously.
Immediate transition/press frames are not settled-animation or performance proof.

## Required follow-up before release acceptance

1. On a Mac, authorize QA identifiers/signing in an isolated copy, install the
   compatible Xcode/CocoaPods toolchain and actually build iOS. For example,
   `npx expo run:ios --configuration Release`; then run the installed native app
   on an available iOS Simulator. This procedure was not completed on this host.
2. Test the standalone Android QA APK and a properly signed native iOS build on
   at least one physical Android device and one physical iPhone. Record model,
   OS, exact build, date and physical results separately from simulators.
3. On each target, run setup/cancel/back guards, win/loss/forfeit, clashes/sudden
   death, all boosters/passives, rewards/duplicate reopening, Vault/equipment,
   Profile/history, identity validation, saved preferences and offline restart.
4. Check real notches/home indicators, keyboard, compact/large text, modal
   cancellation, settled HP fills, OS/app reduced motion and audible
   VoiceOver/TalkBack announcements. Retest Android font-scale route continuity.
5. Check background/resume deadlines, interruptions, process restart and storage
   error/retry behavior. Battle state after process restart is intentionally
   transient; player data and completed rewards must persist without duplication.
6. Record rendering differences and measured performance on both targets; do
   not use this software-rendered emulator's launch samples as acceptance.
7. Resolve release identifiers, production signing and remaining failed/open
   checks. Update this matrix with actual results before declaring the MVP
   complete. Historical phase handoffs remain records of their original checks.
