# Human character art direction

## VOLT / Arena Protocol

Mature, original human agents with natural adult proportions, expressive faces,
angular painted shading, tailored street-tech clothing and controlled electric
rim lighting. No chibi bodies, giant mascot heads, generic fantasy helmets,
borrowed characters, game logos or copied outfits. Knowledge and energy devices
replace firearms.

| Fighter / stable ID | Human identity |
| --- | --- |
| Astral Sage / `arcane` | Silver-haired celestial strategist; asymmetric chalk/violet coat and star-data device |
| Nightblade / `shadow` | Short-haired infiltrator; charcoal streetwear, crimson scarf and crescent bracers |
| Thorn Ranger / `sylva` | Botanical scout; tied-back hair, olive field jacket and plant scanner |
| Iron Bastion / `titan` | Defensive engineer; broad silhouette, ivory utility coat and shield generator |
| Ember Sentinel / `ember` | Copper-haired solar specialist; orange utility jacket and amber light pulse |
| Frost Warden / `frost` | Silver-streaked glacial analyst; structured blue-gray coat and holographic device |

These are original generated illustrations, not copies of the reference game's
characters. A six-character master was separated into transparent PNGs; there
is no runtime generation, external art service or asset download.

The same six local illustration sources are used in Arena, the hero picker,
mode selection, matchmaking, fighter selection and reward details. Combat uses
articulated human vector counterparts with matching identities and palettes.
IDs, names, abilities, collection rarities and ownership behavior are preserved.

## Rendering and motion

`FighterArt` uses the full-body human illustration for non-battle surfaces.
`HumanCombatArt` now draws jointed human anatomy with independent shoulders,
elbows, wrists, hips, knees and ankles, plus torso/head movement. Inverse
kinematics plants stance feet; punches extend the arm, kicks chamber/extend the
leg, and knockouts hold a collapsed pose. Existing clocks supply contact timing.
This is a working faceted/vector rig, not finished painted or 3D animation.
The old mascot renderer and whole-PNG motion are no longer used for combat.

Existing attack/special contact timestamps, charge, trails, impact rings,
particles, damage labels and shield feedback remain. Presentation never
calculates damage, changes answers or gates battle progression. The shared
animation data remains the timing source, not a new game mechanic.

Reduced motion retains static informative artwork and numeric feedback, without
loops, travelling effects or shake. App settings cannot override system reduction.
Image/font decoding failures are explicit errors, not missing-art success states.

## Environment and interface

The active battle stage uses an original painted side-on industrial platform,
distant city, shared floor and central red reactor. Chalk, ink, signal red
and acid yellow belong to the interface; elemental effects can retain distinct
fighter colors. Do not recolor every character into a uniform neon silhouette.

The interface is fixed to the viewport. The combat atelier uses section and
item pagination, not scrolling controls. Replay, motion preference, both
fighters, all six actions and fixture selection remain reachable.

See [the design system](VOLT_DESIGN_SYSTEM.md) for native components, navigation,
responsive behavior, color contrast and verification limits. Native device
acceptance remains separate from browser and Jest evidence.

See [combat and chests](COMBAT_AND_CHESTS.md) for action typography, resolution
composition, four hinged chest families and the portable joint-motion study.
