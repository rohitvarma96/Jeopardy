# Human character art direction

The public game name is **Brain Brawlers** and human characters are **Brawlers**.
See [the identity build](BRAIN_BRAWLERS_IDENTITY.md) for the logo, punchy type units,
modern reward hardware and original painterly action key visual.

## VOLT / Arena Protocol

Mature, original human brawlers with natural adult proportions, expressive faces,
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

The same six local illustration sources are now used in Arena, selection,
preparation, discovery **and combat**. Combat no longer substitutes simplified
vector counterparts for the painted faces, outfits and equipment.
IDs, names, abilities, collection rarities and ownership behavior are preserved.

## Rendering and motion

`FighterArt` uses the full-body human illustration for static collection,
discovery and result surfaces. The living Arena opts into the painted mesh for
restrained breathing/posture while keeping its feet fixed.
`HumanCombatArt` draws the exact `humanFighters` texture on an articulated Skia
mesh. Per-Brawler shoulder/elbow/wrist/hip/knee/ankle controls are placed on
the actual source painting, not a generic replacement body. The rest mesh maps
the original pixels without distortion; facial vertices remain a rigid painted
region. Limb weights and support-foot correction retain independent action
timelines. Active KO holds an upright recoil and dissolves through the original
alpha, with source-colored fragments; no current presentation schedules a
collapsed body or a KO zoom-out.

Punches aim the painted forearm forward, kicks chamber/extend the leg, and the
same clothing/equipment moves with its owner. No whole-image-only combat fallback
or flat vector body is drawn. This is painted mesh animation, not newly authored
frame-by-frame poses or 3D models; extreme occlusion/cloth polish still needs
production animation work.

Rebuild alpha coverage after changing a source painting, then rebuild the
portable motion study:

```powershell
python .\scripts\build-painted-coverage.py
python .\scripts\build-brawler-fragments.py
node .\scripts\build-combat-study.cjs
```

Existing attack/special contact timestamps remain authoritative. Signature
signal/smear/ink contact, alpha-aware vaporization, bounded source fragments,
damage labels and shield compression now provide the treatment. Presentation never
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
