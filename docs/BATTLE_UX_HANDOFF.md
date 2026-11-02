# Battle UX redesign

Scope: arena-first battle presentation only. No engine, damage, AI, booster
eligibility, persistence, dependency or artwork changes. No unrelated Phase 8
work. Implementation is ready for visual review; native iOS acceptance is open.

## Power dock update

The current dock replaces the historical six-slot layout below with one row of
the three equipped, battle-compatible powers. Cards use distinct accent borders,
tinted icon tiles and READY labels. Activation immediately greys the card,
icon and text and disables it for the match, including on the activation question.
Pending effects show USED / ARMED while remaining grey. Other temporarily
unavailable powers show WAIT without looking consumed. Unequipped powers and
Second Chance are omitted. Compact cards retain a 48-pixel minimum touch height.

The screenshots and verification counts below describe the earlier six-slot
implementation, not this update. Focused dock coverage is in
[booster-dock.test.tsx](../tests/battle/booster-dock.test.tsx).

Update verification: 22 focused tests pass across Android/iOS Jest presets;
changed-code ESLint passes. TypeScript still reports the same 115 pre-existing
test diagnostics, with none added by this update. Native visual acceptance
has not been repeated for the new cards.

## Before and after

| Before | After |
| --- | --- |
| Scrolling screen plus separately scrolling answer footer | One safe-area layout with no active-gameplay scroll container |
| Large heading, instructions and fighter cards | Compact category/round/question row, identities, numeric HP and animated bars |
| Arena below question content and boosters | Dedicated arena above the question, explicit background/fighter/effect/feedback layers |
| Boosters inside scrolling question content | Fixed six-slot dock; equipped/ready, used, armed and unavailable states |
| Stacked event history and redundant Continue | Arena damage numbers, answer feedback and compact two-sided resolution summary |

The active screen was checked at 390x844 first, then adapted to compact, tall,
locked and resolved states. Existing Arcane, Shadow and arena assets are reused.
Entrance, idle, attacks, hit reactions, finishers and reduced-motion behavior
continue to consume the existing public battle view.

### Responsive and interaction policy

- Standard view: four vertical answers, three-column/two-row dock.
- Below 700 usable pixels, above 1.15 font scale, or with prompts longer than
  115 characters: compact HUD and two-column answers. Questions are not truncated.
- Below 620 usable pixels or with increased font scale: all six abilities in
  one row with short labels. Full names, effects and states remain accessible.
- Arena decoration gives space to content first, retaining an 80-pixel arena
  minimum. Its decorative banner disappears when there is insufficient height.
- Answer/ability controls retain a 48-pixel minimum height; the six-column dock
  has approximately 53-pixel-wide targets at the tested 360-pixel width.
- Font scaling is supported, but capped per battle text element: up to 1.4 for
  questions/answers, 1.3 for HUD/status, and 1.25 for ability labels. A device
  setting of 2 therefore does not double every battle label.
- The three-booster loadout rule is unchanged. All six types are shown, but
  unequipped boosters cannot activate. Short-dock `Off` means not equipped.
- A locked answer remains selected; correctness is not exposed prematurely.
  Second Chance is activated in the dock; Keep answer remains available.
- The existing automatic 2.2-second reveal is unchanged. Continue is retained
  only for resolved state without an automatic deadline. View result and
  forfeit confirmation remain available in their appropriate states.

## Screenshots and native evidence

Android 16 / API 36, disposable Pixel 7-profile emulator, Expo Go SDK 58,
480-DPI override (3 physical pixels per logical pixel). These are **Android**
captures, not iPhone screenshots. The floating gear/Tools bubble belongs to
Expo Go, not the battle HUD.

| Capture | Logical size | Physical PNG size |
| --- | --- | --- |
| [Active question](qa/battle-ux-active-390x844.png) | 390x844 | 1170x2532 |
| [Answer locked](qa/battle-ux-locked-390x844.png) | 390x844 | 1170x2532 |
| [Resolved, both hits and HP changes](qa/battle-ux-resolved-390x844.png) | 390x844 | 1170x2532 |
| [Extra Time activated](qa/battle-ux-booster-390x844.png) | 390x844 | 1170x2532 |
| [Short screen](qa/battle-ux-active-360x640.png) | 360x640 | 1080x1920 |
| [Tall screen](qa/battle-ux-active-430x932.png) | 430x932 | 1290x2796 |
| [165-character question](qa/battle-ux-long-390x844.png) | 390x844 | 1170x2532 |
| [Same long question, short screen](qa/battle-ux-long-360x640.png) | 360x640 | 1080x1920 |
| [Device font scale 2](qa/battle-ux-font2-390x844.png) | 390x844 | 1170x2532 |

Normal native setup, answers, locked/revealed states, opponent damage and
automatic transitions were exercised first. The reference active capture is
from normal setup after removing all QA routes. The other captures use
controlled manual-engine states through a temporary development-only route
rendering the same BattleScreen. The long prompt is synthetic. The Extra Time
capture follows an actual native tap and shows 16 seconds plus the consumed
ability state. The resolved fixture shows both fighters at 87 HP and two
13-damage effects; it is not a completed live match.

The temporary route was removed before final validation. No QA entry point or
timer override ships with the implementation. Early compact/font-layout
captures exposed overflow; the compact answer/dock variants corrected it.
Final captures show the complete question, four answers and all six slots.

## Verification

- TypeScript: PASS.
- ESLint on changed components and tests: PASS, no warnings.
- Focused iOS and Android Jest projects: **12 suites / 270 tests PASS**
  (135 tests per platform; native APIs/motion mocked).
- Covers no-scroll structure, safe-area edges, control minimums, long text,
  removed answers, booster restrictions, retry/keep, locked state, manual and
  automatic continuation, clock background/resume, HP and combat cues.
- Existing engine/view tests and complete win/loss integration journeys reused.
  No full Phase 8 suite, dependency installation or native rebuild performed.

```powershell
npm run typecheck
npx eslint src\components\battle src\components\ui\ProgressBar.tsx tests\battle\layout.test.tsx tests\battle\animation-smoke.test.tsx tests\pre-battle\journey.test.tsx
npx jest --config jest.platforms.config.js --runInBand --runTestsByPath tests\battle\layout.test.tsx tests\battle\animation-smoke.test.tsx tests\components.test.tsx tests\pre-battle\journey.test.tsx tests\battle\engine.test.ts tests\battle\view.test.ts
```

## Components and files

New:
- [BattleHUD](../src/components/battle/BattleHUD.tsx): compact identities/HP/progress.
- [BattleQuestion](../src/components/battle/BattleQuestion.tsx): timer, prompt and answers.
- [BoosterDock](../src/components/battle/BoosterDock.tsx): persistent responsive abilities.
- [Layout tests](../tests/battle/layout.test.tsx).

Modified:
- [BattleScreen](../src/components/battle/BattleScreen.tsx): fixed layout, lifecycle wiring,
  question status, compact resolution and modal.
- [BattleScene](../src/components/battle/BattleScene.tsx): measured arena sizing,
  explicit layers, compact fighter sizing and bounded feedback typography.
- [FeedbackPulse](../src/components/battle/FeedbackPulse.tsx): optional layout style.
- [ProgressBar](../src/components/ui/ProgressBar.tsx): optional hidden visual labels;
  accessible labels/values and existing default presentation remain unchanged.
- [Animation/clock tests](../tests/battle/animation-smoke.test.tsx) and
  [journey tests](../tests/pre-battle/journey.test.tsx).
- [README](../README.md), this handoff and the nine PNGs above.

## Remaining validation / polish

- Native iOS, notch/Dynamic Island/home-indicator behavior, physical devices,
  release-build performance/FPS and VoiceOver/TalkBack remain unverified.
  iOS Jest is not native iOS rendering evidence.
- Native timer background/resume precision and every booster/finisher combination
  were not re-exercised; relevant existing mocked tests pass.
- Extremely narrow screens, arbitrary-length future content, and maximum font
  scale combined with the longest question on the smallest screen are not
  exhaustively covered. The tested long/short layout deliberately gives most
  space to reading and controls, so fighters are smaller.
- Android font-size changes can reload Expo Go/navigation. Captures were taken
  after reopening the fixture; seamless configuration-change continuity is not
  claimed. Expo Go screenshots are not a standalone release-build sign-off.
- Next: native iOS comparison, physical touch/readability review and measured
  animation smoothness. No additional artwork is needed.
