# Grounded combat and reward chests

## Implemented surfaces

- The game uses an original illustrated **Relay fight stage**: one continuous
  horizontal platform, shared ground contact, distant city, industrial framing
  and a central signal reactor. The camera preserves the vertical floor position.
- `HumanCombatArt` renders a **jointed human vector rig**, not a transformed PNG.
  Shoulders, elbows, wrists, hips, knees, ankles, torso and head articulate.
  Six face/hair/clothing palettes retain the roster IDs and abilities.
- Inverse kinematics keeps stance/support feet planted. Attack includes a
  short step/lunge; the power kick chambers the knee before extension.
  Recoil and a held articulated collapse replace whole-image tilting. The KO
  camera pulls back to keep the downed body inside compact arena bounds.
- Existing action duration/contact timestamps drive animation. A short cosmetic
  contact hold does not pause or change the battle timer.
- Published hits produce Bangers action lettering: **STRIKE**, **BLOCK**, **KO**.
  A void/zero-damage hit does not invent a strike. KO requires an actual finishing
  event; blocked hits are not presented as damaging strikes.
- During resolution, the fight region receives more space and a compact correct
  answer strip replaces the inactive answer grid. The normal question layout
  returns for the next exchange. Progression still uses the existing reveal time.

The human rig is a working faceted/vector animation implementation, not a claim
that a finished painterly, frame-by-frame or 3D character animation set exists.
Non-battle screens retain the original adult human concept illustrations.

## Four physical chest families

| Family | Shape and materials | Runtime states |
| --- | --- | --- |
| Field | Low graphite steel, red straps, square latch, chalk corners | Closed / open |
| Arc | Ivory ceramic arch lid, dark frame, violet crystal lock | Closed / open |
| Overdrive | Heavy industrial body, red braces, vents, acid light rails | Closed / open |
| Sovereign | Obsidian, warm-gold armor, beveled lid, ruby signal crest | Closed / open |

Eight original painted state images are bundled under
[assets/images/chests](../assets/images/chests). Closed and open images are
concept-matched pairs, not a fully segmented lid/base animation source.
The live chest opens only after reward settlement succeeds. Failed persistence
leaves it closed, with visible recovery; retry and reopening preserve the existing
exactly-once reward behavior.

Families are **container designs, not four rarity tiers**. The family is selected
deterministically from a separate cosmetic seed. Existing rarity odds remain
common 70%, rare 25%, epic 5%; duplicate shards remain 5/15/40.
The internal `Capsule`, `record.capsule`, `openCapsule` and storage schema names
remain for save compatibility. User-facing presentation uses chests.

## Review the implementation

- App: **Arena -> Design lab -> Chest forge** previews all eight chest states
  without modifying inventory.
- App: **Combat atelier** (`/battle/animation-preview`) uses the real Skia human
  rig. Power Kick is the presentation name for the existing `special` action,
  not a new ability or damage calculation.
- [Portable motion study](COMBAT_STUDY.html): strike, power kick, block, KO,
  replay, reset, reduced motion and a pose-time scrubber.
- [Experience board](GAME_EXPERIENCE_BOARD.html): embeds that motion study,
  provides the four-family chest selector, and shows every closed/open design.

The portable study uses generated JavaScript from the **same TypeScript geometry
and motion sampler as the game**, not a separate PNG animation approximation.
Rebuild after editing the shared source:

```powershell
node .\scripts\build-combat-study.cjs
```

Its scenarios are synthetic fixtures and never connect to player/battle stores.
Reading mode stays calm; resolution expands the stage. KO remains down until
reset/replay. Reduced motion skips intermediate movement and shows a meaningful
static result. The host can preview motions through a narrowly scoped frame
message; there is no remote data, reward grant or game-state mutation.

## Verification

Focused tests cover finite joint trajectories, shoulder/elbow movement, knee
chamber/extension, ankle change, exact stance/support-foot ground contact,
contact hold, persistent collapse, truthful impact labels, stable family selection,
all eight chest states, unchanged preview stores, save failure, retry and duplicate
grant prevention. Existing combat, Arena and design tests also run.

```powershell
npm test -- --runTestsByPath tests\combat-chests.test.tsx tests\battle\animation-smoke.test.tsx tests\battle\combat-actions.test.ts tests\arena-lobby.test.tsx tests\volt-design.test.tsx tests\fixed-game-layout.test.tsx
npm run lint
```

The application and new tests type-check. The repository-wide check still includes
historical tests that reference retired rounds/clash APIs; this change does not
rewrite those unrelated gameplay expectations. Android/iOS JavaScript/Hermes
exports are not physical-device or native build acceptance.
