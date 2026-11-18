# Brain Brawlers / Motion and interaction plan

**Status: reference chest opening, repeatable Vault practice, initial Arena
idles/smoke, battle ambience, the first signature hit/KO/saved-result slice and
the authored Astral Sage home pilot are implemented. The other five authored
performances and remaining transitions are incomplete.**
The active KO now replaces the awkward body collapse with painted-alpha energy
vaporization. The original source paintings and gameplay/reward rules remain.

**New design proposal:** [Signature Motion Pitch](MOTION_SIGNATURE_PITCH.html)
contains three original, replayable motion/layout animatics and verified visual
references. [Section 11](#11-signature-motion-directors-pass-proposal) defines the
director's direction. Its animatics remain isolated design studies; the initial
production slice now implements contact, vaporization KO and saved results.
Launch, draft, equip/socket and broader progression proposals are not complete.

**New priority before Duel/VS:** [Home Brawler Performance Plan](HOME_BRAWLER_PERFORMANCE_PLAN.md).
The user wants authored home-screen acting, not a stronger version of the
current mesh deformation. Sage now has actual head/hand drawings, a layered
Skia player and five home clips. The other five packs and physical-device
acceptance remain; this is not a claim that the entire roster is complete.

## 1. The motion identity

**Alive while you look. Immediate when you act. Loud only when you earn it.**

Three layers should work together:

1. **Ambient life:** breathing, low floor haze, distant reactor light, a few
   particles. Slow, asymmetric and mostly behind the characters.
2. **Interaction:** an immediate press, a socket engagement, a portrait focus,
   an ink-stamp commitment. Short and deliberate.
3. **Events:** attacks, KO, victory, chest opening and discovery. These earn
   stronger timing and composition.

The whole screen must not keep bouncing. Feet do not hover. Reading is quiet.
No constant camera shake, flashing outlines, fake loading or casino-like
near-miss reveals.

Use original rough ink masks, halftone breakup, decisive pose holds and staggered
graphic reveals. Take broad motion principles from the supplied references;
do not copy their footage, characters, logos or exact sequences.

## 2. Arena: a Brawler in a living world

Sage now uses the authored pilot described in the
[home performer plan](HOME_BRAWLER_PERFORMANCE_PLAN.md). Six head drawings,
three hand/forearm drawings, an independent coat tail and a separate prop replace
its old mesh idle. Skin-only heads use anatomical neck anchors; a separate
foreground collar covers the repainted neck bridge. This replaces the rejected
offset-only attachment and is shared with the static poster. The other five
retain the first-pass idle.

### Shared character idle

For the other five, the first Arena pass uses the actual painted mesh, not a bobbing
whole image. Four-second breathing and twelve-second upper-body posture changes
leave the original lower silhouette/feet fixed. Faces remain rigid; a small
six-second arm movement accompanies the personal effect. Source-space movement
is bounded below five pixels. The table below includes longer-term targets:
independent cloth, blinking, lips and head turns are still not authored for
those five. Sage has blink/gaze/head and hand drawings, not lip sync or full turns.

| Layer | Proposed movement | Timing / limits |
| --- | --- | --- |
| Breathing | Chest/shoulders expand slightly, settle; face stays rigid | 3.5-5 s; approximately 1% deformation |
| Weight | A small hip/shoulder counter-shift with a planted support foot | 8-12 s; 1-3 px apparent movement, never whole-body floating |
| Coat/scarf | Restrained lag at loose edges, not rubbery whole-body warping | 4-7 s; small arc |
| Hands/device | Small articulated gesture plus device-specific effect | Sparse personality beat, not continuous attack posing |
| Grounding | Contact shadow and pedestal light respond subtly to movement | Never detach the feet from the floor |

The present painted mesh can support modest breathing, stance and limb changes.
Convincing blinking, lip motion, head turns and independent front/back cloth
require new authored layers or poses. Do not fake those by distorting the face.

### Individual personality

| Brawler | Implemented first-pass idle signature |
| --- | --- |
| Astral Sage | Authored arrival, blink/gaze idle, acknowledgement, pinch/constellation/recovery and readiness; no single-painting mesh idle |
| Nightblade | A restrained bracer glint; independent scarf movement remains future work |
| Thorn Ranger | One botanical speck and a small orbiting leaf-shaped accent |
| Iron Bastion | A thin shield-face light/glint, not an active block |
| Ember Sentinel | Hand glow with bounded rising embers |
| Frost Warden | Two restrained hologram-ring accents around the existing device |

These are cosmetic signatures, not active buffs, cooldowns or resource meters.

### Environment

The first pass now uses two textured, procedural haze layers, a slow reactor
light pulse and eight quiet motes in the Arena. Six quieter motes and the same
two-layer vocabulary run inside the battle stage. The following bullets remain
the art-direction constraints rather than a claim of fluid simulation:

- **Behind the Brawler:** broad, low-opacity smoke/haze drifting laterally.
  Two staggered plumes on 8-14 s cycles should feel less repetitive than one loop.
- **At the floor:** a very thin layer of mist, below the knees and behind the
  footwear. It must not hide the contact shadow.
- **Reactor:** slow emissive light breathing across the architecture; no strobe.
- **Depth:** occasional distant dust or sparks, not a full-screen snowstorm.
- **Inspection, current UX:** Sage's body acknowledges and its star interacts;
  its constellation sigil provides a non-gesture equivalent. Every nameplate
  and the Brawlers destination open the hangar. The other five also retain
  body-to-inspect behavior. No mandatory gyroscope interaction.

A good initial Arena pass needs only breathing, one personal effect, two haze
layers and a quiet reactor pulse. More simultaneous effects are not better.

The Arena uses one active canvas for both atmosphere and the painted Brawler.
Other roster/inspection stages remain static. Focus/background, system/app
motion reduction and the Arena mode overlay release the living canvas and show
static art (Sage's baked authored rest; original portraits for the other five).
The separate 24-second UI-thread cosmetic clock has no
storage writes or gameplay authority.

## 3. World interaction map

| Screen / control | Proposed response | Important state rule |
| --- | --- | --- |
| World navigation | Sigil compresses on press; pink notch stamps in; scene layers settle with a small stagger | Destination/input becomes ready independently of decorative motion |
| Deploy | Sigil engages, action plate compresses, a short diagonal ink wipe bridges to acquisition | Validate preparation first; never animate success for an invalid kit |
| Brawler portrait | 120-180 ms focus edge and short reveal to selected art | Inspection is not equip; no ownership change |
| Equip Brawler | Small equipped seal and a grounded stance settle | Play the seal only after the save succeeds |
| Locked Brawler | Deliberate lock response and acquisition explanation | No fake unlocking animation |
| Power socket | Socket focus, ring engagement, selected device lifts slightly | At least 48 px targets; tap replacement works without dragging |
| Fit power | A short connection trace from inspected power to the chosen socket, then seated light | Keep the prior saved kit authoritative until commit succeeds |
| Failed equip/fit | Clear error and a restrained local nudge, not a screen-wide shake | Retry is explicit; never leave an optimistic equipped state |
| Vault selection | Selected chest receives a ground-light halo and a slow seam pulse | Only real pending chests get a badge; no bouncing notification spam |
| Career progress | Brief XP fill/count transition only for new earned data | The underlying profile is already saved; announce the actual final values |
| Milestone achieved | One emblem stamp/unfold; quiet permanent achieved state afterward | Recognition only, unless a reward/claim ledger is separately approved |
| Record inspection | A concise panel reveal; no reward fireworks on history reopen | Never grant or replay a new-item event |
| Settings | Toggle settles in 80-120 ms; successful explicit save gets a check stamp | Preference/identity feedback follows real persistence |
| Modal/inspection | Edge plate reveals over a dimmed scene in 180-220 ms | Preserve focus, Back behavior and the previous selection |

Press feedback starts immediately, generally 60-100 ms. Do not wait for a long
animation before acknowledging the tap. Hover and tooltips are optional desktop
enhancements, never required mobile interactions.

## 4. Queue, draft and VS

### Opponent acquisition

- Player banner enters and settles; the AI slot has a restrained scanning/ring
  treatment while the actual local request is pending.
- Reveal the opponent banner only after opponent acquisition and durable match
  ID reservation succeed.
- Keep the opponent explicitly labeled **LOCAL AI**. Do not invent network
  latency, human presence or matchmaking populations.
- Cancel interrupts presentation immediately and aborts the pending request.
  A late animation completion must never advance a cancelled match.

### Draft

- Tap: the crest receives a focused ring; the category name becomes prominent.
- Ban: a pink slash stamps across it; two or three small ink chips dissipate.
- Pick: an acid outline locks into a solid selected frame.
- AI response: a short counterpart stamp, clearly attributed to the opponent.
- Final mix: the five crests assemble into a compact belt.

Suggested commitment motion: 180-320 ms. The state changes remain immediate and
authoritative; the motion cannot allow a second ban/pick or invent a countdown.

### VS entrance

Two Brawler banners reveal on opposing diagonals, then settle; the VS mark
stamps between them, followed by the category belt.

Target: approximately 600-900 ms once required sources are ready, with a skip/
enter-now control. The battle timer does not start during loading or the bridge.
Reduced motion shows the complete static composition and proceeds when ready.

## 5. Battle: environment lives, reading remains calm

The initial environment pass is implemented inside the existing combat canvas:
two slow textured wisps, quiet reactor light and six low-opacity motes, all behind
the actors and clipped to the fight region. It does not paint over the question,
answers or HUD. The ambient clock continues across ordinary question renders,
stops for finished/reduced-motion scenes, and never controls battle deadlines.
The existing small combat idle remains unchanged. The later signature slice
adds published-event contact treatment and source-aware KO independently of the
ambient clock; neither pass changes battle deadlines.

### During the question

- Keep character breathing/guard changes very small.
- Rear smoke drifts beneath the architectural lights; low floor haze moves
  behind the feet.
- A few distant particles cross the scene slowly, away from answer text.
- Reactor and floor indicators breathe with long cycles.
- No reading-time camera movement, large weapon flourishes, foreground smoke
  over the prompt, constant shake or decorative countdowns.

### During actual resolution

| Event | Choreography |
| --- | --- |
| Attack | Anticipation -> committed arm/leg motion -> short contact hold -> recovery |
| Foot movement | A small dust contact only when a foot actually lands |
| Real damaging hit | Anatomically anchored trail, local contact burst, appropriate recoil and damage number |
| Block | Shield plane closes toward contact, a short ripple and **BLOCK**; no damaging strike treatment |
| Armed power | A restrained device/ring state remains visible until the effect is consumed |
| Wrong answer | Quiet locked/incorrect feedback; no invented damage or theatrical attack |
| Real combo | Short combo lettering on actual combo milestones, not on every tap |
| Transition to reading | Trails/particles recede before the next question takes focus |

Impact holds are cosmetic, approximately 40-70 ms. They never freeze the engine,
change independent deadlines or delay the next exchange. All hit effects derive
from published resolutions, not guessed correctness or an HP difference.

## 6. KO: vaporize, do not ragdoll

### Direction (initial implementation complete)

The active renderer no longer schedules the folded-body collapse. The losing
Brawler holds an upright recoil, breaks into energy and disappears through its
original painted alpha. No new corpse pose or fake physical simulation is used.
The old sampler is retained as historical math, not a live/preview KO command.

### Implemented sequence from the actual finishing contact

| Time | Visual |
| --- | --- |
| 0-80 ms | A short impact hold in a readable upright/last-hit pose; no folding body |
| 80-220 ms | A bright silhouette edge fractures into the Brawler's own signal colors |
| 220-650 ms | A spatial dissolve eats through the painted silhouette, with an emissive breakup edge |
| 320-920 ms | 32 precomputed source-colored fragments drift upward/outward and fade |
| Approximately 1000 ms onward | Loser remains absent; residual ground light/shadow fades; winner settles |

**KO** stamps at the decisive hit, not at an arbitrary later timer. The dissolve
must reveal the actual background, not replace the character with a dark box.
Breakup follows the source alpha: particles must come from the Brawler, not
from a rectangular image boundary.

Use a seeded dissolve mask in local Brawler coordinates. Sample particle
origins/colors from precomputed painted coverage rather than reading texture
pixels every frame. Reuse the battle's canvas and effect clock.

### Persistence and honesty

- Trigger only on a real knockout of that side. Forfeit is not an explosive KO.
- The loser must not reappear after blur/resume, a timer render, result navigation
  or a settled outcome-only preview.
- An explicit preview replay can reset the effect; ordinary screen renders cannot.
- The winner remains fully visible. Damage, rewards and battle outcome do not
  depend on the dissolve completing.
- Reduced motion: immediately remove the losing silhouette or use only a brief
  non-spatial fade; retain KO text, zero HP and the outcome. No flying fragments.

Live presentation and the native action studio map KO to a separate defeat
timestamp, never the `fall` pose. Outcome-only views start settled. The portable
CPU study shares the KO helpers/anchors with an approximate triangle mask.
The finite clock latches settled events across blur/reduction; explicit preview
replay alone resets the event. Both player and opponent losses are covered.

## 7. Chest opening and discovery

### Visual contract

Keep **Experience Board / 06 Chest / Discovery Ritual** paintings and composition.
Containment Break replaces the subsequently rejected Relay Breach extension.
It does not restore the superseded reconstructed hinge, alter loot or redesign
the discovery/duplicate composition.

### The ritual (implemented)

1. **Closed:** the original closed painting and UNLOCK THE LATCH composition.
2. **Contained:** after saving/art readiness, keep the lid visually closed,
   isolate the stage and build seam pressure. Hold motion from 1000-1250 ms.
3. **Release:** switch to the original open painting at 1375 ms and start
   tapered smoke at its projected mouth. No pre-open vapor graphic or crystal.
4. **Discovery:** the actual saved painting/emblem emerges from 2200 ms within
   the same canvas; identity and then actions/receipt resolve by 3200 ms. The
   original final framing remains. Settled re-entry does not replay an entrance.
5. **Duplicate:** keep the item as a faded grayscale painting at 24% opacity;
   show ALREADY OWNED / CONVERTED and the actual saved shard conversion.

These are design timings, not guaranteed storage timings. Never show a completed
successful reveal before settlement succeeds. On save failure, keep/recover the
unopened state and expose retry.

There is no tap-to-accelerate in this reference sequence. Repeated taps cannot
advance its open-state hold. Reduced motion shows the saved result immediately.
Initial preference/focus reads are not mistaken for actual reduced motion.
Cancelled/stale callbacks cannot reveal another preview or grant again.

### Reference artwork (implemented)

The original eight closed/open paintings are used directly. The shared ritual
uses the board's Relay SVG/vignette raster and percentage-based layout, not the
general world-page wrapper. Grayscale duplicates preserve the original alpha.
The earlier 16 lid/base layers remain a superseded study, not active artwork.

Rebuild reference derivatives with `node scripts/build-chest-ritual.cjs`. See
[implementation and verification](COMBAT_AND_CHESTS.md).

### Reward variations

- **New Brawler:** the original full-body painting, name/passive/rarity and an
  optional explicitly persisted equip action.
- **New power:** the actual power emblem/effect and an Armory inspection action.
- **Duplicate:** the actual item and its saved shard conversion, not a new grant.
- **Already opened:** show a settled receipt; do not replay a new grant.

Chest family is not rarity. Neither the presentation nor repeated taps can
reroll, duplicate settlement or bypass failed persistence.

### Superseded Relay Breach study

**Historical direction rejected after review:** the earlier effect below was functional,
but the user found it kiddish and insufficiently dramatic. Do not scale up its
crystal/wisps as the next pass. The proposed replacement is
[Containment Break](CHEST_CINEMATIC_DIRECTION.md): restrained pressure,
cinematography, a held breath, one heavy release and a continuous actual-reward
reveal. The replacement is now **implemented**, including mouth-rooted
rear/front emission, removal of pre-open vapor and a continuously revealed
actual reward. The following timings/renderer describe the superseded study,
not active runtime behavior.

The approved extension now runs between the open chest and discovery, in
practice and earned flows for all four families. The original paintings,
discovery composition, duplicate receipt and EQUIP behavior remain intact.

**Direction: the chest releases raw signal, then the reward resolves from it.**
Use smoke as the material of the event, not the entire event. It should feel
contained, pressurized and intentional rather than like a generic fog overlay.

#### Implemented sequence

| Beat | Timing after the saved open painting and effect texture are ready | Staging |
| --- | --- | --- |
| Open / read | 0-650 ms | Keep the current painted open-state beat. The chest stays grounded and readable. |
| Vent | 650-890 ms | Two asymmetric, pale vapor ribbons escape from the actual mouth. A darker rear wisp gives depth; a restrained electric edge links the vapor to the existing chest light. |
| Gather | 890-1210 ms | The ribbons curl inward around a small suspended, angular signal core above the opening. The core is a universal abstract glyph, not a hinted Brawler, power or rarity. |
| Pressure hold | 1210-1290 ms | An 80 ms near-still hold: the core tightens and the vapor briefly pulls inward. This pause creates the anticipation, not extra particle count. |
| Breach | 1290-1450 ms | The glyph splits like a small graphic shutter; vapor peels outward, clearing the center instead of exploding over the reward. No full-screen white flash or camera shake. |
| Discovery | 1450-1700 ms | Hand off to the existing 250 ms discovery entrance, actual item painting/emblem, name and action. The identifying artwork is immediately unobstructed. |

This adds **800 ms** to the original sequence: approximately **1.7 s total after
save and artwork readiness**, not a promised tap-to-reward time. Saving can take
longer and must stay honest. The open painting remains visible through the
added phase; there is no replacement chest illustration or extra tap to proceed.

The key Aha moment is the **inward pull -> tiny hold -> decisive release**.
Smoke rising continuously for another second would be waiting, not staging.

#### Visual rules

- Four source-specific mouth anchors follow the original open paintings.
  Rear vapor sits behind the original painted alpha; front ribbons are clipped
  at each chest's front rim.
- Rear vapor belongs behind the painted silhouette. Front ribbons may cross
  the opening but must not hide the latch, outer shell or headline. Use a
  mouth mask where the complete open painting otherwise occludes the emission.
- Painterly/ink-edged ribbons with soft internal volume and controlled breakup,
  not overlapping blurred circles, confetti or a straight loot beam.
- Use a small amount of the existing family accent on the vapor's edge. Keep
  the core's main light neutral and the timing identical across all families.
- Keep the base camera and all navigation fixed. Any darkening is local to the
  stage, not a full-screen overlay that obscures the header or back control.
- The saved open sequence uses the `SIGNAL FORMING` caption instead of
  `OPEN STATE / DISCOVERY NEXT`. No progress meter, fake percentage, new CTA,
  guessing game, reward silhouette or scrolling.
- New Brawlers, powers and duplicates get the same honest buildup. Do not imply
  a rare drop through suspense length, color upgrades or a fake rarity ladder.
- Audio/haptics can reinforce the inhale/hold/snap later, but are not required
  to make this visual state work and are not implemented.

#### Shared state and safety

The existing opening presentation controller owns one finite sequence:
`closed -> saving -> open hold -> anticipation -> discovery`.
The reward is already committed before the open hold, never rolled during
the smoke. The added state owns presentation only.

- Use the same state and renderer for earned and practice chests, all four
  families, new items, powers and duplicates. Only the actively opening chest
  runs the effect; Vault tiles do not acquire individual smoke canvases.
- Retain the current reduced-motion behavior: show the saved receipt without
  this spatial sequence. Do not add a mandatory reduced-motion delay.
- A settled earned record stays a receipt and does not replay the ritual.
  Practice Open Again restores closed and starts a fresh cosmetic sequence.
- Back/navigation stays usable. Blur/background, reset, family changes and
  controls overlays stop/release the effect. Stale callbacks cannot expose the
  wrong chest or issue another grant. Do not catch up missed smoke on return.
- Failed or pending saves never emit the successful-opening effect. Keep the
  existing explicit error/retry path and exactly-once settlement.

#### Renderer and verification

[ChestBreach](../src/components/player/ChestBreach.tsx) uses one short-lived Skia
canvas: original open texture, three cubic vapor ribbons with noise breakup,
localized light and four authored neutral shutter pieces.
[Geometry and phase sampling](../src/components/player/chest-breach.ts) share
the controller's 650 + 800 ms linear clock. The 80 ms pressure hold freezes flow
and assembly, not merely the caption. This is stylized vapor, not fluid simulation.

The selected open texture preloads, but no canvas is mounted on closed, settled,
reduced-motion or obscured chests. Native and effect artwork readiness plus
measured layout gate the clock. Family changes invalidate readiness; native
paintings remain visible while the effect texture loads.

Seven affected suites / **79 tests pass**, with application/affected-test types,
affected-file lint and production web/Android/iOS Hermes exports passing.
Real browser captures cover all four gather/hold/discovery handoffs, one active
canvas and its release, unchanged practice saves, 320 x 568 non-scrolling layout,
controls/family-reset cancellation and system reduced motion. Tests cover real
new Brawlers, duplicates, powers, exactly-once saves, pending/failure/retry,
asset readiness, stale callbacks and blur/background settlement.
Physical-phone frame-time and memory acceptance remains open.

### Repeatable practice (implemented)

Vault provides four clearly labeled practice chests even with no matches.
An empty Vault defaults to Practice, while real pending chests default to Earned.
Practice uses the same scene with the board's Nightblade discovery and +15 rare
duplicate examples for every family. Its info control exposes family selection,
Reset study and Preview duplicate. Open Again restores the closed state.
The Equip preview is explicitly non-mutating. Examples never change inventory,
currency or records and do not represent family-specific odds.

## 8. Results and progression

- Outcome lettering stamps once; the winner has a small stable victory settle,
  not a long unskippable dance.
- Actual damage/accuracy/combo are readable immediately. Decorative count-up
  can finish within about 300 ms, but accessibility exposes final values once.
- XP/coins animate toward their HUD destinations only from a successfully saved
  reward record. These are presentation receipts, not additional grants.
- A real level-up receives one medallion/number transition. Revisiting history
  does not invent another level-up.
- Defeat has its own restrained treatment; non-forfeit loss rewards are still
  real. Forfeit does not show earned-chest/XP theatrics.

## 9. Shared safeguards and performance budget

### Lifecycle

Reuse the current system/app reduced-motion preference and focus/foreground
gating. Stop loops on blur, background and unmount. Returning to a screen shows
the current game state, not a replay of every missed celebration.

Own cosmetic clocks separately from question deadlines, battle progression,
storage transactions and reward generation. Animation completion callbacks must
not become a second source of truth for gameplay.

### Rendering

- One active ambient canvas per world scene; reuse the battle canvas in combat.
- Keep the existing pre-rasterized UI sigils. Do not allocate a graphics context
  per icon, particle, portrait or power.
- Initial mobile budget: roughly 8-12 ambient motes, two inexpensive smoke
  plumes, one personal Brawler effect; approximately 32-48 short-lived KO
  particles. These are starting caps, not reasons to fill every slot.
- Precompute alpha/particle masks and cache reusable paths/textures.
- Avoid large full-screen blur passes and per-frame React state updates.
- Target 60 fps on an agreed reference device. Measure before claiming it;
  reduce blur/particles and secondary effects before compromising input/timers.

### Readability and access

- No full-screen white flashes or repeated rapid contrast reversals.
- Camera shake is short, local to the arena and absent with reduced motion.
- Interactive target sizes and text layout never depend on an animation frame.
- Named states and outcome text remain understandable without motion or color.
- A Skip control is real, accessible and only skips decoration.

## 10. Implementation order and acceptance

### First by user reprioritization: chest ritual (implemented)

Reference closed/open paintings, transaction-aware timing, discovery states and
four repeatable Vault practice chests are complete. Focused tests and live browser
checks cover failed saves, repeated taps, all families, replay and saved reopen;
Android/iOS Hermes exports pass. Native-device frame/memory acceptance is open.

### Signature hit / vaporization KO / saved result (initial slice implemented)

The first connected slice is implemented: real published contact, source-aware
vaporization and a saved winner/progression tableau. The native/portable studios
no longer demonstrate a collapsed KO. The 1-second cosmetic tail preserves the
existing reveal budget; replay/resume cannot resurrect a settled loser. Saved
result history/forfeits stay static, real XP/level values remain authoritative,
and chest behavior is unchanged.

Next candidate: the Duel/VS + draft commitment bridge from section 11, followed
by equipment/socket interaction work. Physical-device performance acceptance and
authored secondary acting remain open.

### Arena alive and battle ambience (initial pass implemented)

Grounded painted breathing/posture, one personal effect per Brawler, two haze
layers, bounded motes and reactor light are implemented. All six were reviewed
at phone size; frame comparisons keep opaque foot pixels unchanged. The live
eight-question duel and existing timer tests pass. Authored cloth/facial motion,
physical-device frame-time/memory acceptance and broader interaction work remain.

### Later: interaction pass

Portrait focus/equip seal, socket engagement/replacement, navigation, draft/VS
and Career progress. Use the same timing vocabulary rather than unrelated
effects built screen by screen.

### Final acceptance

- Actual phone-sized clips for idle, interaction, battle, both KOs and all chest
  families; not just screenshots of posed frames.
- System/app reduced motion and focus/background cancellation verified.
- No hidden offscreen controls or masked question text.
- No reward/answer/damage/timer changes, double claims or late cancelled entry.
- Measure native-device frame timing and memory after repeated navigation.
- Do not label the complete motion pass finished until these are demonstrated.

## Current implementation references

- [Painted anatomy and mesh](../src/components/fighters/combat/painted-mesh.ts)
- [Combat presentation](../src/components/battle/combatPresentation.ts)
- [Combat stage and clock](../src/components/battle/CombatStage.tsx)
- [Motion lifecycle](../src/hooks/useBattleMotion.ts)
- [Chest state component](../src/components/player/RewardChest.tsx)
- [Chest opening lifecycle](../src/hooks/useChestOpening.ts)
- [Reference chest ritual](../src/components/player/ChestRitual.tsx)
- [Reference scene/duplicate builder](../scripts/build-chest-ritual.cjs)
- [Shared procedural atmosphere](../src/components/atmosphere/SceneAtmosphere.tsx)
- [Independent cosmetic clock](../src/hooks/useAmbientClock.ts)
- [Grounded painted idle](../src/components/fighters/combat/lobby-idle.ts)
- [Living Arena Brawler](../src/components/world/LivingBrawler.tsx)
- [Saved reward settlement](../src/store/player-store.ts)
- [Working world experience](WORLD_EXPERIENCE_IMPLEMENTATION.md)
- [Signature contact treatment](../src/components/battle/SignatureHit.tsx)
- [Vaporization timing/material](../src/components/battle/signature-motion.ts)
- [Source-aware painted breakup](../src/components/fighters/PaintedVaporization.tsx)
- [Saved winner/progress tableau](../src/components/battle/ResultTableau.tsx)

## 11. Signature motion director's pass (proposal)

**Implementation update:** the initial A/B/G vertical slice is now in the app:
painted-limb signal/ink contact, alpha-aware vaporization KO and a saved winner/
XP tableau. This does not mark the entire director's pass finished. C/D/E/F,
broader Career celebrations and new authored acting remain proposed. The HTML
animatics are still isolated composition studies, not recordings of gameplay.

### The creative leap

The current work makes the world alive. More ambient noise will not make it
memorable. The next pass should turn meaningful decisions and earned outcomes
into authored moments:

**Anticipation -> decisive graphic impact -> confident settle.**

Our own motion material is signal, rough ink, directional print masks and the
existing human paintings. A Brawler must feel like the owner of the effect, not
a static image behind generic fireworks. Keep reading quiet so the contrast
has value. Do not copy reference-game characters, moves, footage or branding.

The [interactive pitch](MOTION_SIGNATURE_PITCH.html) demonstrates three directions:
Signal Break, Break the Frame and Lock It In. It is an isolated design document,
not shipped gameplay. Its static cutouts illustrate composition and timing,
not newly authored limb animation or victory poses.

### The emotional hierarchy

| Layer | Job | Frequency / intensity |
| --- | --- | --- |
| Ambient | The world exists even when I do nothing | Low contrast; current idles/haze remain the foundation |
| Touch | The game felt my input | Immediate 60-100 ms response; never wait for a save to acknowledge touch |
| Commitment | My choice changed something | Short 240-600 ms material-specific seal, stamp or seating motion |
| Hero | That was my moment | One dominant hit/KO/entrance/earned progression treatment, not constant spectacle |

A hero treatment may suppress secondary graphic emphasis, never an actual
combat event, answer deadline or readable state. Avoid stacking multiple
full-screen celebrations. No reading-time camera movement, strobe or repeated
white flashes. Ordinary navigation remains faster and quieter than a KO.

### Seven proposed moments

#### A. Knowledge Becomes Force - signature hit

**Aha:** the answered question becomes a physical action in the arena.

- Tap locks the answer immediately with quiet input feedback.
- Do not show correctness, a damaging trail or a green success cue until the
  engine publishes the resolution. Independent opponent deadlines remain real.
- On the published hit, use a short signal trace toward the attacking Brawler,
  directional brush-smear accents anchored to the real action, then a sharp
  STRIKE frame at actual contact.
- Reuse the existing approximately 48 ms cosmetic pose hold; do not add another
  engine pause or stack a second hit-stop delay.
- Use one or two authored impact/smear frames and a controlled local recoil,
  not a spray of hundreds of generic particles.
- BLOCK is compression plus a shield ripple. A blocked or void hit does not
  pretend to deliver damage. Wrong answers do not invent attacks.
- Combo punctuation uses actual combo transitions, not every correct tap or an
  invented multiplier/reward.

Target: approximately 350-500 ms for the graphic treatment, inside the existing
resolution window. The actual action/contact clocks stay authoritative.

#### B. Signal Break - vaporization KO

**Aha:** the rival becomes signal; the winner and real background remain.

| Relative to finishing contact | Proposed beat |
| --- | --- |
| 0-80 ms | Readable last-hit/held silhouette and decisive KO lettering |
| 80-220 ms | Source-colored fracture edge; no folded corpse or ragdoll |
| 220-650 ms | Spatial dissolve through the painted alpha, revealing the real arena |
| 350-950 ms | Bounded source-colored fragments drift upward/outward and fade |
| Settled | Loser stays absent; ground residue dies away; winner remains readable |

Use the real last pose plus an alpha-aware effect. Particle origins must come
from the painted silhouette, not the rectangular source bounds. Existing
painted coverage is a starting point; precompute refined alpha/color anchors
offline rather than reading textures every frame. Start with a 32-48 particle
cap and reduce secondary fragments before compromising input or timers.

Trigger only on a real knockout, not a forfeit. Test either losing side and
settled outcome-only rendering. Resume, timer renders, history and navigation
must not resurrect the loser. Reduced motion removes/fades the loser without
spatial breakup, while preserving KO/outcome clarity.

#### C. Break the Frame - Duel into VS

**Aha:** my prepared Brawler becomes the protagonist of a matchup poster.

- The existing red Duel command gives an immediate sigil/plate response.
- A directional ink plane and Relay perspective lines lead into opposing
  Brawler banners. One condensed type beat, then VS stamps into place.
- The final category belt comes from the actual completed draft.
- Reuse time already spent in acquisition/readiness instead of adding a new
  mandatory cinematic page or fake matchmaking delay.
- Final matchup reveal requires valid preparation, real local-AI acquisition,
  durable match reservation and required artwork.
- Cancel stays immediate and cancels presentation. No late callback may enter
  battle; the battle clock still starts only on actual entry.

Target: approximately 550-800 ms once the required data/assets are ready,
skippable/non-blocking at the existing entry boundary. Reduced motion uses the
settled matchup composition.

#### D. Stamp the Decision - draft commitment

**Aha:** a category is decisively removed or added to the battle.

- Inspect/select: a quick crest focus, not a commitment animation.
- Ban: one angled ink scar and a few small chips.
- Pick: stamp the crest into its actual position in the five-category belt.
- Attribute AI choices to the AI. No invented countdown or fake second choice.
- Preserve the approved compact BAN/PICK plates and the current valid-state
  guards.

Target: 240-320 ms; the next valid interaction is not held hostage.

#### E. Own Your Entrance - saved Brawler equip

**Aha:** this is my identity, not a checked radio card.

- Inspect remains immediate and reversible.
- Once equip persists, a diagonal print mask reveals the original Brawler;
  personal sigil, name and a small saved seal land on separate beats.
- Do not stretch a face, turn a head or create a large gesture from a single
  painting. Use the existing stance until new poses/layers are authored.
- Locked content stays inspectable without fake unlocking. Failure keeps the
  prior persisted Brawler authoritative and exposes retry.

Target: 420-600 ms after successful save; success feedback is not optimistic.

#### F. Lock It In - physical power fit

**Aha:** the power seats into a real piece of my kit.

- Focus the chosen socket first.
- After persistence succeeds, the selected power glyph has a short anticipation,
  travels into the correct socket, seats, and receives one connection trace.
- A compact LOCKED IN seal follows the actual saved three-power tuple.
- Keep tap-based fitting; no required drag, precision gesture or long hold.
- A failed fit stays in inspection with the old loadout and clear recovery.
  Never invent cooldowns, extra power, a fourth socket or reward currency.

Target: 300-520 ms after save. The pitch's transition is simulated and does not
connect to player data.

#### G. Win the Composition - result/progression

**Aha:** I earned a moment worth looking at.

- VICTORY lands as a composed graphic frame around the real winning Brawler.
- Saved XP/resources move toward the actual destination HUD/bar, not a second
  grant. Only an actual level change receives a level-up emblem/number stamp.
- Keep real stats and Rematch available without a long unskippable count-up.
- Defeat has its own restrained composition. A forfeited match does not receive
  earned-chest/XP theatrics.
- Reopening history is a receipt, not another level-up event.
- The displayed competitive rank remains demo data; do not invent rank-ups.

Target: 600-900 ms for the tableau, with concise approximately 300 ms progress
interpolation. Never change progression values or add reward mechanics.

### Protected work - do not redesign again

The section 06 chest paintings/final layout remain protected. The implemented
Containment Break uses one 3200 ms cinematic clock instead of the rejected
650/800/250 ms crystal sequence.
Its layout, duplicate receipt, practice disclosures and settlement safeguards
are not a new spectacle playground. The corrected button geometry/types and
quiet Arena/battle atmosphere are also foundations to retain.

### Art and engineering requirements

| Need | What we can reuse | New work / honest limit |
| --- | --- | --- |
| Hit graphics | Current joint-driven attacks/contact cues, Bangers font, real combat canvas | Original short brush/smear masks and impact timing; no giant limb gesture without authored art |
| KO | Six painted alpha sources, existing coverage, finishing cue and outcome | Seeded dissolve/edge treatment, refined particle/color anchors, persistent absent-state presentation |
| Entrance/draft | Relay geometry, existing portraits, sigils, category belt and readiness flow | Original directional matte shapes and staggered type choreography |
| Equip/socket | Saved equipment validators/transactions and current icon family | Anchored glyph travel, saved seal and clear failed-save return |
| Result | Real saved result/XP/level and existing human artwork | Graphic tableau; distinct new victory poses require a separate authored art pass |

Prototype the timing with current art before commissioning expensive pose sets.
For premium secondary acting later, author real separated cloth/limb layers and
appropriate occlusion or new poses; do not sell mesh warping as full Arcane-level
character animation. Sound/haptics can reinforce these beats later but remain
separate opt-in scope, respecting mute and accessibility settings.

Use existing presentation clocks and the existing scene/combat canvas rather
than a canvas or global event bus per effect. Rendering callbacks never become
a second source of game truth. Stop decorative work on blur/background/unmount;
reduced motion presents the meaningful settled state. Never add decorative
latency to answer handling or a hidden reading-time camera effect.

### Proposed implementation order

1. **One signature resolution slice:** published hit -> vaporization KO -> saved
   victory tableau. Start with one representative pairing and both losing sides,
   prove timing/readability, then extend the shared treatment to all six.
2. **Commitment bridge:** Duel/VS plus draft stamps, using the same masks/type
   vocabulary, not a separate visual language.
3. **Everyday tactile loop:** Brawler equip and three-socket fitting.
4. **Truthful progression celebration:** actual XP/level/milestone transitions.
5. **Authored art polish and device acceptance:** poses, secondary acting,
   low-end frame-time/memory tuning.

This is a sequence recommendation, not a calendar estimate or a claim that the
proposed work has started. Durations are art-direction targets: fit existing
resolution/entry windows rather than extending gameplay timers.

### Acceptance - an Aha, not just more motion

- At 0.25x playback, anticipation, contact/commit and settle are distinct.
- A paused hero frame reads like an intentional poster at actual phone size.
- Ordinary reading/interaction remains calmer and faster than the hero moment.
- Faces retain identity, feet stay grounded and effects originate in the
  relevant Brawler/object rather than the whole screen.
- Correctness/damage/KO/equipment/progression feedback reflects authoritative
  state; failed saves, cancelled entry and settled reopen do not animate success.
- Both losing sides, reduced motion, blur/resume and repeated taps are checked.
- Actual phone-sized clips of the vertical slice and on-device frame/memory
  measurements are required before calling the production motion pass finished.
- A replayable document animatic is design evidence only, not gameplay or
  performance acceptance.

### Visual reference shelf

Checked 11 November 2026. These are source links, not copied/embedded footage.
The motion techniques and proposed adaptations below are design analysis, not
claims that these publishers endorse Brain Brawlers.

| Reference / source | Study this | Apply it here |
| --- | --- | --- |
| [Act 1 - Worlds 2024 OC / Riot Games](https://www.behance.net/gallery/257961169/Act-1-Worlds-2024-OC-Riot-Games), user-supplied Behance project | Painted staging, silhouette and selective editorial bursts | Hero hit/KO graphic compositions |
| [VALORANT Champions](https://buck.co/work/valorant-champions), BUCK's Riot Games case study | Forward momentum, perspective-grid transitions and bespoke type as one visual system | Duel/VS and commitment vocabulary |
| [Arcane Season 2 official opening](https://www.youtube.com/watch?v=4Po84baYfAA), Netflix Brasil | Pose composition, light and silhouette contrast | Deliberate Brawler/tableau staging; not an excuse to fake character acting |
| [Street Fighter 6 - Launch Trailer](https://www.youtube.com/watch?v=uYhg-xgdM94), official Xbox channel | Combat rhythm, readable fighters and graphic impact | Anticipation/contact/recovery during actual resolution |
| [2XKO VFX artist interview: Tyier Godette](https://www.vfxapprentice.com/blog/2xko-vfx-artist-interview-tyier-godette), VFX Apprentice with the Riot artist | Hand-painted effects, character-specific shapes and spatial/gameplay constraints | Source-aware KO fragments and truthful hit treatment |

Source verification: BUCK's project text was fetched directly; the Behance title
and embedded media were inspected in-browser; video titles/publishers were
checked through YouTube metadata; the 2XKO interview was fetched from its
canonical creator-interview page. No reference artwork/video was downloaded into
the repository. Revisit the source pages for the original moving references.
