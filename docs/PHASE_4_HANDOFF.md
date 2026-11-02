# Phase 4 handoff - Battle engine and battle interface

## Summary

Phase 4 (PH-07) is implemented. A complete offline match runs against the
deterministic mock opponent, using the fighter, loadout and draft from the
Phase 3 journey.

Match structure:

- 5 rounds. Each round is 3 simultaneous 12 s questions, then round bonuses,
  then a clash turn for each player.
- Tied HP after round 5 goes to sudden death.

Rules implemented:

- Speed-based damage, the 40-per-round cap, round-winner and perfect-round
  bonuses.
- Clash initiative from the seed, alternating each round.
- All six boosters, fighter passives, and combo tracking.
- Knockouts and forfeit.

The engine is pure TypeScript and fully deterministic per seed. It takes
timestamped actions and never reads the clock.

## Files

Created:

- Engine: `src/game/battle/{types,rules,damage,combo,boosters,questions,opponent,engine,view,index}.ts`.
- Data and types: `src/data/questions.ts` (64 questions: 8 per category,
  3 easy / 3 medium / 2 hard), `src/game/types/question.ts`.
- Runtime: `src/features/battle/{store,useBattleClock,session}.ts`.
- UI: `src/components/battle/{BattleScreen.tsx,battleText.ts}`.
- Tests: `tests/battle/{helpers.ts,damage.test.ts,engine.test.ts,opponent.test.ts,questions.test.ts,view.test.ts}`.
- Docs: this file.

Rewritten: `app/battle/{arena,clash,result}.tsx`. These are the live battle
and result screens; they replace the Phase 1/2 previews.

Modified:

- `app/battle/loadout.tsx` (starts the battle).
- `src/game/types/match.ts`, `src/data/opponents.ts` (opponent loadouts).
- `src/features/category-draft/draft.ts`, `src/features/match-setup/store.ts`
  (sudden-death category).
- `src/game/random.ts`.
- `src/components/navigation/JourneyScreen.tsx` (now the rewards preview only).
- `src/navigation/journey.ts`.
- `tests/setup.ts`, `tests/navigation.test.tsx`.
- `docs/GAMEPLAY_DECISIONS.md`, `docs/ASSET_MANIFEST.md`, `README.md`.

Deleted: `src/components/battle/BattleAssetPreview.tsx`.

## Key decisions

All rule interpretations are recorded in `docs/GAMEPLAY_DECISIONS.md`
(Phase 4 section).

- Your decisions: a clash after **every** round, passives enabled, and combo
  tracked only (it adds no damage).
- Simultaneous answers:
  - A question resolves exactly once, when both players are final.
  - The faster correct answer strikes first; equal times go to the initiative
    holder.
  - A knockout voids any later hit, so there are no draws.
- Mock opponent:
  - Its plan for each question is fixed when the question opens, from public
    information only.
  - It acts through the same validated actions as you.
- No answer leakage: the view hides the correct option, the opponent's choice,
  its clash question and its boosters until each question resolves.
- Battle state is transient. An app restart abandons the match.
- Timers keep running in the background. On resume the timer catches up
  immediately.

## Commands and exact results

| Command | Result |
|---|---|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npx jest --runInBand` | 10 suites passed, 225 tests passed, exit 0 (173 of them are new battle tests) |
| `npx expo install --check` | "Dependencies are up to date", exit 0 |
| `npx expo export --platform android --platform ios` (temp dir, deleted) | Exported successfully, exit 0 |

No dependencies were added.

## Screenshots and manual checks

None. No emulator, simulator or device run was done. The evidence is the
automated tests plus the native JS bundle export.

## Asset status

No new images. The battle screen uses the arena background and Arcane/Shadow
art; Sylva and Titan still show labeled placeholders. Details are in
`docs/ASSET_MANIFEST.md`.

## Known risks and limitations

- **Not covered by automated tests** (skipped to keep cost down; can be added
  on request):
  - the clock hook (`useBattleClock`);
  - the store's reveal and auto-advance timing;
  - the battle-screen UI flows: answering, 50:50, Second Chance, forfeit,
    result, Play again;
  - a whole-match simulation.

  The engine underneath is fully tested. The pre-battle journey test reaches
  `/battle/arena` after loadout.
- Layout, art, timer smoothness, background/resume and Android hardware Back
  (opens the forfeit prompt) are **not verified on a device**.
- XP, coins and rewards are not granted (later phase). Animations are basic
  (Phase 5).
- The seed restarts at 1 on every launch (from Phase 3). The npm audit
  findings are still unreviewed.

## Acceptance checklist (PH-07)

| Gate | Status | Evidence |
|---|---|---|
| Tests cover win/loss, simultaneous damage, timeouts, caps, clash, sudden death, boosters, zero HP | Passed (automated) | `engine.test.ts`, `damage.test.ts` |
| No negative HP | Passed (automated) | HP-floor tests in `engine.test.ts` and `damage.test.ts` |
| No duplicate resolution | Passed (automated) | Single-resolution and ordering tests in `engine.test.ts` |
| No answer leakage | Passed (automated) | `view.test.ts` |
| No timer leaks | Implemented, **not tested** | `useBattleClock.ts` clears its interval on unmount, when the app goes to the background and when the clock is disabled; no automated clock test |
| Complete local match playable repeatedly | Engine: passed (automated full matches). UI: implemented, **not verified** by a UI test or on a device | `engine.test.ts` match-end tests; `Play again` resets the battle and match stores |
| Six boosters with windows, once per match, conflicts | Passed (automated) | `engine.test.ts` boosters section, `opponent.test.ts` |
| Seeded fixtures across 8 categories; deterministic opponent | Passed (automated) | `questions.test.ts`, `opponent.test.ts` |

## Platform verification

- iOS: **NOT TESTED** on a simulator or device (Windows machine). Only the JS
  bundle export succeeded.
- Android: **NOT TESTED** on an emulator or device. Only the JS bundle export
  succeeded.

Stopped after Phase 4; awaiting approval for the next phase.
