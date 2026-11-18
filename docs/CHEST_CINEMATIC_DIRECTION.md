# Chest cinematic direction - Containment Break

Status: **Containment Break is implemented in the shared chest flow.**
The rejected crystal/ribbon renderer is replaced, not enlarged. Physical-device
visual/performance acceptance and optional audio/haptics remain open.

## Implementation checkpoint

- One 3200 ms clock controls the closed-chest grade/push, 250 ms held breath,
  release, actual saved reward emergence and receipt. The closed/open paintings
  and saved reward are distinct presentation states; no extra transaction occurs.
- Three original tapered vapor silhouettes share a 1536 x 384 RGBA atlas
  (2.25 MiB decoded). Four source-alpha seam-light mattes fit the closed shells.
  Rebuild with `python scripts\build-containment-art.py`.
- After feedback, pre-open vapor was removed entirely. Smoke begins only when
  the original open painting appears at 1375 ms. Every plume grows from its
  chest-specific projected mouth, rather than appearing as a large screen sheet.
- Rear vapor sits behind the lid; front vapor is clipped at the projected
  front rim, which is repainted above its base. A source-safe Skia material
  advects the internal texture/light without sampling neighboring atlas pieces.
  This is layered stylized volume, not fluid simulation or a 3D smoke system.
- The effect's initial placement/brightness matches the static painting, so
  starting it does not introduce a positional or darkening pop. Navigation and
  practice disclosures remain fixed above the stage.
- Actual Brawler/power/duplicate art preloads after settlement and gates the
  shared clock. First identity appears at 2200 ms; actions/receipt at 2650 ms.
  The canvas is released at 3200 ms; settled receipts do not replay an entrance.
- Reduced motion and interruptions settle to the saved receipt without
  catch-up. Practice remains non-mutating; pending/failed saves never run the
  success sequence. Incoming asset failures are explicit and family-keyed.

Implementation: [stage renderer](../src/components/player/ChestBreach.tsx),
[phase/mouth sampler](../src/components/player/chest-breach.ts),
[shared ritual](../src/components/player/ChestRitual.tsx) and
[asset builder](../scripts/build-containment-art.py).

Verification: seven affected suites / 81 tests passed; final alignment changes
also passed four focused suites / 38 tests. Application/affected-test types,
affected-file lint and web/Android/iOS Hermes exports pass. An isolated real
browser verified all four mouths, compact layout, earned new-Brawler/power/
duplicate settlement and unchanged settled reload, practice unchanged data,
controls/family-reset cancellation, reduced motion and back navigation.
The preview uses the actual implementation, not an independent animatic.

## 1. The creative correction

**This is a pressurized vault, not a magic gift box.**

The current treatment fails because the chest opens before there is tension,
the room and large headline keep competing for attention, and small symmetrical
wisps assemble a decorative crystal. An 80 ms hold barely registers. The reveal
then changes scenes rather than feeling caused by the opening.

Bigger ribbons, more bloom and a longer timer would amplify the wrong idea.
Drama comes from controlling what the player can see, withholding motion,
establishing mass, then breaking the restraint.

The intended emotional arc:

**Something is contained -> it is resisting -> everything stops -> the seal
breaks -> the real reward occupies the space.**

No floating crystal, orbiting charm, confetti, rainbow buildup, numerical charge
meter, elastic bounce or permanent laser column.

## 2. One directed sequence, not a bag of effects

Target **3.2 seconds from successful save and complete presentation readiness
to the readable reward receipt**. This is a starting edit, not a measured
shipping duration. Saving is outside this timing and must never be disguised.

| Time | Shot / emotional job | Picture and motion |
| --- | --- | --- |
| 0-350 ms | **Isolate** - stop reading the menu; look at the object | The room drops into near-black charcoal. The closed chest keeps a narrow rim light. The large headline recedes. A deliberate stage-camera push of roughly 6-8% begins; navigation does not move. |
| 350-1000 ms | **Resist** - establish pressure and weight | Light leaks through the actual lid seam and catches the underside of the shell. One low, asymmetric vapor leak escapes sideways, then is pulled back. The chest stays planted; a tiny shell-only strain may occur, never a floating/bouncing box. |
| 1000-1250 ms | **The held breath** - let the absence become uncomfortable | The push stops. The light contracts to a razor seam. Smoke nearly stops. A genuine 250 ms quiet hold: no extra particles, flashing text or pulsing glyph filling the silence. |
| 1250-1500 ms | **Containment breaks** - one decisive event | A low, dense sheet of vapor tears across the opening. The seam light cuts through it. Switch to the approved open painting inside this motivated occlusion. One bounded chest/stage impulse, not repeated screen shake, a white flash or wobbling UI. |
| 1500-2200 ms | **Occupy the room** - make the release feel substantial | Two unequal banks of heavy vapor roll outward and down, with a much faster thin upper curl. Backlight carves a central opening. The open chest remains visible at the base; the effect has depth and scale rather than looking like two smoke stickers. |
| 2200-2650 ms | **First read** - the actual reward becomes undeniable | A rim-light/matte reveals the already-saved Brawler painting or power emblem in the cleared center. Use the actual item, not an anonymous human shape. No character silhouette for a power and no invented character motion. The chest and vapor relinquish the foreground. |
| 2650-3200 ms | **Own the image** - finish on a composed reward, not an effect | Resolve to the existing discovery framing. Name, rarity and saved receipt appear in a controlled stagger; the initial item/category label accompanies first visibility. Last wisps clear the face and action. The final image is held cleanly; do not keep fireworks running behind it. |

The important contrast is **slow resistance -> real stillness -> fast rupture
-> weighted recovery**. Not every layer moves at the same speed.

This replaces the earlier 650 + 800 + 250 ms choreography. It is not
a request to insert another pause into the existing crystal sequence.

## 3. Art direction

### Cinematography

- One continuous stage, not a visible cut from a chest effect to an unrelated
  reward page. The camera approaches the object and yields to the reward.
- Use negative space. At peak anticipation, the brightest small feature is the
  chest seam; at reveal, it becomes the reward's edge and then its face/emblem.
- Keep Return to Vault and practice controls fixed, visible and usable above
  the grade. Fade decorative copy, not essential navigation or disclosures.
- Measure framing at 320 x 568 first. A full-stage effect surface must not be
  clipped to the chest image rectangle, overflow the viewport or hide the HUD.
- No more than one short, low-amplitude stage impulse. No gyro dependency,
  full-screen strobe or repeated brightness oscillation.

### Materials and light

- Industrial pressure, dense cold vapor, graphite shadows and a hard,
  off-white interior light. Family accents are small reflections, not six
  competing neon effects.
- Smoke has an irregular painted silhouette, soft internal depth and broken
  thin edges. Use different masses and speeds, not mirrored curls or blurred
  circles pretending to be volume.
- A bright seam must illuminate a corresponding shell edge. Smoke casts/
  receives believable local light. Do not float an emissive sprite above a
  perfectly unlit object.
- Preserve the approved chest shape, materials and original paintings.
  Custom light/mouth/occlusion mattes must fit each of the four designs.

### The reveal is the payoff

- New Brawler: reveal the actual adult human painting at a strong, readable
  scale. No stretching, invented head turn, or generic vector silhouette.
- Power: reveal its actual emblem; use the same cinematic grammar, not a
  fake Brawler first.
- Duplicate: reveal the actual saved item, then resolve into the existing
  grayscale/shard receipt. Do not announce a new unlock or conceal duplicate
  status until after a celebratory Equip prompt.
- Keep buildup duration and pressure language the same across all families/
  rarities. This must not become a deceptive rarity roulette or near-miss.
- The final action is usable when the item and its meaning are visible. Do not
  delay it behind the last cosmetic wisp.

## 4. Sound is a multiplier, not a substitute

Suggested eventual sound edit: low enclosure resonance -> a strained latch/
pressure hiss -> a sudden dip -> one dry mechanical report with a short bass
tail -> a sparse reveal accent.

Sound assets, rights, playback and an opt-in haptic implementation are **not
present or approved by this strategy**. Build a convincing silent picture first.
Respect mute/volume preferences; never autoplay a new audio track as a shortcut
to making weak visuals feel dramatic. Haptics, if separately built, should be
one deliberate release event, not continuous buzzing.

## 5. Production strategy - do not start with another code-only effect

1. **Make four original styleframes at phone scale:** restrained closed chest,
   held seam, release at maximum volume, actual reward emerging. Show them
   together; the sequence must already feel mature without motion.
2. **Author the missing material:** one coherent painted smoke pack with
   slow/fast/occluding layers and source-specific shell-light/seam mattes.
   Do not assume the current cubic ribbons can be dressed up into this look.
3. **Cut a silent, real-time animatic** using the actual Field Chest and actual
   reward painting, including a power and duplicate variant. The 250 ms hold
   and the cut concealed by vapor must survive normal-speed viewing.
4. **Review the visual proof before runtime adoption.** If the frames still
   read as a cute spell, change the art/edit rather than increasing particles.
5. **Integrate Field first** into one finite stage presentation. Use the
   existing Skia/Reanimated stack where practical; a new runtime or fluid
   simulation is not assumed. Reuse masks and a small shared effect atlas;
   decide final dimensions from the proof and phone memory measurements.
6. **Fit the other three chest mouths/light edges**, then validate actual
   earned and practice flows. Do not ship one generic centered emission.

The smoke/light pack and runtime choreography are now produced. No new sound
library, 3D model or downloaded franchise assets were added.

## 6. Required presentation changes and preserved rules

The old renderer conflated `opened` with visible painting selection and confined
the effect to the chest box. The new shared ritual makes the distinction:

`closed -> saving -> saved / restrained closed pose -> pressure hold ->
painted open / rupture -> actual reward emerging -> settled receipt`

The actual saved record becomes authoritative before any successful opening
cinematic. Keeping the lid visually closed for the pressure beat must not
pretend the transaction is still pending or call settlement a second time.
Once saved, no back/reload path can reroll or lose the reward.

- Use one shared stage clock/composition for chest, atmosphere and reward
  handoff. No separately drifting timers or unmount gap at the reveal.
- Only the actively opening chest owns one effect canvas. Vault tiles remain
  ordinary images. Include the incoming reward art/mattes in readiness.
- Pending/failed saves stay honest and expose existing retry. They do not
  play the success-pressure/release sequence.
- Back, reset, family change, modal, blur/background and asset errors retain
  explicit recovery. Drop a cancelled cinematic; do not replay missed drama.
- Reduced motion shows the actual saved receipt without camera travel,
  pressure movement, impact or an enforced 3.2-second wait.
- A settled earned record stays a receipt, not another unlock performance.
  Practice remains non-mutating and clearly labeled.
- Preserve save identifiers, loot odds, duplicate conversion, equipment and
  exactly-once grants. No new reward mechanics or false buffs.

## 7. Definition of done

- Four frames look like one mature, authored sequence at phone size.
- The chest reads as heavy and pressurized, not buoyant or enchanted.
- The hold registers without feeling like loading; the rupture is the single
  strongest motion event.
- At peak smoke the composition has a focal point; at discovery the face/
  emblem, item identity and action are unobstructed.
- Silent playback works. Extra glow/audio cannot rescue a failed animatic.
- The four chest designs, Brawler/power/duplicate, repeated practice, saved
  receipt reload, save failure, interruption and reduced motion all pass.
- Verify the actual fresh browser build and final device captures, not only
  mathematical bounds or a stale hot-reload page. Measure native GPU/texture
  cost before claiming mobile performance.

## 8. Craft references

- [BUCK / VALORANT Champions](https://buck.co/work/valorant-champions):
  purpose-built texture, forward momentum, perspective and a unified motion
  system. Studio case study rechecked for this strategy; not chest footage.
- [Arcane S2 official opening](https://www.youtube.com/watch?v=4Po84baYfAA):
  selective light, deliberate silhouettes and strong held compositions.
  Previously verified official Netflix Brasil reference; not a loot sequence.

Borrow craft and restraint, not franchise art, audio, characters or exact edits.
