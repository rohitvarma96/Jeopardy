# Phase 5 handoff - Animation and combat feedback

## Scope and outcome

PH-08 only is implemented. Read PH-08, AST-01 through AST-12, ARC-05 through
ARC-08, and the product gameplay/experience sections. The current MVP
constraint takes precedence over the future asset inventory: only the
existing Arcane, Shadow and Mystic Arena images are reused.

**Phase 4 remains authoritative.** No engine, battle-store or clock files
were modified. Damage, HP, deadlines, answer evaluation, booster rules,
progression through rounds/clashes, initiative and outcomes are unchanged.
Presentation reads `BattleView`; it cannot dispatch gameplay actions.
Existing answer/booster/Continue/forfeit buttons still dispatch directly to
the existing store, without awaiting an animation.

## Implemented animations

| Area | Presentation |
|---|---|
| Fighters | Entrance slide, breathing/idle movement, attack wind-up and lunge, directional hit shake/tilt |
| Combat | Traveling arcane trail, slash/impact ring, shield impact, rising damage numbers, round-bonus labels |
| Health | 380 ms HP-fill tween; numeric labels and accessibility expose current engine HP immediately |
| Answers | Selection pulse, correct/wrong icons and borders, wrong-answer shake, Second Chance feedback; no early answer/opponent information leakage |
| Combo | HUD pulse and resolved combo banner, including Streak Saver's published saved-combo flag |
| Boosters | Accepted player activation label/pulse; opponent activation appears only in the public reveal |
| Transitions | Round-start/completion, clash player/opponent turn and sudden-death banners |
| Finishing move | Longer lunge and gold impact only for a published knockout hit/bonus; voided attacks are omitted |
| Outcomes | Winner rise/scale with gold player-victory burst; loser subdued tilt/fade; outcome-only presentation on Results |

All movement/UI effects use Reanimated. No Rive, particle engine, sound
library, new artwork or additional animation package was needed.

## Engineering and accessibility

- Stable resolution/transition keys and primitive effect dependencies prevent
  the 250 ms battle ticks from restarting animations.
- UI-thread shared values drive motion. Effects are a small, bounded set of
  views, scoped to the current published resolution, not a growing event log.
- Every animation shared value is cancelled on effect cleanup. The idle loop
  stops on outcome, blur, background and unmount. There are no cosmetic
  JavaScript timers or gameplay completion callbacks.
- The existing OS reduced-motion hook is reused, including live preference
  changes. Static damage/booster/combo labels, answer icons, HP numbers and
  settled outcome poses remain; travel, bursts, shaking and loops stop.
- Arena effects have `pointerEvents="none"` and cannot cover answer controls
  outside the clipped arena. Answer wrappers remain touchable; disabled
  states are exclusively the existing gameplay states.
- The arena scales with window height and measured content width. The
  existing scrolling, safe-area-aware `Screen` is retained on both platforms.
- Continue may intentionally truncate cosmetic feedback. Animation is never
  a reason to delay the next question, route or result.
- Expo SDK 58's preset automatically applies the Worklets plugin. No custom
  Babel configuration or platform-specific animation implementation was added.

## Development preview

Open `/battle/animation-preview` in development or use **Animation preview**
on Results. Ten isolated public-view fixtures cover entrance/idle,
attack/hit/answers/combo, shield, booster, round, round bonus, both clash
turns, finishing victory and finishing defeat. Replay and forced
reduced-motion controls are available. The preview does not import the live
store or run the engine; it cannot change a match. System reduced motion
cannot be overridden. Production builds show an explicit unavailable notice.

## Files changed

Added:

- [BattleScene.tsx](../src/components/battle/BattleScene.tsx)
- [FeedbackPulse.tsx](../src/components/battle/FeedbackPulse.tsx)
- [combatFeedback.ts](../src/components/battle/combatFeedback.ts)
- [animationPreviews.ts](../src/components/battle/animationPreviews.ts)
- [useBattleMotion.ts](../src/hooks/useBattleMotion.ts)
- [animation-preview.tsx](../app/battle/animation-preview.tsx)
- [animation-smoke.test.tsx](../tests/battle/animation-smoke.test.tsx)
- This handoff.

Modified:

- [BattleScreen.tsx](../src/components/battle/BattleScreen.tsx)
- [ProgressBar.tsx](../src/components/ui/ProgressBar.tsx) (animation is opt-in;
  existing non-battle bars remain static)
- [result.tsx](../app/battle/result.tsx)
- [routes.ts](../src/navigation/routes.ts)
- [tests/setup.ts](../tests/setup.ts) (upstream Reanimated/Worklets mocks;
  native CSS initialization is skipped in Jest and shared-value identity is
  kept stable)
- [package.json](../package.json), [package-lock.json](../package-lock.json)
- [README.md](../README.md)
- [ART_DIRECTION.md](ART_DIRECTION.md)
- [ASSET_MANIFEST.md](ASSET_MANIFEST.md)

Expo also regenerated ignored `.expo/types/router.d.ts` for the preview
route; the temporary Metro process was stopped after readiness/type checks.

## Dependencies

Added direct runtime dependencies using `npx expo install`:

- `react-native-reanimated` **4.7.1**
- `react-native-worklets` **0.13.0** (required Reanimated runtime)

Versions match the installed SDK's bundled-module recommendations. No SDK
upgrade, Rive or other animation dependencies. Installation reported 45 npm
audit warnings; dependency security remediation was not part of this phase.

## Focused validation and exact results

| Check | Result |
|---|---|
| `npm run typecheck` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0 |
| `npx jest --runInBand tests\battle\animation-smoke.test.tsx tests\components.test.tsx` | 2 suites, 17 tests passed, exit 0; 4 new focused tests plus 13 existing shared-UI checks |
| Expo-preset Babel transform of the three animation files for Android and iOS | Passed, exit 0; all 7 animated-style worklets compiled per platform |
| Temporary Metro readiness | `/status` returned `packager-status:running`; server stopped afterward |

The four new focused checks verify:

- All major fixture states render and schedule their expected Reanimated
  operations; static reduced-motion feedback remains readable and disabling
  motion cancels animation work.
- Extra Time activation, answer submission during idle/feedback, immediate
  Continue during attack feedback and another answer on the next question.
  No pre-reveal correct-option leakage; HP accessibility equals engine HP.
- Timers change from 17 to 16 seconds during booster feedback and from 12
  to 11 seconds on the next question. Background/resume catches up to 10
  seconds, and lifecycle subscriptions are removed on unmount.
- Re-rendering the same resolution does not re-schedule motion; voided hits
  create no cosmetic damage; 360 x 800 and 390 x 844 fixtures keep fighter
  frames smaller than their arena slots.

**These are mocked renderer/scheduling checks, not proof of native frame
rate or pixel-perfect rendering.** No full regression run, comprehensive
animation suite, whole-match test or end-to-end run was performed.

## Screenshots and recordings

None available. `adb devices` returned no connected Android device or
emulator. iOS runtime capture is unavailable on this Windows machine.
No synthetic composition was presented as a native screenshot.

## Known limitations and Phase 8 gaps

- Native iOS/Android frame pacing, Reanimated runtime compatibility, image
  alpha, exact safe areas, touch latency and visual polish remain unverified.
  Babel compilation verifies worklet generation only.
- Verify smaller devices, tall devices, large accessibility fonts, long
  prompts, multi-line fighter/booster labels and clash route replacements on
  both platforms. Compact layout assertions are not native visual QA.
- Verify live OS reduced-motion changes, repeated blur/resume/background
  cycles, real cancellation of native loops and memory use on devices.
- Full matches, all six live booster interactions, simultaneous/bonus
  knockouts, sudden death, forfeit and rapid Continue/result navigation
  need Phase 8 integration/device coverage. Only Extra Time was exercised
  through the live UI here.
- Fast Continue/resume can skip or shorten old cosmetic sequences; gameplay
  state, numeric HP and the textual reveal remain authoritative.
- Fighters are static illustrated layers, not skeletal animations. Existing
  Sylva/Titan selection placeholders are unchanged; no new artwork was made.

**Stopped after Phase 5. Phase 6 has not started; awaiting approval.**
