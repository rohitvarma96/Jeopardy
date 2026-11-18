# Brain Brawlers - Project status and resume log

Updated: Containment Break implementation and mouth-emission feedback correction.

## Handoff summary

The core game UX is implemented. The latest button-fidelity and chest-reference
tasks are complete and verified. Initial Arena idles/smoke and battle ambience
are now implemented. The first signature contact/KO/victory slice is also
implemented. Astral Sage now has a layered, authored five-clip home pilot.
Containment Break replaces the rejected Relay Breach crystal effect. Closed
pressure, a 250 ms hold, mouth-rooted release and an actual-reward handoff share
one cinematic stage/clock. The distracting pre-open smoke is removed.
The other five authored performances, commitment/equipment transitions and
final branding polish remain incomplete.

The Sage pilot and follow-up neck fix are complete. Remaining home art expansion
and physical-device acceptance precede a claim of roster-wide completion.
The local app preview
remains available at <http://127.0.0.1:8191/arena>.

## Authored home performance - Sage pilot implemented

See the [Home Brawler Performance Plan](HOME_BRAWLER_PERFORMANCE_PLAN.md).
Sage uses a new identity-matched puppet atlas, six head drawings, three hand/
forearm drawings, independent coat/prop and authored arrival/idle/acknowledgement/
signature/ready timing. Body tap acknowledges; star tap or optional hold/release
interacts; the constellation sigil is the accessible alternative. Nameplates
and the Brawlers destination retain selection.

The first neck offset/paint-order correction was visually rejected. It left
each head's duplicate shirt collar pasted over the torso. The replacement trims
all six heads to the skin neckline, registers the anatomical neck root,
repaints the exposed neck bridge and restores the torso collar as a separate
stationary foreground layer. The reduced-motion poster uses the same assembly.

The final seam repair expands the concealed skin overlap at the back edge,
where the previous center-only check missed the gap. The anatomical socket is
`(216, 172)`; the accumulated stale-preview offsets are removed. A disconnected
Metro preview had stayed at `(216, 168)` while local offsets accumulated to
`(216, 247)`. Always reload a disconnected preview and verify its loaded
registration before judging another visual adjustment.

The other five still use their earlier mesh idles. Full-body turning, lip sync,
kit/result-specific home acting and physical-device quality/performance
acceptance are not complete. No new renderer/runtime dependency was introduced.

### Latest home pilot - verification

- Initial pilot: **11 affected suites / 169 tests passed**.
- Final seam repair: **4 affected suites / 55 tests passed**, including fixed
  back-neck pixel coverage, bounded socket placement, six head registrations
  and spam/hold/cancel/lifecycle/error-retry checks.
- Real CanvasKit checks all six drawings at three turn angles: no alpha gaps
  below 250 in the fixed 25 x 19 back-neck band. The static poster's same band
  has alpha 251-255. Render differences outside the head/neck are zero.
- The refreshed Arena reports the correct `(216, 172)` registration, one canvas
  and no new page exceptions. Its served atlas SHA-256 matches the rebuilt
  local texture, rather than assuming hot reload applied it.
- Application/affected-test types and affected-file lint pass. The earlier
  pilot's repository lint and production web/Android/iOS Hermes exports passed;
  physical-device acceptance remains open.
- Real isolated production-browser interactions verified body/prop/sigil input,
  hold/release/cancel, repeated taps, system reduction, mode inspection and five
  leave/return cycles. Cosmetics left saved player data byte-for-byte unchanged.
- 320 x 568, 390 x 844 and 1366 x 768 scenes remain non-scrolling, with controls
  in bounds. Nameplate navigation and immediate Duel -> draft remain functional.
- One 1536-square RGBA atlas is 9 MiB decoded. This is an asset-size calculation,
  not measured physical-phone memory/FPS acceptance.

## Signature motion direction - first slice implemented

The next visual direction is documented in the
[Signature Motion Pitch](MOTION_SIGNATURE_PITCH.html) and
[director's plan](MOTION_AND_INTERACTION_PLAN.md#11-signature-motion-directors-pass-proposal).
The pitch contains three original replayable animatics, scrubbing/reduced-motion
controls and linked verified references. They remain design studies, not gameplay
recordings. The initial production slice now implements the published hit ->
source-aware vaporization KO -> saved victory tableau.

Next: Duel/VS + draft stamps, then Brawler equip/power sockets and broader Career
celebrations. The approved chest ritual stays unchanged.

## Done

| Area | Implemented |
| --- | --- |
| Game identity | Public name Brain Brawlers; characters called Brawlers. Initial split-BB logo, wordmark, app icon and painterly key visual are integrated. |
| Design language | Punchy condensed typography, ink/paper surfaces, acid/pink accents, original iconography and shared game controls. |
| Game-style UX | Fixed, non-scrolling scenes with Arena, Brawlers, Armory, Vault and Career destinations. Persistent preparation replaces repeated setup forms. |
| Brawlers | Six adult human paintings. Owned/locked inspection, explicit persistent equip and three-socket power replacement. |
| Combat art parity | Combat uses the exact selection paintings on articulated, weighted meshes rather than flat vector stand-ins. |
| Fight presentation | Grounded Relay fight setting, limb-driven attacks/reactions and STRIKE / BLOCK / KO lettering. |
| Match flow | Duel -> local AI acquisition -> ban/pick -> VS readiness -> battle -> saved result -> chest/discovery. |
| Progression safety | Persistent equipment, real local progression, exactly-once reward settlement and saved receipts. |
| Button correction | Duel and draft commitments use reference-style red cut-corner plates and inset borders. Pick is compact/centered. Acid primary and dark outline types remain distinct. |
| Four modern chests | Field, Arc, Overdrive and Sovereign; cosmetic families do not change rarity odds or rewards. |
| Reference chest ritual | Experience Board section 06 closed/open paintings, Relay composition, typography and discovery/duplicate states are implemented in practice and earned flows. |
| Practice chests | Four repeatable choices are available without completing a match. An empty Vault defaults to Practice. No inventory, currency or match-record writes. |
| Arena idles | The other five retain grounded painted-mesh breathing/upper-body motion. Sage uses the authored home performance instead. |
| Authored Sage home performance | New head/hand drawings, layered prop/coat, five clips, body/prop/sigil interactions, corrected neck/collar registration and shared static rest. No gameplay changes. |
| Arena atmosphere | Two procedural haze layers, slow reactor light and eight quiet motes share one active canvas with the Brawler. Focus/background, motion reduction and mode inspection stop the living layer. |
| Battle atmosphere | Two quieter haze layers, reactor pulse and six motes reuse the existing battle canvas behind the fighters. No overlays on questions/answers and no gameplay-clock changes. |
| Signature contact | Published resolutions drive a signal into the actual painted hand/foot, short limb smear and ink impact. Block/zero-damage/void/forfeit behavior stays truthful; one word owns each contact beat. |
| Vaporization KO | Upright recoil hold, original-alpha dissolve, emissive edge and 32 exact source-colored fragment anchors per Brawler. The loser remains gone across reduction, blur/resume and settled re-entry. No live collapse or KO zoom-out. |
| Saved result tableau | Actual winning Brawler, bounded VICTORY/DEFEAT composition, real saved latest-account XP and level receipt. History/repeated entry and forfeits do not replay earned celebrations; compact OPEN/HOME commands do not wait for animation. |

### Latest signature slice - verification

- Ten affected suites / **157 tests passed**, with application/affected-test
  types and repository lint also passing.
- Original Skia dissolve material compiled in real CanvasKit with eight numeric
  uniform floats; no image/pose substitute or rectangle mask fallback.
- All 192 fragment anchors were checked against opaque source pixels and exact
  original RGB values.
- All six GPU KO materials and either losing side were captured in the native
  renderer's browser studio. Former loser-region pixels stayed unchanged after
  reduction and blur/resume.
- A production web export completed a real eight-question duel and saved level
  transition (3 -> 4), compact victory/forfeit layouts, result reload, protected
  chest opening and receipt reload without another grant.
- The dev-mode static export reported an unknown-module error; acceptance used
  the successful production web build instead. The live development preview
  remains available; this is not a claim that every dev export mode is healthy.
- Final production web and Android/iOS Hermes exports pass. The final production
  browser journey also checks actor-relative lettering, short compact commands
  and native/web saved-XP accessibility.
- Physical-device GPU/frame-time acceptance remains pending.

### Latest ambience task - verification

- Seven targeted suites / **95 tests passed** across ambient math/lifecycle,
  painted source/rig behavior, battle deadlines, Arena/layout and navigation.
- All six Brawlers were captured in a fresh, isolated browser profile; decorative
  frames did not write saved player data.
- Opaque painted foot pixels had zero RGB difference between idle captures while
  upper-body/environment pixels changed.
- Exactly one Arena canvas was active. Reduced motion and mode inspection
  released it; compact 320 x 568 controls stayed in bounds.
- Twenty Arena leave/return cycles retained one active canvas with no WebGL
  context warnings or runtime errors.
- A real eight-question duel completed with battle ambience and no browser
  exceptions.
- Application and seven affected motion/world test files type-check; lint and
  final Android/iOS Hermes exports pass.
- A headless browser sample recorded 16.72 ms average / 17.10 ms p95 animation
  callback intervals over 180 frames. This is not a native-device FPS guarantee.

### Latest chest task - final state

The approved visual contract is
[Experience Board / 06 Chest / Discovery Ritual](GAME_EXPERIENCE_BOARD.html#reward-phone).

- Tap the original closed painting.
- Real rewards stay closed until the save succeeds.
- Show the original open painting for **650 ms**, after artwork readiness.
- Add **800 ms Relay Breach**: mouth-anchored vapor, signal gathering, an 80 ms
  pressure hold and graphic release. The original open painting stays in place.
- Reveal discovery with a **250 ms ease-out fade and 12 px upward settle**.
- Use the full-body Brawler painting, large condensed name and compact EQUIP.
- Duplicates retain a faded grayscale painting at 24% opacity and show the
  actual saved shard conversion.
- Repeated taps do not skip the open-state hold or grant again.
- Reduced motion reveals the saved result without the motion sequence.
- Reopening a settled earned record does not replay a new-item event or grant.
- Practice uses the board's Nightblade / +15 rare-duplicate examples for every
  family. The info control exposes family selection, Reset study and Preview
  duplicate. Open again restores the closed scene.
- Practice Equip is explicitly a non-mutating preview.

The reconstructed lid/charge/beam/spark version is superseded and inactive.
Do not substitute it for the user-selected painted states.

The last blockers are resolved: the doubled web-image glow now belongs to its
frame, and image positioning uses supported React Native style properties.

### Containment Break - implemented

The [cinematic direction](CHEST_CINEMATIC_DIRECTION.md) now has a shared runtime
and original smoke/light pack. One 3200 ms clock separates successful saving
from visual closed pressure, a 250 ms still hold, open release, actual incoming
reward and settled receipt. No crystal, mirrored cubic ribbons or pre-open
vapor remains. Smoke starts inside each chest mouth, grows upward with internal
shade/light motion, and is overlapped by the lid/front rim.

The initial cinematic frame matches the static chest's placement and brightness,
avoiding a pop before opening. The incoming Brawler/power/duplicate art gates
readiness; identities appear from 2200 ms and actions/receipt from 2650 ms.
The finite canvas releases at 3200 ms. Reduced motion, controls, navigation and
background settle safely without replay or extra grants.

Verification: **7 suites / 81 tests passed**; final alignment changes also passed
four focused suites / 38 tests. Application/affected-test types, affected-file
lint and production web/Android/iOS Hermes exports pass. An isolated browser
checks all four mouths, 320 x 568 layout, unchanged practice data, real
new-Brawler/power/duplicate settlement, unchanged receipt reload, controls/
family-reset cancellation, reduced motion and back navigation. No shared-user
browser storage was seeded.

The raster atlas is 1536 x 384 RGBA (2.25 MiB decoded), plus the selected shell
light mask. Physical-device performance/visual acceptance and optional
audio/haptics remain pending. This is layered stylized smoke, not fluid simulation.

## Pending

These are remaining design/backlog items, not currently running tasks.

| Recommended order | Area | Remaining work |
| --- | --- | --- |
| 1 | Premium home Brawler performance | Review the implemented Sage pilot on physical phones, then author distinct packs for the other five. Sage's five clips and neck fix are done; do not replace them with single-texture warping. |
| 2 | Commitment bridge | After the home pilot, author Duel/VS entrance and category ban/pick stamps while retaining real acquisition/readiness/cancellation gates. |
| 3 | Equipment interactions | Brawler identity/equip seal and physical power-socket seating after real saves. |
| 4 | Broader progression polish | Career XP/level-up/milestone celebrations beyond the initial saved result/XP tableau. No unapproved rewards or rank-ups. |
| Separate art pass | Latest branding revision | The later requested logo/rebranding direction is not implemented. The initial Brain Brawlers identity is still live. |
| Separate art pass | Production character animation | Sage has authored layered home acting. The other five retain mesh idles; broader cloth/scarf, full-body/difficult poses and facial/lip-sync work remain. |
| Final acceptance | Physical-device QA | Real Android/iOS visual, frame-time and memory testing, including repeated navigation and reduced motion. Bundle exports are not device acceptance. |

The reference chest artwork/composition and Containment Break have no
remaining implementation blocker. Keep their saved-outcome, duplicate, practice
and reduced-motion safeguards; do not restore the discarded reconstructed lid.

Audio/haptics, online modes, purchases, cloud sync and backend features remain
separate/deferred scope; they were not implemented to simulate a finished game.

## Verification checkpoint

- **6 targeted suites / 70 tests passed** on the final chest implementation.
- Application and six affected chest/world test files type-check.
- Repository lint passes.
- All four closed/open/discovery scenes were compared with board captures.
- Reference and live Brawler artwork bounds match exactly.
- Browser checks cover compact 320 x 568 layouts, reduced motion, reset,
  duplicate and Equip previews.
- Practice saved player data remains byte-for-byte unchanged.
- A real eight-question duel verified earned settlement before discovery and
  no second grant after settled-record reload.
- Final Android and iOS Hermes bundle exports pass after the last rendering fix.
- Physical-device acceptance remains pending.

```powershell
npm test -- --runTestsByPath tests\chest-opening.test.tsx tests\chest-ritual.test.tsx tests\chest-discovery.test.tsx tests\combat-chests.test.tsx tests\world-experience.test.tsx tests\navigation.test.tsx
npm run lint
```

The repository-wide type check still includes historical tests for retired
rounds/clash APIs. Do not describe the entire historical suite as green.

## Resume pointers

- [Motion plan and remaining acceptance](MOTION_AND_INTERACTION_PLAN.md)
- [Implemented world experience](WORLD_EXPERIENCE_IMPLEMENTATION.md)
- [Combat/chest implementation and verification](COMBAT_AND_CHESTS.md)
- [Shared chest scene](../src/components/player/ChestRitual.tsx)
- [Chest state images](../src/components/player/RewardChest.tsx)
- [Opening lifecycle](../src/hooks/useChestOpening.ts)
- [Earned reward controller](../app/battle/rewards.tsx)
- [Practice controller](../app/chest-forge.tsx)
- [Reference derivative builder](../scripts/build-chest-ritual.cjs)
- [Shared button types](../src/components/world/SceneControls.tsx)
- [Living Arena Brawler](../src/components/world/LivingBrawler.tsx)
- [Shared Arena/battle atmosphere](../src/components/atmosphere/SceneAtmosphere.tsx)
- [Grounded painted idle](../src/components/fighters/combat/lobby-idle.ts)
- [Independent ambient clock](../src/hooks/useAmbientClock.ts)
- [Signature contact treatment](../src/components/battle/SignatureHit.tsx)
- [New home performance direction](HOME_BRAWLER_PERFORMANCE_PLAN.md)
- [Authored Sage player](../src/components/world/SagePerformance.tsx)
- [Sage pose timing and registered head socket](../src/components/world/sage-performance.ts)
- [Sage atlas and static-poster builder](../scripts/build-sage-performance.py)
- [KO timing, noise and material source](../src/components/battle/signature-motion.ts)
- [Painted vaporization renderer](../src/components/fighters/PaintedVaporization.tsx)
- [Saved result tableau](../src/components/battle/ResultTableau.tsx)
- [Source fragment builder](../scripts/build-brawler-fragments.py)

Suggested resume instruction:

> Read docs/PROJECT_STATUS.md and the Signature Motion Pitch. Buttons, the
> reference chest ritual and initial Arena/battle ambience are complete. The new
> initial hit -> vaporization KO -> saved victory slice is implemented. Before
> Duel/VS, review HOME_BRAWLER_PERFORMANCE_PLAN.md: the authored Sage pilot and
> corrected neck are implemented. Validate physical-phone quality and expand
> the other five deliberately. Preserve approved chest states, the Sage
> body/head/foreground-collar assembly and gameplay/reward rules.

Changes remain in the local working tree. This session did not create a commit
or push changes; existing staged/unstaged work was left intact.
