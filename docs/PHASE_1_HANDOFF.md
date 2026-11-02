# Phase 1 handoff

## Completed scope

Implemented Phase 1 only, following PH-04, ARC-04, ARC-07, CTX-03, CTX-08
and CTX-09. This handoff follows PH-12.

- Root theme/safe-area providers and Arena, Vault, Profile bottom tabs.
- Typed placeholder routes for mode, mock matchmaking, category draft, fighter
  selection, loadout, battle arena, clash, results, reward reveal and settings.
- Shared buttons, cards, panels, typography, icon slots, progress/health bars,
  badges, loading/empty states and responsive scrolling screens.
- Safe back, preview cancellation, replay, home and Vault return paths.
- Explicit not-found handling. No combat, progression, rewards, persistence,
  backend, payments or artwork production.

The inspected baseline was the working Phase 0 foundation. There is no Git
repository/branch in this workspace. npm, Expo SDK 58, React 19.3 and React
Native 0.88 were preserved; the existing documents were not changed.

## Important decisions

- All routes and example values are explicitly labeled as Phase 1 previews.
  They do not represent real player data or a playable match.
- Expo typed routes are enabled. The SDK's `unstable_settings.anchor` API
  establishes safe entry routes. Placeholder routes carry no invented
  fighter/match IDs; typed ID parameters and validation remain deferred until
  detail models exist.
- Exiting clears the preview stack before switching tabs. Replay returns to
  mode selection without retaining later steps behind it.
- The specified palette remains intact. Added readable secondary text and a
  darker action-purple token for white button labels.
- Ionicons are generic interface icons, not substitute game artwork. Added
  SDK-compatible font/asset loaders and Jest/native testing dependencies only.
- Navigation transitions are static and no sound is played. Loading indicators
  follow live system reduced-motion changes. Preference subscriptions are
  removed on unmount, and a late initial read cannot overwrite a newer event.
- No battle or persistent player/collection state exists. Only the system
  motion preference uses local UI state.
- Jest mocks native font loading, not routes or screens. Real fonts and
  navigation were separately checked on Android.

## Files

### Modified existing files

- [package.json](../package.json), [package-lock.json](../package-lock.json)
- [app.json](../app.json), [tsconfig.json](../tsconfig.json)
- [app/_layout.tsx](../app/_layout.tsx), [app/index.tsx](../app/index.tsx)
- [colors.ts](../src/theme/colors.ts), [spacing.ts](../src/theme/spacing.ts),
  [typography.ts](../src/theme/typography.ts)
- [README.md](../README.md)

### Created files

- Configuration: [jest.config.js](../jest.config.js).
- Theme: [radii.ts](../src/theme/radii.ts), [shadows.ts](../src/theme/shadows.ts),
  [layout.ts](../src/theme/layout.ts), [index.ts](../src/theme/index.ts),
  [navigation.ts](../src/theme/navigation.ts).
- Preference hook: [useReducedMotion.ts](../src/hooks/useReducedMotion.ts).
- Shared UI: [AppText.tsx](../src/components/ui/AppText.tsx),
  [Button.tsx](../src/components/ui/Button.tsx),
  [Surface.tsx](../src/components/ui/Surface.tsx),
  [IconSlot.tsx](../src/components/ui/IconSlot.tsx),
  [Badge.tsx](../src/components/ui/Badge.tsx),
  [ProgressBar.tsx](../src/components/ui/ProgressBar.tsx),
  [States.tsx](../src/components/ui/States.tsx),
  [Screen.tsx](../src/components/ui/Screen.tsx),
  [index.ts](../src/components/ui/index.ts).
- Navigation: [routes.ts](../src/navigation/routes.ts),
  [journey.ts](../src/navigation/journey.ts),
  [exitPreview.ts](../src/navigation/exitPreview.ts),
  [JourneyScreen.tsx](../src/components/navigation/JourneyScreen.tsx).
- Tabs: [_layout.tsx](<../app/(tabs)/_layout.tsx>),
  [arena.tsx](<../app/(tabs)/arena.tsx>),
  [vault.tsx](<../app/(tabs)/vault.tsx>),
  [profile.tsx](<../app/(tabs)/profile.tsx>).
- Journey routes: [mode.tsx](../app/battle/mode.tsx),
  [matchmaking.tsx](../app/battle/matchmaking.tsx),
  [category-draft.tsx](../app/battle/category-draft.tsx),
  [fighter-select.tsx](../app/battle/fighter-select.tsx),
  [loadout.tsx](../app/battle/loadout.tsx),
  [arena.tsx](../app/battle/arena.tsx), [clash.tsx](../app/battle/clash.tsx),
  [result.tsx](../app/battle/result.tsx), [rewards.tsx](../app/battle/rewards.tsx).
- Other routes: [settings.tsx](../app/settings.tsx),
  [+not-found.tsx](../app/+not-found.tsx).
- Tests: [navigation.test.tsx](../tests/navigation.test.tsx),
  [components.test.tsx](../tests/components.test.tsx),
  [reduced-motion.test.tsx](../tests/reduced-motion.test.tsx),
  [setup.ts](../tests/setup.ts).
- Handoff and evidence: this document, the five screenshots listed below, and
  [phase1-android-results.json](qa/phase1-android-results.json).

No existing project files were deleted. Expo generated ignored route-type and
environment declarations. The disposable Android emulator and temporary tool
outputs were removed; Metro was stopped.

## Commands and actual results

Final validation was run after a clean lockfile installation.

| Command/check | Result |
| --- | --- |
| Phase 0 baseline typecheck and lint | Passed before changes. |
| `npm install` | Passed; installed the declared UI and test dependencies. |
| `npx expo install expo-asset expo-font` | Passed; installed SDK-compatible loaders and added their config plugins. |
| `npm ci` | Exit 0; 1,309 packages added, 1,310 audited. Reported 16 advisories: 13 low, 3 high. |
| `npm run typecheck` | Exit 0; no TypeScript errors, including generated Expo route declarations. |
| `npm run lint` | Exit 0; no lint errors or warnings. |
| `npm test` | Exit 0; 3 suites, 32 tests passed, 0 snapshots; final run 7.134 seconds. |
| `npx expo install --check` | Exit 0; `Dependencies are up to date`. |
| VS Code test discovery | Unavailable: 0 test controllers. Used the configured Jest command instead. |
| `npx expo start --localhost --port 8088` | Metro responded with `packager-status:running`; Android bundle loaded successfully. |
| Android UI checks | 11 checks passed; persisted in the linked JSON evidence. |
| `npm audit --omit=dev` | Exit 1; 14 advisories: 11 low, 3 high. Includes the Router/testing optional-peer dependency chain. |

Initial type/test setup failures were resolved: SDK navigation API differences,
missing font/asset loader dependencies, Node's inability to load Metro font
assets, and two incorrect test assumptions about cleared history and
decorative indicators hidden from accessibility queries.

The first cold-launch probe did not foreground Arena. A retry using a plain
explicit Expo URL and `am start -W` reported `LaunchState: COLD` and verified
Arena successfully. Expo Go's initial developer-menu onboarding was dismissed.

## Android evidence and checks

Tested with Expo Go 58.0.5 on an isolated Android 16 / API 36.1 emulator.

- Bottom tabs and Profile -> Settings -> Back.
- Every journey destination and reachable next controls.
- Android hardware Back, matchmaking cancellation and cleared exit history.
- Replay -> mode -> Back -> Arena.
- Reward reveal -> Vault -> Arena.
- Home -> Android Recents -> resume preserved the matchmaking route.
- Both initial and live reduced-motion settings stopped/started the loading
  indicator appropriately.
- Cold launch with device Wi-Fi/mobile data disabled worked through the local
  Metro/ADB connection. This is not a standalone offline APK validation.
- No red screen or fatal application error was observed.
- Screenshots were visually inspected for readable content, safe areas and
  reachable controls.

| Screenshot | Physical pixels | Logical viewport at 480 DPI |
| --- | --- | --- |
| [Arena, small phone](qa/phase1-arena-360x800.png) | 1080 x 2400 | 360 x 800 |
| [Battle UI preview, small phone](qa/phase1-battle-360x800.png) | 1080 x 2400 | 360 x 800 |
| [Arena, reference phone](qa/phase1-arena-390x844.png) | 1170 x 2532 | 390 x 844 |
| [Battle UI preview, reference phone](qa/phase1-battle-390x844.png) | 1170 x 2532 | 390 x 844 |
| [Vault, reference phone](qa/phase1-vault-390x844.png) | 1170 x 2532 | 390 x 844 |

PNG dimensions were measured and checked against both required viewports.

## Asset status

- Integrated: generic UI icon fonts only.
- Missing/deferred: all production fighter, arena, booster, category, reward
  and brand artwork. Artwork integration/inventory belongs to the asset phase.
- Placeholders: explicit text/icon UI slots and static progress/health samples;
  no unrelated or generated artwork was substituted.
- Runtime image dimensions/path issues: none introduced; no game images are
  imported. QA screenshots are evidence, not bundled production assets.

## Risks and limitations

- npm still reports dependency advisories, including the pre-existing
  Expo-toolchain high-severity chain. npm's forced fix would downgrade Expo to
  51.0.39, so it was not applied.
- Settings controls, persistence, player data, combat, questions and reward
  logic remain intentionally unimplemented.
- Detail ID models/validators and motion beyond the loading indicator remain
  deferred to the appropriate approved phases.
- Physical-device, iOS, web and standalone/release APK checks were not run.
  Expo Go development launch still needs Metro to serve JavaScript.
- No source-level navigation defect remains known from the checks performed.

## Acceptance checklist

| PH-04 gate | Status | Evidence |
| --- | --- | --- |
| All routes reachable without crashes/dead ends | Passed | Actual app route tests plus the complete Android journey, back/exit/replay and not-found checks. |
| Bottom tabs work | Passed | Automated and Android Arena/Vault/Profile navigation. |
| Components use consistent design tokens | Passed | Shared theme/primitives, style/value regression tests and visual Android inspection. |
| No combat logic; placeholders intentional | Passed | Only route/UI components exist; explicit preview labels; game and store skeletons remain empty. |

Additional checks: clean install, lint, typecheck, tests, SDK compatibility,
portrait safe areas, both target viewports and reduced motion passed. Standalone
APK/physical-device QA is not tested; the dependency audit remains failed as
documented above.

Stopped after Phase 1; awaiting approval for the next phase.
