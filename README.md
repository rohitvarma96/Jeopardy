# Brain Brawl

An offline trivia duel on Expo SDK 58, with six human fighters, articulated
Skia combat, a grounded Relay stage and four physical reward chest designs.
The existing battle engine, progression,
timers and navigation remain authoritative; animations never calculate damage.
No backend is included. Native iOS and physical-device release acceptance remain
open; historical results in the [platform audit](docs/PLATFORM_VERIFICATION.md)
do not establish verification of the new renderer.

## Requirements

- Node.js and npm compatible with the installed Expo SDK.
- For Android: an Android emulator or device and the Expo Go app.
- For iOS: Expo Go on an iPhone, or an iOS simulator on a Mac with Xcode.
- Standalone Android builds require the Android SDK and compatible Java/native
  build tools. Standalone iOS builds require a Mac, Xcode and CocoaPods; physical
  iOS installation also requires appropriate signing.

## Run

From this directory:

```sh
npm install
npm start
```

Open the displayed QR code in Expo Go, or press `a` to open an available
Android emulator. Alternatively, run `npm run android`. A physical device
normally needs to be on the same network as the development machine.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:platforms
npx expo install --check
```

Use `npm ci` for a reproducible installation from the lockfile. Expo generates
its typed-route declarations when the development server starts.

## Navigation and pre-battle journey (Phase 3)

- Launch opens Arena. The only bottom tabs are Arena and Profile.
- The Arena tab uses a compact lobby with player level/XP, demo rank, currency
  balances, an artwork-led saved fighter showcase, a gold `Play` action and the
  saved booster loadout. `Change hero` opens an owned-hero picker and saves
  equipment locally; unowned heroes remain locked until collected. Boosters
  are changed during match setup. Missions, Vault and the mode summary above
  `Play` have been removed.
  The layout expands into two columns on wider screens and stacks for large
  text; the live battle and animation arena screens are unchanged.
- `Play` -> mode (Offline Duel only) -> mock matchmaking (1.2 s, cancellable)
  -> category ban/pick draft -> fighter select -> loadout (exactly three
  distinct boosters) -> live battle (Phase 4).
- Mode selection matches Arena's dark/gold styling, with an artwork-led Offline
  Duel card, compact locked future modes and a safe-area-aware fixed
  `Find opponent` action. Mode cards scroll on short or large-text screens;
  wider layouts use two columns. Availability and the setup journey are unchanged.
- Arcane and the default three boosters are initially owned. Other choices
  unlock through earned chests. Fighter and loadout persist locally (AsyncStorage)
  and are validated for ownership on load and before battle entry. Match state
  is transient; completed results and rewards persist. Details:
  `docs/GAMEPLAY_DECISIONS.md`.
- Pre-battle `Back` returns one step; `Cancel search`/`Cancel match` returns to
  mode; `Leave match` clears the match and returns to Arena. Direct entry into
  a later step shows "Match setup not ready" with a `Choose a mode` recovery.
- Battle: offline match against the deterministic mock opponent using your
  fighter and loadout. Both players follow one shared sequence of mixed-category
  questions with independent 12 s timers. Answers lock independently; attacks
  resolve after both players finish. Play continues until knockout or forfeit,
  with no rounds, bonuses, caps or clash turns. Compatible boosters and passives
  remain active; Second Chance is disabled (no retries). `Forfeit` (or Android
  Back) asks for confirmation. The
  result screen shows battle stats, `Play again` and `Arena home`. Rules:
  `docs/GAMEPLAY_DECISIONS.md`; engine: `src/game/battle/`.
- Results grant XP/coins once; `Continue` opens the chest reveal and `Arena home`
  exits the finished match. Collected heroes and boosters remain saved locally.
  Unopened chests and results can be reopened from Profile history after
  restarting.
- Profile shows a saved name/avatar, level/XP, wins/losses, win rate, answer
  accuracy, damage, best combo and recent history. Settings saves identity
  explicitly and preferences immediately. Unknown paths show an explicit
  not-found screen with an Arena return action.

No network access is used. Starting profile values, the default username and rank
are demo data. The username/avatar are editable; earned XP, coins,
shards, inventory and match history are real local prototype state. Rank is
labeled demo.

## Shared UI

**Proposed next direction:** the [ground-up game experience blueprint](docs/GAME_EXPERIENCE_BLUEPRINT.md)
and [visual composition board](docs/GAME_EXPERIENCE_BOARD.html) supersede the
page-based UX approach below. They define a scene-based lobby, original icon
family, persistent preparation and a shorter match/reward loop. These are design
proposals, not claims that the current prototype implements the new experience.

The game now uses **VOLT / Arena Protocol**, an original signal-red, acid-yellow,
chalk and ink esports design language, with six mature illustrated human
fighters. All game screens use fixed viewport layouts, bottom navigation and
explicit section/item paging instead of page scrolling. Arena, setup, profile,
settings, results, rewards and the development labs share this structure.
Battle retains its fixed HUD and ability dock, with confirmation before forfeit.
The interactive **Arena -> Design lab** (`/design-lab`) demonstrates the
reusable component library. Gameplay rules remain unchanged. See the
[VOLT design system](docs/VOLT_DESIGN_SYSTEM.md) for tokens, typography,
component contracts, accessibility and rollout boundaries.

`src/theme` contains palette, spacing, typography, radii, shadow and layout
tokens. `src/components/ui` contains text, buttons, cards/panels, icon slots,
bars, badges, loading/empty states and safe-area-aware scrolling screens.
The darker action-purple token provides readable white button labels while
preserving the specified arcane accent. Ionicons are generic interface icons,
not substitute fighter, arena, booster or reward artwork.

The app plays no sound, even when the saved future-audio preference is enabled.
Navigation transitions remain static. Battle motion and loading indicators
follow either the device's reduced-motion preference or the app's Reduce motion
setting; the app cannot override system reduction. Player identity/preferences,
equipment, progression, inventory and completed matches persist locally;
live battle state is transient.

The four Brain Brawl documents in this directory govern future phases.
Purchases, cloud sync and backend work remain deferred.

See [the Phase 1 handoff](docs/PHASE_1_HANDOFF.md) for the exact validation
results, file inventory, Android screenshots and remaining limitations.

## Assets

The original Relay fight-stage illustration replaces the old Mystic Arena in
combat. Non-battle surfaces use six adult human illustrations; combat uses
matching articulated vector counterparts rather than moving the whole PNG.
Four chest families each have closed/open art: Field, Arc, Overdrive, Sovereign.
Chest family is cosmetic and does not change rarity odds or rewards.

See the [Phase 2 handoff](docs/PHASE_2_HANDOFF.md),
[art direction](docs/ART_DIRECTION.md), [asset manifest](docs/ASSET_MANIFEST.md)
and [composition proof](docs/qa/phase2-asset-preview.jpg).
The Phase 2 composition proof and historical native captures show the previous
artwork, not the current combat renderer.

## Skia combat

The battle UX now uses a fixed, safe-area-aware duel HUD, separate arena,
integrated question/timer/answers and persistent three-power ability dock.
Only equipped, battle-compatible boosters appear, with color-coded cards and
icon tiles. Used powers immediately turn grey and remain disabled for the match;
pending effects retain a `USED / ARMED` label. Second Chance and unequipped
powers are omitted. Short screens use a two-column answer layout and
compact ability cards. Automatic reveals no longer show a redundant
Continue button; the existing 2.2-second progression remains unchanged.

See [combat and chests](docs/COMBAT_AND_CHESTS.md) for the current renderer,
verification commands and exact scope. The older
[battle UX handoff](docs/BATTLE_UX_HANDOFF.md) records historical evidence.

- Human shoulders, elbows, wrists, hips, knees, ankles, torso and head move
  independently. Inverse kinematics plants support feet; kicks chamber and
  extend; KO holds an articulated collapse.
- Existing action/contact clocks drive movement, impact effects and dedicated
  STRIKE/BLOCK/KO lettering. No renderer computes damage or changes game timers.
- Resolution expands the stage and shows the correct answer in a compact strip;
  the normal question/answer grid returns for the next exchange.
- Reduced motion retains readable static poses and feedback. Effects ignore
  touch input and remain clipped to the arena.
- `/battle/animation-preview` uses the real Skia rig. The standalone
  [motion study](docs/COMBAT_STUDY.html) shares the same geometry/motion source.
  Rebuild it with `node scripts/build-combat-study.cjs` after editing that source.
- **Arena -> Design lab -> Chest forge** previews all eight chest states without
  touching player data. Live chests settle rewards exactly once; a failed save
  leaves the chest closed and exposes recovery.

The current rig is faceted/vector, not a finished painted or 3D animation set.
Chest open/closed illustrations are not a segmented continuous hinge animation.
Application/new-test type checks and focused regression tests are separate from
the repository-wide type check's existing retired rounds/clash test failures.
Android/iOS Hermes exports do not establish device acceptance; native devices,
comparative frame-rate measurements and a new standalone native binary remain
unverified.

## Progression and collection (Phase 6)

- Win: 100 XP / 50 coins. Loss: 50 XP / 25 coins. Correct answers add 5 XP
  each; forfeits grant nothing. Match score is damage dealt, separate from XP.
- Level `L` requires `100 * (L + 1)` XP; surplus XP carries into the next
  level. The former level-3 demo profile is the persisted starting baseline.
- One seeded capsule per non-forfeit match; common/rare/epic duplicates become
  5/15/40 shards. Boosters are permanent unlocks, not consumable quantities.
- A single versioned player snapshot contains balances, inventory, equipment,
  claim records and a durable match-ID counter. Writes are serialized and
  published to UI only after storage succeeds. Reopening results/rewards
  cannot grant them twice.
- Failed match saves remain retryable and prevent a new battle from replacing
  the unsaved result. Malformed current storage is retained and fails closed,
  rather than silently resetting the claim ledger.

Focused validation (no full regression/end-to-end run):

```powershell
npm run typecheck
npm run lint
npx jest --runInBand tests\rewards.test.tsx tests\pre-battle\rules.test.ts tests\navigation.test.tsx --testNamePattern="XP|capsule|collectible|grant|duplicate|persisted player selections|match setup store|malformed|reward|unsaved finished"
```

See [the Phase 6 handoff](docs/PHASE_6_HANDOFF.md) for implemented policy,
changed files, validation and Phase 8 gaps.

## Profile and application polish (Phase 7)

- Editable local player name (2-24 characters) and initials/Spark/Shield/Star
  avatars, shared by Arena and Profile.
- Aggregate match statistics, recent result links and an actionable empty
  history state. Failed/loading player data never appears as earned values.
- Saved sound and reduced-motion preferences, accessible on/off controls,
  explicit save/error feedback and non-destructive version-2 data migration
  into the version-3 player snapshot.
- Wrapping shared text/badges/progress labels, adaptive tab height, keyboard
  handling and 48-point touch targets. Battle answers/timer remain in a
  bottom-safe control tray while questions, boosters and feedback scroll
  independently. Extremely long answers can scroll within the tray.
- Forfeit uses a safe-area-aware confirmation dialog. Matchmaking cancels
  pending work on blur/background and restarts its short search on resume.
  Battle timers retain their timestamp-based catch-up policy.

Focused checks only:

```powershell
npm run typecheck
npm run lint
npx jest --runInBand tests\profile-polish.test.tsx tests\navigation.test.tsx tests\reduced-motion.test.tsx tests\battle\animation-smoke.test.tsx --testNamePattern="Phase 7|Phase 1 navigation|reduced motion follows|late initial read|failed preference reads|answer submission and Continue"
```

At the original Phase 7 handoff, TypeScript/lint and 23 selected tests passed.
Android 16 / Expo Go 58.0.5 was
checked on a disposable phone emulator at 360x800 and 390x844 logical pixels.
iOS Metro compilation and simulated-platform structural tests passed; no iOS
simulator or physical device was available on this Windows host. The current
audit below aligns the recommended Expo/Router patches and adds dual-platform
regression checks and a standalone Android QA build.

See [the Phase 7 handoff](docs/PHASE_7_HANDOFF.md) for the full changed-file
list, exact platform coverage, screenshots and remaining Phase 8 gaps.
Phase 8A engineering stabilisation is documented in the
[Phase 8A handoff](docs/PHASE_8A_HANDOFF.md). Phase 8B physical-device testing
has not started.

## Phase 8A testing preparation

The [engineering handoff](docs/PHASE_8A_HANDOFF.md) contains fixes, targeted
test evidence, Android QA installation, platform risks and the Phase 8B checklist.
Gameplay rules and dependencies remain unchanged.

Brain Brawl is compatible with SDK 58 Expo Go by dependency/configuration audit.
From Windows, install compatible Expo Go on the iPhone, sign it and Expo CLI
into the same Expo account, allow iOS Local Network access and use shared Wi-Fi:

```powershell
Set-Location 'D:\Jeopardy'
npx expo login
npx expo start --go --lan --port 8091
```

Scan the terminal QR with the iPhone Camera and open in Expo Go. Keep Metro
running; no Mac or Apple Developer membership is needed for this workflow.
This is not evidence of an iPhone test or standalone native iOS build.
The MVP remains **not fully platform-verified or release-ready**.

## Mandatory cross-platform audit

See [the platform verification matrix](docs/PLATFORM_VERIFICATION.md) for
Phases 0-7, exact evidence, fixes, build details and outstanding acceptance gates.

- TypeScript, lint, Expo dependency compatibility and **28 suites / 510 tests**
  across Android/iOS Jest projects passed.
- Production Android and iOS JavaScript/Hermes exports passed. These are not
  native iOS builds or simulator/device verification.
- A release-mode, bundled Android QA APK was built and exercised offline on a
  Pixel 7-profile Android 16 emulator, including a loss/reward/duplicate journey,
  saved data after restart, background/resume, forfeit and unknown-route recovery.
  Native coverage is not exhaustive.
- Expo/Router patches were aligned, `expo-system-ui` was added for native dark
  interface support, and Android-only live-region announcements received an
  explicit iOS VoiceOver bridge. Audible screen-reader testing remains open.
- The iOS native build attempt was blocked by Windows. No iOS Simulator run or
  Android/iOS physical-device test was performed. **The MVP is not yet fully
  platform-verified or release-complete.**

For native QA, first configure authorized QA identifiers in an isolated copy.
The audited APK uses `com.brainbrawl.app` only for local QA and a generated debug
signing certificate; production identifiers/signing remain unapproved.

```sh
# Android, with the required SDK/toolchain installed:
npx expo run:android --variant release

# iOS, on a Mac with the required Xcode/CocoaPods installed:
npx expo run:ios --configuration Release
```

These are follow-up build procedures, not evidence that both commands succeeded
on this host. The report records the successful staged Android Gradle command
and its Windows CMake/Ninja path workaround. Expo Go testing does not replace
standalone native acceptance.
