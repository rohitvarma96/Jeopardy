# Phase 3 handoff - Arena home and pre-battle journey

## Summary

Phase 3 (PH-06) is implemented. The full journey works offline with local mock
data: Arena Home -> mode -> deterministic mock matchmaking -> category
ban/pick draft -> fighter select (all four fighters) -> loadout (exactly three
distinct boosters) -> battle entry. Fighter and loadout persist in
AsyncStorage, are validated on load and are checked again before battle entry.
Battle screens remain the Phase 2 preview; combat is Phase 4.

## Files

Created:

- Domain: `src/game/types/{fighter,booster,match,player}.ts`,
  `src/game/rules.ts`, `src/game/random.ts` (seeded shuffle).
- Local data: `src/data/{fighters,boosters,categories,modes,opponents,player}.ts`.
- Logic: `src/features/category-draft/draft.ts`, `src/features/loadout/loadout.ts`.
- State: `src/store/player-store.ts` (persisted selections),
  `src/features/match-setup/store.ts` (transient match setup and validation).
- Service: `src/services/mock-matchmaking.ts` (interface + offline mock).
- UI: `src/components/ui/SelectableCard.tsx`,
  `src/components/fighters/FighterArt.tsx`,
  `src/components/navigation/MatchSetupScreen.tsx`.
- Tests: `tests/pre-battle/rules.test.ts`, `tests/pre-battle/journey.test.tsx`.
- Docs: `docs/GAMEPLAY_DECISIONS.md`, this file.

Rewritten (Phase 1 placeholders replaced): `app/(tabs)/arena.tsx`,
`app/battle/{mode,matchmaking,category-draft,fighter-select,loadout}.tsx`.

Modified: `package.json`, `package-lock.json`, `app/_layout.tsx` (hydrates
selections), `src/assets/registry.ts` (`fighterArt` map),
`src/components/ui/Screen.tsx` (`exitLabel`, `onExit`, optional preview
badge), `src/components/ui/index.ts`, `src/navigation/journey.ts`
(descriptions), `src/components/navigation/JourneyScreen.tsx` (now only the
four preview steps), `tests/setup.ts`, `tests/navigation.test.tsx`,
`docs/ASSET_MANIFEST.md`, `README.md`.

Deleted: none.

## Key decisions

- Zustand stores. Persistence uses manual AsyncStorage load/save instead of
  the persist middleware, so hydration failures and repairs are explicit.
  Match state is transient and separate from player data (ARC-04).
- Matchmaking sits behind `MatchmakingService`; the mock is offline, 1.2 s,
  abortable and seed-deterministic.
- Draft-to-round mapping, AI strategy, seed rotation, persistence format and a
  **passive proposal awaiting approval** are recorded in
  `docs/GAMEPLAY_DECISIONS.md`.
- Selected state uses a gold border plus a visible "Selected" checkmark and
  radio/checkbox accessibility state; unavailable options are disabled with
  text reasons.

## Commands and exact results

| Command | Result |
|---|---|
| `npx expo install @react-native-async-storage/async-storage zustand` | Added async-storage 2.2.0 (SDK-pinned) and zustand ^5.0.16; npm reported 45 vulnerabilities (1 low, 42 moderate, 2 high), not addressed |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm test` | 5 suites passed, 53 tests passed, exit 0; no act/console warnings |
| `npx expo install --check` | "Dependencies are up to date", exit 0 |
| `npx expo export --platform android --platform ios` (temp dir, deleted) | Android bundled 1232 modules; iOS bundled 1239 modules; exit 0 |

The tests use the package's in-memory AsyncStorage mock. They cover the full
journey with a simulated cold restart (state cleared, storage kept), cancel,
back and leave, direct-entry guards, draft/loadout rules, corrupt or partial
storage, and storage read/write failures.

## Screenshots and manual checks

None. No emulator, simulator or device run was done in this phase. Evidence is
automated tests plus native JS bundle export.

## Asset status

- Integrated (NEEDS_REVIEW): Arcane and Shadow full-body art, now also shown
  on Arena Home, in Fighter select and on the matchmaking opponent card.
- Placeholder: `fighter.sylva.full` and `fighter.titan.full`, shown as labeled
  UI frames ("Placeholder art pending"). Required spec and dependent screens
  are listed in `docs/ASSET_MANIFEST.md`. No file paths were invented.
- Category and booster cards use generic Ionicons plus text (disclosed).
  Portraits are not used. No new image files were added.

## Known risks and limitations

- Device AsyncStorage persistence, layout, art legibility at card sizes, and
  Android hardware Back are **not verified on a device**.
- Android hardware Back from matchmaking leaves stale transient setup state.
  It is harmless: `Find opponent` always resets it.
- The seed restarts at 1 on every launch, so the first opponent is always
  NightQuill.
- Battle entry still shows the fixed Arcane vs Shadow preview; selections
  are not used in battle until Phase 4.
- Passives are display-only proposals; the sudden-death category is deferred.
- The npm audit findings from the dependency tree are unreviewed.

## Acceptance checklist (PH-06)

| Gate | Status | Evidence |
|---|---|---|
| Home-to-loadout flow is navigable | Passed (automated) | `journey.test.tsx` full-flow test |
| Back/cancel works | Passed (automated) | cancel/back/leave test; guard tests; `navigation.test.tsx` |
| Draft and loadout constraints enforced | Passed (automated) | `rules.test.ts`; disabled 4th booster and banned categories in journey test |
| No online matchmaking or network dependency | Passed | Offline mock service; no `fetch`/HTTP/WebSocket in `src` or `app` |
| Fighter/loadout persisted and validated before battle | Passed (automated); device not tested | Restart test; `validateMatchSetup` tests |

## Platform verification

- iOS: **NOT TESTED** on simulator or device (Windows machine, no Mac or iOS
  hardware). Only the JS bundle export succeeded.
- Android: **NOT TESTED** on emulator or device in this phase. Only the JS
  bundle export succeeded. An emulator smoke test (Expo Go SDK 58) can be run
  on request.
- No platform-specific code was added.

Stopped after Phase 3; awaiting approval for the next phase.
