# Phase 7 handoff - Profile, polish and focused cross-platform checks

Implemented PH-10 only, using ARC-07/08 and CTX-08/09; also read the referenced
AST-11 asset compatibility requirements. No Phase 8 implementation, backend,
new artwork, dependencies, SDK upgrade or full regression testing.

**Phase 7 implementation is delivered. Mandatory native iOS acceptance remains
open: compilation and simulated-platform tests are not device verification.**

## Features implemented

- Local identity: editable 2-24-character name, trimmed/normalized spaces and
  initials/Spark/Shield/Star avatars. Arena and Profile share the saved identity.
  Avatars are initials or built-in UI icons, not substitute fighter artwork.
- Profile: level/XP, balances, matches, wins/losses, win rate, answer accuracy
  (correct / correct + wrong + timeouts), total damage, best combo and latest
  ten result links. Forfeits count as losses. Empty history offers Arena.
  Rank and starting values are clearly labeled demo content.
- Settings: explicit identity save; immediately saved sound/reduced-motion
  preferences; distinct saving feedback, disabled controls, success notices,
  visible storage errors and retry without publishing failed changes.
  Sound defaults off. This prototype has no audio; enabling the preference
  saves future intent but does not introduce sound.
- Persistence: version 3 stores avatar/preferences with the existing profile,
  equipment, collection, match receipts and ID counter. Version 2 migrates
  non-destructively on load. Malformed settings/data fail closed. Serialized
  writes preserve rewards when identity/preferences are saved concurrently.
- Polish: shared wrapping typography/badges/progress labels, responsive
  identity/fighter rows and avatar/stat grids; font-scale-aware tab height;
  consistent 48-point touch targets; accessible buttons, radios, switches,
  numeric progress, selected markers and announcements.
- Battle: question/HUD/boosters/art/feedback scroll independently of a
  bottom-safe answer/timer tray. Long answers scroll within its bounded height.
  Scroll positions reset for new questions; outcome headings show Victory/
  Defeat. Forfeit confirmation is a safe-area-aware, scrollable modal.
- Lifecycle: repeated active events cannot start duplicate battle intervals.
  Backgrounding stops foreground ticks; resume catches up by timestamps.
  Matchmaking aborts on blur/background/unmount and restarts its 1.2-second
  simulated search on resume without producing duplicate matches.
- Reduced motion: app reduction OR system reduction disables battle motion
  and animated loading; switching the app setting off cannot override the OS.

## Platform abstraction and behavior

Shared Expo Router, Expo StatusBar, React Native AppState/AccessibilityInfo and
safe-area-context APIs serve both platforms. No dependencies were added.
The shared Screen uses KeyboardAvoidingView padding on iOS; Android uses its
native window resize behavior. This is the only new OS-specific layout choice.
Battle iOS swipe-back remains disabled to prevent accidental abandonment;
explicit Forfeit and Android Back open the same confirmation. Android modal
Back cancels confirmation. Standard Settings Back/stack gestures remain intact.

## Focused validation actually performed

| Platform/device | Actual checks and result |
| --- | --- |
| Windows development host | TypeScript and lint passed, exit 0. Four selected Jest suites passed: 23 tests, 3 unrelated animation cases skipped; no full suite. |
| Android phone emulator, Pixel 7 preset, x86_64, Android 16/API 36 (installed system image 36.1), Expo Go 58.0.5 | Native Profile at 360x800 and 390x844; Settings at 360x800; live battle at 390x844. Density 480 DPI; physical sizes 1080x2400 and 1170x2532. Screenshots visually inspected. |
| Same Android emulator | Tabs, keyboard/name editing, avatar save, settings/back, Vault, mode/draft/fighter/loadout/battle navigation, selected/disabled feedback, result navigation and persisted forfeit statistics verified. |
| Same Android emulator, gesture navigation and emulated hole cutout | Top/system-bar and bottom-gesture clearances inspected. Edge gesture Back returned mode to Arena. Hardware Back opened battle confirmation; Keep playing and explicit Forfeit worked. |
| Same Android emulator, lifecycle/storage | Home/background for 15 seconds and resume returned to the same battle at a later question without a visible error. Native force-stop/relaunch retained name/avatar; subsequent Settings showed saved reduced motion on and sound off. |
| Same Android emulator, radios disabled | Local Expo launch/relaunch worked with Wi-Fi/mobile data disabled through ADB reverse and local Metro. This is NOT a standalone offline release-build test. |
| iOS, no simulator/device available | Final iOS Metro JavaScript bundle compiled successfully. No native iOS rendering, notch/Dynamic Island, gestures, storage or lifecycle verification performed. Windows cannot run Xcode/iOS Simulator. |
| Simulated iOS and Android in Jest | Long synthetic questions/answers at 320x640 (font scale 2), 360x800 and 390x844: four answer touch targets, bounded scroll tray and all safe-area edges verified structurally. These tests do not measure native pixel clipping or physical touch behavior. |

The selected tests additionally cover empty/error Profile, identity/preferences
restart, version-2 migration preserving claim receipts, concurrent reward saves,
failed preference rollback/retry, malformed storage retention, OS/app reduced
motion, background timeout resolution once, interval cleanup, matchmaking
cancellation, tab/settings/recovery navigation and immediate answer/Continue
interaction. Native battle answer tapping was not separately verified.

Measured normal-text contrast: white primary labels 6.65:1; body on surface
13.03:1; secondary text on surface 7.98:1 and on background 9.72:1.

```powershell
npm run typecheck
npm run lint
npx jest --runInBand tests\profile-polish.test.tsx tests\navigation.test.tsx tests\reduced-motion.test.tsx tests\battle\animation-smoke.test.tsx --testNamePattern="Phase 7|Phase 1 navigation|reduced motion follows|late initial read|failed preference reads|answer submission and Continue"
```

`npx expo install --check` exited 1: installed Expo 58.0.21 and Router 58.0.28
have newly recommended ~58.0.22/~58.0.29 patches. Existing versions were left
unchanged rather than casually upgrading the SDK/toolchain.

The existing emulator lacked room to install Expo Go. It was stopped without
clearing its data; a disposable QA AVD was used instead. Expo Go's developer
onboarding needed dismissal and the cold deep-link launch needed a plain-URL
retry. Enabling cutout emulation recreated the Expo Go experience and reset
transient setup; persisted identity survived. UIAutomator could not obtain an
idle tree while the live timer updated, so battle/resume/confirmation evidence
uses screenshots and native inputs, not stale accessibility dumps.

## Screenshots

All are Android emulator captures, not iOS or physical-device screenshots.
PNG dimensions were measured. Settings/statistics images are scrolled views;
offscreen content remains accessible through vertical scrolling.

| Capture | Logical / physical pixels |
| --- | --- |
| [Profile, compact](qa/phase7-profile-360x800.png) | 360x800 / 1080x2400 |
| [Profile, reference](qa/phase7-profile-390x844.png) | 390x844 / 1170x2532 |
| [Settings and saved preferences](qa/phase7-settings-360x800.png) | 360x800 / 1080x2400 |
| [Match statistics/history](qa/phase7-statistics-390x844.png) | 390x844 / 1170x2532 |
| [Battle question and four answers](qa/phase7-battle-390x844.png) | 390x844 / 1170x2532 |
| [Battle after background/resume](qa/phase7-battle-resume-390x844.png) | 390x844 / 1170x2532 |
| [Hardware-Back forfeit confirmation](qa/phase7-forfeit-390x844.png) | 390x844 / 1170x2532 |

## Files changed

Added:

- [PlayerAvatar.tsx](../src/components/player/PlayerAvatar.tsx)
- [profile-polish.test.tsx](../tests/profile-polish.test.tsx)
- This handoff and the seven linked QA screenshots.

Modified:

- [Profile](<../app/(tabs)/profile.tsx>), [Settings](../app/settings.tsx),
  [Arena](<../app/(tabs)/arena.tsx>), [Vault](<../app/(tabs)/vault.tsx>),
  [Tab layout](<../app/(tabs)/_layout.tsx>)
- [Matchmaking](../app/battle/matchmaking.tsx),
  [Fighter select](../app/battle/fighter-select.tsx)
- [BattleScreen.tsx](../src/components/battle/BattleScreen.tsx),
  [useBattleClock.ts](../src/features/battle/useBattleClock.ts)
- [Screen.tsx](../src/components/ui/Screen.tsx),
  [AppText.tsx](../src/components/ui/AppText.tsx),
  [Badge.tsx](../src/components/ui/Badge.tsx),
  [ProgressBar.tsx](../src/components/ui/ProgressBar.tsx)
- [useReducedMotion.ts](../src/hooks/useReducedMotion.ts)
- [Player types](../src/game/types/player.ts),
  [Player defaults/avatars](../src/data/player.ts),
  [Player storage](../src/services/player-storage.ts),
  [Player store](../src/store/player-store.ts)
- [README.md](../README.md)

No package manifest/lockfile, game engine, image assets or unrelated historical
handoffs were changed. QA Metro/emulator processes and disposable files/AVD
are cleaned up; screenshots and this report remain.

## Remaining issues and Phase 8 test gaps

1. **Mandatory iOS native gap:** test supported iPhones/simulators, including
   small screens and notch/Dynamic Island; safe areas, navigation gestures,
   keyboard, cold/offline launch, lifecycle, storage, image/vector formats and
   reduced motion. No iOS or Android physical devices were tested here.
2. **Android coverage:** older supported APIs, OEM devices, three-button
   navigation, different cutouts/system bars, native larger fonts/TalkBack,
   extreme long questions/answers, small-screen live battle/answer tapping,
   and standalone/release builds remain unverified. Native live battle was
   checked at 390x844, not 360x800/320x640.
3. **Lifecycle:** native exact timer drift/duplicate-resolution assertions,
   repeated/long interruptions, calls/lock screen, gesture interruption and
   process recreation/termination during a live match need Phase 8. Current
   live battles/setup are transient; process death can lose an unsaved match.
   The observed Expo Go configuration recreation is not durable live-session
   support. Native background/resume here is a sanity check only.
4. **Persistence:** native version-2 migration, migration-write failure,
   storage faults/interrupted writes, malformed-data recovery, large ledgers
   and performance remain gaps. Existing claim history is retained indefinitely
   for idempotency; the UI shows ten. No destructive reset was introduced.
5. **Accessibility/media:** VoiceOver/TalkBack focus order and announcements,
   native system reduced-motion changes, maximum text scaling and both-platform
   WebP/PNG alpha/crop/effect rendering remain open. Initials are decorative,
   fixed-size glyphs with an accessible avatar label; the player name scales.
   Sound is a saved future preference only; the app remains silent. Existing
   Sylva/Titan artwork placeholders, demo rank/missions and starting balances
   remain explicitly labeled.
6. **Scope/toolchain:** evaluate the Expo/Router patch warning before release.
   Full combat/booster/reward regression, win/loss/capsule/replay journeys,
   comprehensive device coverage and crash recovery from earlier handoffs were
   deliberately not rerun. Prior Phase 4-6 gaps remain unless explicitly
   covered above.

**Stopped after Phase 7. Phase 8 has not started; awaiting approval.**
