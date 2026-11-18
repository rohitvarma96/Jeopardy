# Asset manifest

## Current human character artwork

Original generated adult human illustrations. The reference images informed
the broad painted/graphic treatment only; no reference characters, logos,
outfits or weapon designs are copied. No exclusive copyright claim is made.

| ID | Bundled PNG under `assets/images/fighters/human/` | Dimensions |
| --- | --- | --- |
| `arcane` | `arcane.png` | 274 x 492 RGBA |
| `shadow` | `shadow.png` | 248 x 483 RGBA |
| `sylva` | `sylva.png` | 259 x 491 RGBA |
| `titan` | `titan.png` | 267 x 492 RGBA |
| `ember` | `ember.png` | 290 x 495 RGBA |
| `frost` | `frost.png` | 278 x 496 RGBA |

The sources are statically required in `src/assets/human-fighters.ts`, with
explicit dimensions. `FighterArt` and `HumanCombatArt` share this registry.
The six PNGs have transparent backgrounds and full-body silhouettes; they are
not screenshots or animation-frame captures.

## Runtime support

| Asset | Runtime source / purpose |
| --- | --- |
| Human combat motion | `human-rig.ts` / `HumanCombatArt.tsx`: articulated vector anatomy, inverse kinematics and existing contact clocks |
| Combat VFX | Existing Skia paths, circles, gradients, blur, particles, trails and impacts |
| Battle environment | `assets/images/arenas/relay-fight-stage.jpg`, 1774 x 887; original painted shared-floor arena |
| Four chest families | `assets/images/chests/`, eight painted closed/open PNGs: Field, Arc, Overdrive, Sovereign |
| Impact lettering | `assets/fonts/Bangers-Regular.ttf`, SIL OFL bundled alongside |
| Interface glyphs | Existing Ionicons; generic categories, powers and navigation, not character substitutes |
| Barlow Condensed ExtraBold | `assets/fonts/BarlowCondensed-ExtraBold.ttf`, SIL OFL bundled alongside |
| Space Mono Regular | `assets/fonts/SpaceMono-Regular.ttf`, SIL OFL bundled alongside |
| Browser graphics | Installed CanvasKit copied locally by `postinstall` into ignored `public/canvaskit.wasm` |

No runtime CDN, generated asset URLs, remote fonts, backend or image-generation
package is added. Native entry remains Expo Router; browser entry initializes
local CanvasKit before importing any Skia-dependent routes.

## Retained historical resources

The previous raster fighters, Mystic Arena image, old vector `FighterRig`,
skeletal reference geometry and import script are retained as historical
resources. The active character renderers no longer draw the mascot-like rigs;
the reference action metadata still supplies cosmetic contact timing. Earlier phase
screenshots and APKs are not evidence of this new artwork or fixed-page UX.

No changes to saved IDs, inventory, passives, damage, timers, progression,
capsule probabilities or duplicate conversion accompany the artwork change.
See [art direction](ART_DIRECTION.md) and [the design system](VOLT_DESIGN_SYSTEM.md).
Native iOS/Android device acceptance remains open.
