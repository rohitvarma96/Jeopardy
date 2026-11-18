# The Relay / Scene-based game implementation

## What is now real

The five-destination world and shorter match loop are implemented in the app,
not only in the visual board:

**Arena -> local AI acquisition -> ban/pick -> VS readiness -> duel ->
saved result -> earned chest -> discovery -> Arena/Vault.**

There are no mandatory mode, fighter-confirmation or loadout-confirmation pages
when the saved preparation is valid. Those old URLs remain safe redirects.

## World destinations

| Destination | Actual interaction |
| --- | --- |
| Arena | A full-body equipped Brawler in the Relay, real XP/resources, three inspectable power sockets, AI Duel selector and deployment sigil |
| Brawlers | Direct six-portrait gallery, large selected Brawler, owned/locked/equipped states, passive inspection and explicit persistent equip |
| Armory | Three physical sockets; select socket, inspect a power, commit a one-for-one replacement; no duplicate powers or unowned/incompatible equips |
| Vault | Earned chests plus four repeatable Practice chests; inspect any pending real record without losing it, or test all four families without account changes |
| Career | Direct Progress / Record / Milestones tabs; real account stats, selected-Brawler usage and permanent recognition derived from saved records |

Five original sigils and short labels replace the Arena/Profile application
tabs. Settings stays in the scene's upper edge. World navigation disappears
during queue/draft/VS/battle; match controls own those scenes.

Legacy `/profile` resolves to Career, `/battle/mode` to Arena,
`/battle/fighter-select` to Brawlers and `/battle/loadout` to Armory.
Internal fighter IDs, collection IDs, reward schema and save keys are unchanged.

## Saved preparation

`preparationError` checks ready player data, owned Brawler, exactly three
distinct compatible powers and their ownership. `replacePower` preserves the
other two sockets and rejects invalid slots, duplicates and Second Chance.

Inspection never changes equipment. A failed save keeps the prior persisted
selection authoritative, exposes the existing error, and allows explicit retry.
The Armory can repair a legacy incompatible kit. Locked Brawlers/powers remain
inspectable; their equip action is disabled with an explanation.

After draft completion, `prepareSavedEquipment` copies the already-saved kit
into transient setup only after the existing category/ownership validators pass.
It does not invent a save, grant a collectible or start a clock.

## Match orchestration

- Local search remains the same deterministic, cancellable 1.2-second service.
  A durable match ID is reserved before advancing. Failures are retryable.
- Finding an opponent transitions directly to draft, without a Continue screen.
- Eight category crests remain on one board. Ban, pick and the final five-category
  mix are distinct states. No new countdown or category-round mechanics.
- VS loads local stage/Brawler sources, revalidates the prepared snapshot against
  current ownership/equipment, and checks active app state before entry.
- The battle clock is created **only at actual battle start**. No reading time
  is consumed by loading or the short skippable entrance.
- Cancelling or leaving a loading entrance cannot start a stale match. A changed
  kit requires redeployment rather than silent substitution.
- The existing battle engine, independent answer deadlines, damage, boosters,
  reduced-motion behavior, KO and forfeit confirmation remain authoritative.

Results show one outcome tableau, real damage/accuracy/combo and saved rewards.
Detailed records are optional inspection, not five mandatory receipt pages.
Rematch returns directly to acquisition with valid saved preparation; an unsaved
outcome cannot be discarded to start another match.

The initial signature combat slice now adds source-limb signal/smear contact,
an alpha-aware KO instead of collapse, and a saved winner tableau. A knockout
holds an upright recoil for 80 ms, fractures its painted edge, dissolves through
the original alpha by 650 ms and releases 32 source-colored fragments. The
cosmetic tail is capped at 1 second so even the longest two-way special exchange
fits the unchanged 2200 ms reveal budget. Forfeit never creates a KO or stale hit.

The finite event clock distinguishes unknown motion readiness from actual
reduction. Once interrupted/settled, the same event cannot replay on re-entry,
blur/resume or a preference change; an explicit studio replay uses a new key.
Result presentation waits for the existing successful grant, uses the real
winner's painting, and exposes real latest-account XP on native and web. History
and repeated entry are receipts. OPEN/HOME plus Rematch/record sigils stay
available without waiting for the hero animation; the chest ritual is unchanged.

## Chest/discovery loop

The chest is the interactive object. Settlement still uses the existing
idempotent store transaction. Failed settlement stays unopened and retryable.
New Brawlers have an optional explicit equip action; powers link to Armory;
duplicates show their actual saved shard conversion. Already-opened records
cannot grant again. Pending chests remain available in Vault after restart.

Chest opening now follows Experience Board section 06 directly: its original
closed/open paintings, Relay scene, 650 ms open-state hold and 250 ms upward
fade into discovery. The superseded reconstructed hinge/charge/particle sequence
is no longer active. Real rewards stay closed until settlement succeeds, and
discovery waits for the open painting to be ready and its hold to finish.
Repeated taps cannot skip the hold or grant twice. Reduced motion and reopening
an already-settled record show the saved outcome without a new-item replay.

Vault's Practice tab has four repeatable examples by default and is selected
automatically when there are no pending earned rewards. Practice opens the same
scene and the reference Nightblade/rare-duplicate examples, explicitly without
inventory, currency or record writes. Practice-only family/reset/duplicate
controls live behind the info sigil instead of filling the scene with buttons.
Earned remains the default when real chests are pending. Family selection
does not alter the 70/25/5 rarity odds or 5/15/40 duplicate conversion.
See [chest verification](COMBAT_AND_CHESTS.md) for the focused acceptance evidence.

## Graphic and motion direction

The current scene system uses ink/paper, acid-yellow actions and hot-pink print
accents, rough-edged original typography plates, asymmetric framing and original
32-unit icon paths. Reading surfaces remain quiet.

The 31 original UI paths are rasterized at 3x and tinted as normal native images.
This avoids allocating a WebGL surface per navigation/power/category icon and
exhausting browser graphics contexts after visiting several destinations.
Rebuild them with `node scripts/build-world-icons.cjs`; the authored paths remain
in `src/assets/world-icon-paths.ts`.

`SceneEntrance` applies one bounded 260 ms offset/settle when a scene gains focus,
never a perpetual loop. Blur/background/unmount cancel cosmetic work. System
or app reduced motion presents the settled layout immediately. Existing combat
animation stays independent of navigation and presentation clocks.

Arena now adds a living painted Brawler: restrained breathing and upper-body
posture, fixed feet, a rigid face and one small personal effect. Two procedural
haze layers, slow reactor light and eight quiet motes share its one canvas.
The original static art remains the loading/reduced-motion presentation; other
Brawler inspection stages stay static. Blur/background, system/app reduction
and mode inspection stop the living layer.

Battle reuses its existing canvas for two quieter haze layers, reactor pulse
and six motes behind the fighters. These are clipped to the arena, never the
question/answer region. A separate 24-second UI-thread clock is independent of
combat events and game deadlines. Finished scenes stop ambient loops. Neither
this pass nor its Brawler signatures change equipment, rewards, damage or timers.

Scene actions now match the Experience Board's command plates: transparent
top-left/bottom-right corner cuts, inset keyline, large condensed label and
original sigil. `SceneAction` has three explicit types: `signal` (red, for Duel
and draft commitments), `primary` (acid, for equipment/reward actions), and
`outline` (dark, for secondary actions). Draft shows **BAN / PICK** while keeping
the explicit **Confirm ban / Confirm pick** accessibility labels and unchanged
commit behavior. Its command stays compact and centered instead of becoming a
full-width website CTA. Focus follows the plate silhouette; disabled/loading
states stay legible and non-interactive. Geometry uses native views, not another
Skia context per button.

This adopts broad hand-made print/brush and staged-reveal principles discussed
for the supplied references. It does **not** copy their artwork, frames or logos.
The prior Brain Brawlers logo and human illustrations remain current assets;
a final new-logo overhaul and production painterly character animation are
separate art passes, not falsely reported complete here.

Combat has since been upgraded from the flat vector stand-in to weighted meshes
using the exact painted selection textures. See [art direction](ART_DIRECTION.md)
for source-specific anatomy, undistorted rest mapping and remaining animation
polish limits.

## Layout and access

- Fixed safe-area-aware scenes, with no outer ScrollView or FlatList.
- Portrait-first phone layouts; wider windows expand the lobby stage/preparation.
  The existing native app orientation remains portrait.
- At least 48 px controls; five navigation targets and six portrait targets
  fit a 320 px viewport. Short views remove flavor content before controls.
- Account/save failures get a dedicated recovery region rather than pushing
  controls below a decorative stage.
- Named radio/tab/button roles distinguish inspection, ownership and equipped
  state. Outcome/selection never depend on color alone.
- Original icons remain decorative inside named interactive targets.
- Career milestones are **recognition only**. No unapproved currency grants,
  daily reset system, paid gacha, competitive rank or store was added.

## Validation

```powershell
npm test -- --runTestsByPath tests\versus-entry.test.tsx tests\navigation.test.tsx tests\world-experience.test.tsx tests\arena-lobby.test.tsx tests\volt-design.test.tsx tests\fixed-game-layout.test.tsx tests\combat-chests.test.tsx tests\mode-selection.test.tsx tests\brand.test.tsx tests\battle\animation-smoke.test.tsx
npm run lint
```

Tests cover the five destinations and legacy redirects, saved preparation,
locked inspection, failed equipment/claim writes, duplicate sockets,
incompatible kit repair, asset readiness/failure/retry, cancellation during load,
changed equipment, exact-once battle start, real derived milestones and reward
idempotency. Source/application type checks are separate from obsolete tests
elsewhere that still reference retired rounds/clash APIs.

Acceptance evidence for this implementation:

- 10 targeted suites / 100 tests passed; application/current-world-test types
  and repository lint passed.
- All five world destinations were checked at 320 x 568, 390 x 844 and
  1440 x 900, with controls in bounds and local images loaded.
- Two real browser duels completed through queue, draft, VS, eight answered
  questions, saved result, chest settlement, reopen and restart. Reopening did
  not change the saved profile or grant again.
- Final Android and iOS JavaScript/Hermes exports include all 31 original UI
  images and the new world/entry routes.

Browser layout and real queue-to-chest checks supplement component rendering;
native JS/Hermes exports are not Android/iOS device acceptance. Final cinematic
art, continuous chest hinge animation, audio/haptics, screen-reader listening
and physical-device acceptance remain separate work.
