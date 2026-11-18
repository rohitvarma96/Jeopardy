# VOLT / Arena Protocol

Brain Brawl's original esports visual language. The references inform
composition and energy, not copied logos, characters, illustrations or layouts.

## Direction

**High voltage. Zero noise.** Treat the game as a knowledge-combat broadcast:
large condensed type, signal-red fighter posters, acid-yellow actions, chalk
player cards and near-black equipment panels. Keep the actual questions calm
and readable. Avoid rainbow neon, gratuitous glow, rounded dashboard cards,
fake online statuses, invented rewards and constant animation.

The shared palette and angular surfaces now apply throughout the game. Six
original illustrated adult humans replace the mascot-like vector fighters.
All game screens use fixed viewport layouts; larger collections and documents
use explicit section/item pagination instead of page scrolling. Rules and
local progression remain unchanged.

## Foundations

Source of truth: [volt.ts](../src/theme/volt.ts).

| Token | Value | Role |
| --- | --- | --- |
| Ink | `#15151F` | Page background, readable text on bright surfaces |
| Panel | `#20212C` | Quiet equipment and information surfaces |
| Chalk | `#F1F0E8` | Primary text, identity cards, negative space |
| Signal red | `#FF354F` | Hero posters, emphasis, secondary confirmation |
| Acid yellow | `#E9FF3C` | Primary action, equipped selection, XP |
| Muted | `#AAAAB7` | Secondary information on dark surfaces |
| Border | `#444551` | Thin structural rules |
| Success / error | `#9AE6B4` / `#FF9CA9` | Answer feedback, always with words |

Use ink, not white body text, on red or yellow. Chalk on red is reserved for
oversized decorative lettering. Normal text pairings have automated 4.5:1
contrast checks; selection and outcomes must never rely on color alone.

- **Display:** locally bundled Barlow Condensed ExtraBold. Display 88/82,
  title 52/52, heading 30/32. Scale oversized compositions down on small screens.
- **Technical:** locally bundled Space Mono Regular. Label 12/18, micro 10/16.
  Use for short metadata, never long questions or instructions.
- **Body:** platform system font, 14/21. Preserve device text scaling.
  Decorative headings and navigation chrome cap at 1.3x so primary controls
  remain usable; body content uses the device scale and smaller page capacities.
- **Spacing:** 4, 8, 12, 20, 28, 40. Borders 1 px, square 2 px corners,
  minimum 48 px interactive targets.
- **Geometry:** asymmetric slashes, orbit lines and an original three-strike
  brand mark. Preserve negative space. No borrowed game artwork or weapon art.
- **Motion:** static lobby geometry; immediate pressed and focus feedback.
  No new timers, flashing, autoplay or ongoing animation. Existing reduced-motion
  settings and battle effects are unchanged.

Barlow and Space Mono ship with their SIL Open Font Licenses in
[assets/fonts](../assets/fonts). There are no runtime font downloads or new
package dependencies. Font failures go to the existing Expo error boundary
rather than silently rendering a broken branded screen.

Web initializes the existing Skia renderer before importing Router. `npm install`
and `npm ci` copy CanvasKit from the installed dependency into the ignored
`public/canvaskit.wasm`; an existing installation can run
`npm exec -- setup-skia-web public` once. The WASM file is served locally, not
from a CDN. Native entry remains a direct import of Expo Router.

## Component library

Import from [src/components/volt](../src/components/volt/index.tsx).

| Component | Contract |
| --- | --- |
| `VoltText` | `display`, `title`, `heading`, `body`, `label`, `micro`; semantic tone; heading roles and device text scaling |
| `VoltMark` | Original three-strike mark; decorative, excluded from accessibility |
| `VoltButton` | `primary`, `signal`, `outline`; regular/compact; explicit labels, loading, disabled, pressed and keyboard-focus states |
| `VoltPanel` | `dark`, `chalk`, `signal`; native layout, thin borders |
| `VoltTag` | Neutral, acid or signal label; text accompanies status |
| `VoltSectionLabel` | Numbered technical section labels; light-surface variant |
| `VoltProgress` | Existing validated `ProgressBar` with square acid/ink styling; authoritative accessible values |
| `VoltOption` | Button or radio semantics; selected, correct, incorrect, disabled and keyboard-focus states |
| `VoltMotif` | Static, noninteractive poster geometry built from native views |
| `Screen` | Fixed safe-area-aware viewport, pinned action footer and bottom game navigation |
| `PageDeck` | One active named section, with explicit previous/next controls |
| `PagedItems` | Actual panel height and observed item height determine collection capacity; every item remains reachable |

Use readable sentence case for names and instructions. Uppercase display and
short technical labels only. Ionicons remain generic interface glyphs, not
substitutes for fighter art. Arena uses the existing local Skia fighter rigs.

`ProgressBar` and `PlayerAvatar` retain their existing semantic contracts.
Their `volt` appearance adds square XP/identity treatment. Shared palette and
radius tokens are now aligned with VOLT across all existing UI components.

## Interactive design lab

Run `npm start`, then open **Arena -> Design lab**, or navigate directly to
`/design-lab` in the web build. The route is not an extra bottom tab or game mode.
Its seven fixed sections contain colors, typography, human character art,
button states, surfaces, answer-feedback/reset and selection/result treatments.
Every example is marked as a preview; it never mutates stores,
starts a match or grants rewards. Back respects navigation history and falls
back to Arena on direct entry.

## Arena behavior and layout

- Arena is fixed to the viewport. At 960 px and above with text scale below 1.6,
  the fighter and battle kit sit side by side. Smaller layouts switch between
  Fighter and Battle kit using the pinned footer; Play remains available.
  Fighter art sizes from its measured stage rather than a fixed poster height.
- Identity, XP, balances, saved hero, passive and three saved boosters remain
  authoritative local data. Rank is still explicitly demo data.
- Play follows the existing mode/setup flow. Loading errors and unsaved results
  still block it, with existing visible recovery controls.
- The hero picker still locks unowned fighters, requires explicit equip, persists
  selections, exposes save failures and protects against stale async completion.
- No gameplay, progression, timers, damage, ownership or reward rules change.

## Fixed-screen UX

- Arena and Profile retain the two-tab bottom navigation.
- Setup pins its primary action and exposes Back/Leave match at the bottom;
  leaving clears setup rather than bypassing ownership or prerequisites.
- Profile has Player, Statistics and History sections. Settings separates Name,
  Avatar and Preferences while preserving unsaved identity edits between panels.
- Categories, fighters, powers, history and statistics are paged collections,
  not hidden/clipped long lists. Loadout includes a separate readable power guide.
- Results separate outcome, final scores/HP, each side's statistics and rewards.
- Battle keeps its fixed HUD, answer grid and bottom ability dock. Forfeit still
  requires confirmation; generic navigation cannot silently abandon a live game.
- The design and combat labs use the same fixed/paged controls. No screen imports
  a `ScrollView` or `FlatList`.
- The existing context-specific Back, cancel, retry and save-error behaviors stay
  explicit. Keyboard avoidance remains active for identity editing.

## Focused checks

```sh
npm run typecheck
npm run lint
npm test -- --runTestsByPath tests/volt-design.test.tsx tests/fixed-game-layout.test.tsx tests/arena-lobby.test.tsx tests/components.test.tsx tests/battle/combat-actions.test.ts tests/battle/animation-smoke.test.tsx
```

The design tests cover accessible state, contrast thresholds, demo isolation,
route recovery and Arena controls at 320 px, desktop width and 2x text scale.
Layout tests verify rendering/contracts, not visual fit; verify the latter in
the browser and on devices. The repository-wide type check and some historical
tests still reference retired rounds/clash APIs; these are unrelated existing
blockers, not a reason to change current game rules. Web preview and JavaScript
exports are not native iOS/Android device acceptance.
