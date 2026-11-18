# Grounded combat and reward chests

## Implemented surfaces

- The game uses an original illustrated **Relay fight stage**: one continuous
  horizontal platform, shared ground contact, distant city, industrial framing
  and a central signal reactor. The camera preserves the vertical floor position.
- `HumanCombatArt` renders the **exact six painted selection illustrations on
  weighted Skia meshes**, not simplified vector substitutes or a rigid PNG.
  Source-specific shoulders, elbows, wrists, hips, knees, ankles, torso and head
  articulate while painted faces and equipment retain the selection identity.
- Inverse kinematics keeps stance/support feet planted. Attack includes a
  short step/lunge; the power kick chambers the knee before extension.
  Recoil stays articulated. KO now holds a short upright last-hit recoil, then
  vaporizes the original painted alpha; no downed-body pose or KO zoom-out is
  scheduled by the active presentation.
- Existing action duration/contact timestamps drive animation. A short cosmetic
  contact hold does not pause or change the battle timer.
- Published hits produce Bangers action lettering: **STRIKE**, **BLOCK**, **KO**.
  A void/zero-damage hit does not invent a strike. KO requires an actual finishing
  event; blocked hits are not presented as damaging strikes.
- A signature signal rises inside the fight region into the actual painted
  hand/foot, followed by a short limb-anchored smear and ink contact. There is
  one dominant word per contact beat; blocks use compression, not a damage burst.
- KO uses a source-local Skia shader, an emissive breakup edge and 32 offline
  opaque/source-colored anchors per Brawler. Body disappears by 650 ms after
  contact, fragments settle by 1 second, with a fading ground shadow. Both losing
  sides, reduced motion and same-event blur/resume retain absence.
- During resolution, the fight region receives more space and a compact correct
  answer strip replaces the inactive answer grid. The normal question layout
  returns for the next exchange. Progression still uses the existing reveal time.

The human rig uses painted mesh animation, not a new frame-by-frame or 3D
animation set. Selection and fight now share one source registry. Rest-pose
mapping is undistorted; extreme cloth/occlusion work remains a separate polish pass.

Results now use the actual saved winner's original painting and a bounded
VICTORY/DEFEAT composition instead of a small collapsed-fighter scene. Latest
saved account XP interpolates to real final values; level transitions are saved
receipt facts. History/repeated result entry and forfeits do not replay an earned
celebration. Footer commands remain immediately usable after the existing grant.

Rebuild after changing source paintings:

```powershell
python .\scripts\build-painted-coverage.py
python .\scripts\build-brawler-fragments.py
node .\scripts\build-combat-study.cjs
```

## Four physical chest families

| Family | Shape and materials | Runtime states |
| --- | --- | --- |
| Field | Slim graphite smart shell, flush red lock and precise acid strip | Closed pressure / held breath / open release / discovery |
| Arc | Faceted ivory shell, sloped lid and recessed violet indicator | Closed pressure / held breath / open release / discovery |
| Overdrive | Aerodynamic red/carbon hardware, integrated vents and acid LED rails | Closed pressure / held breath / open release / discovery |
| Sovereign | Midnight monolithic shell, champagne titanium trim and cyan seam | Closed pressure / held breath / open release / discovery |

The eight original paintings under
[assets/images/chests](../assets/images/chests) are now used directly, matching
**Experience Board / 06 Chest / Discovery Ritual**. The user-selected reference,
not the earlier reconstructed lid geometry, is the active visual contract.
The [Brain Brawlers identity pass](BRAIN_BRAWLERS_IDENTITY.md) replaces the
older treasure-trunk construction with modern tech hardware.

Containment Break replaces the rejected crystal/ribbon treatment. A shared
**3200 ms** clock grades the room, holds the visually closed chest under pressure,
pauses for **250 ms**, releases the original open painting, emits mouth-anchored
smoke and reveals the actual saved reward in the same stage.
Identity appears from 2200 ms; actions/receipt from 2650 ms; the canvas releases
at 3200 ms without another entrance or camera reset.

There is no pre-open vapor. Rear plumes sit behind the lid; tapered front plumes
are rooted at each source-specific mouth and masked by the repainted front rim.
The original raster material has internal shade/light and bounded texture
advection. It is stylized volume, not a fluid simulation. No crystal, loot beam,
new lid geometry or character deformation is involved.

Chest/smoke/seam and actual incoming reward art gate the clock. Family and item
changes invalidate old readiness, and the static chest remains visible while
loading. Its initial placement/brightness matches the native painting.
A real chest stays closed during a pending/failed save. Repeated taps cannot
accelerate the sequence or grant again. Reduced motion shows the saved outcome
immediately, and blur/background or practice controls settle safely without
catching up an old effect.

For an isolated closed/open inspection with no incoming reward, the same
autonomous sequence keeps the open chest visible at the end.

`ChestRitual` reproduces the Relay background, percentage-based placement,
UNLOCK THE LATCH typography, full-body Brawler/EQUIP composition and faded
grayscale duplicate with the actual saved shard amount. The backdrop derives
from the board's SVG and vignette; rebuild it and grayscale derivatives with
`node scripts/build-chest-ritual.cjs`. The old layered renderer remains only a
superseded study and is not imported by the active chest.

Failed persistence leaves the reward unopened with visible recovery. Repeated
taps cannot request another grant; stale/unmounted animation callbacks cannot
reveal a different chest. Already-opened records show the saved discovery
without another opening or grant.

Families are **container designs, not four rarity tiers**. The family is selected
deterministically from a separate cosmetic seed. Existing rarity odds remain
common 70%, rare 25%, epic 5%; duplicate shards remain 5/15/40.
The internal `Capsule`, `record.capsule`, `openCapsule` and storage schema names
remain for save compatibility. User-facing presentation uses chests.

## Review the implementation

- App: **Vault -> Practice** provides Field, Arc, Overdrive and Sovereign chests
  immediately, even with no matches. Tap the latch; use the info control for
  family selection, Reset study and Preview duplicate. Open again resets the
  closed scene after discovery, matching the board's Reset study.
  An empty Vault defaults to Practice; pending real rewards default to Earned.
  Practice uses the same ritual with the board's Nightblade and +15 rare-duplicate
  examples for every family, without writes to inventory, currency or records.
  Its disclosure and non-mutating Equip preview distinguish examples from actual
  earned items. Families do not imply a particular reward.
- App: **Arena -> Design lab -> Chest forge** retains closed/open inspection,
  open-state hold and reset without modifying inventory.
- App: **Combat atelier** (`/battle/animation-preview`) uses the real Skia human
  rig. Power Kick is the presentation name for the existing `special` action,
  not a new ability or damage calculation.
- [Portable motion study](COMBAT_STUDY.html): strike, power kick, block, KO,
  replay, reset, reduced motion and a pose-time scrubber.
- [Experience board](GAME_EXPERIENCE_BOARD.html): embeds that motion study,
  provides the four-family chest selector, and shows every closed/open design.

The portable study uses the **same TypeScript anatomy, skin weights, motion
sampler and original textures as the game**. Its Canvas 2D triangle preview is
for review; the live game uses the Skia GPU texture/vertex renderer.
Rebuild after editing the shared source:

```powershell
node .\scripts\build-combat-study.cjs
```

Its scenarios are synthetic fixtures and never connect to player/battle stores.
Reading mode stays calm; resolution expands the stage. KO remains absent until
explicit reset/replay. The portable Canvas 2D study uses a triangle-alpha
approximation of the shared dissolve field; the game uses the per-pixel Skia
shader. Both share KO timings and source-colored anchor data. Reduced motion
shows a meaningful static result. The host can preview motions through a narrowly scoped frame
message; there is no remote data, reward grant or game-state mutation.

## Verification

The initial signature combat slice passes ten affected suites / 157 tests,
application/affected-test types, lint and final production web/Android/iOS Hermes
exports. Real GPU captures cover all six Brawler dissolve materials and either
losing side. Former loser-region pixels remain unchanged after motion/focus
resume. A production eight-question duel verifies actual saved level progression,
compact victory/forfeit layouts, result reload and the protected chest loop.
The development static-export mode reported an unknown module and is not claimed
as verified; production web acceptance passed. Physical-device performance QA
remains separate.

After modifying the painted PNGs, first run
`python scripts/build-painted-coverage.py` to regenerate exact alpha coverage.

Focused tests cover undistorted texture mapping for all six Brawlers, rigid face
proportions, source identity parity, finite joint trajectories, shoulder/elbow movement, knee
chamber/extension, ankle change, exact stance/support-foot ground contact,
contact hold, historical collapse-sampler math, truthful impact labels, stable family selection,
all eight chest states, unchanged preview stores, save failure, retry and duplicate
grant prevention. Chest-specific tests cover exact painted sources and layout
percentages, 650/800/250 ms timings, art/save/layout gates, completion-once, cancellation,
motion initialization, replay, all four practice discoveries, grayscale duplicates,
real explicit equip and parent settlement/reveal ordering. The old lid-geometry
tests cover the retained study, not a claim that the active sequence uses it.
Existing combat, Arena and design tests also run.

```powershell
npm test -- --runTestsByPath tests\chest-breach.test.tsx tests\chest-opening.test.tsx tests\chest-ritual.test.tsx tests\chest-discovery.test.tsx tests\combat-chests.test.tsx tests\world-experience.test.tsx tests\navigation.test.tsx
npm run lint
```

For the reference-state pass, six suites / 70 tests passed, as did application
and affected-test types and repository lint. Isolated browser captures compare
all four closed/open/discovery scenes directly with the board. Checks include
the 650 ms hold, duplicate/reset/equip preview, system reduced motion, 320 x 568
layouts and byte-for-byte unchanged practice data. A real eight-question duel
verified durable settlement before discovery and unchanged saved data after
settled-record reload. Android/iOS Hermes exports use the original eight chest
paintings and reference scene derivatives, not the superseded layer rig.

For Relay Breach, seven suites / **79 tests passed**, plus application/affected
test types, affected-file lint and final production web/Android/iOS exports.
Real browser checks verify all four effect handoffs, one active canvas and its
release, no practice writes, compact layout, reduced motion and family/control
cancellation. New/duplicate/power earned receipts and save failure/retry remain
covered by actual store-backed tests. This is not a new native-device FPS claim.

The application and new tests type-check. The repository-wide check still includes
historical tests that reference retired rounds/clash APIs; this change does not
rewrite those unrelated gameplay expectations. Android/iOS JavaScript/Hermes
exports are not physical-device or native build acceptance.
