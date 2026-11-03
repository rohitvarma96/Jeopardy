# Asset manifest

## Current combat assets

| Asset | Runtime source | Use / provenance |
|---|---|---|
| Mystic Arena | `assets/images/arenas/mystic-arena.jpg`, 1280 x 720 RGB JPEG | Existing opaque arena background, unchanged |
| Shared skeletal library | `src/components/fighters/combat/reference.json` | Original BB / 2D-Animation-Lab vector geometry, 19-bone rig, six shared actions and Frost special variant; source SHA-256 values included |
| Six character designs | `src/components/fighters/combat/roster.ts`, `FighterRig.tsx` | Adapted Ember/Frost armour plus new hoods, masks, antlers, plate, weapons and per-character palettes |
| Combat VFX | `src/components/battle/CombatStage.tsx` | Runtime Skia paths, circles, gradients, blur, particles, trails and elemental impacts; no image files |
| Interface glyphs | Existing Ionicons | Labeled boosters, categories, capsule and navigation; not substitute character artwork |

Fighter designs are Astral Sage (`arcane`), Nightblade (`shadow`), Thorn Ranger
(`sylva`), Iron Bastion (`titan`), Ember Sentinel (`ember`) and Frost Warden
(`frost`). The first four IDs remain stable for saved equipment, inventory and
match history. Every character has complete vector artwork; none is a placeholder.

All six characters use independent runtime commands: Idle, Attack, Block,
Knockback, Fall Down and Special Attack. No pair-specific animations, frame
captures, raster sprite sheets, remote URLs, Rive binaries or dynamic asset paths
are loaded. `FighterArt` draws the same rig statically in non-battle surfaces;
the live stage animates the rig and weighted cape on the UI thread.

## Reproduce the reference import

With the original local reference repository available:

```powershell
python scripts\import_combat_reference.py --source 'E:\Personal\BB\2D-Animation-Lab'
```

Only generated geometry and animation data are bundled; runtime never reads
outside the project. The importer fails explicitly on unsupported vector
primitives. It does not modify the reference repository.

## Retired assets and historical evidence

The previous `assets/images/fighters/arcane/full.png` (512 x 768 RGBA) and
`assets/images/fighters/shadow/full.png` (512 x 768 RGBA) are retained on disk
for history but have no runtime imports. Their Phase 2 AI-generated masters
were external to the application; no exclusive ownership is asserted.
The Sylva/Titan dashed missing-art frames have been removed.

Historical phase screenshots, APKs and `docs/qa/phase2-asset-preview.jpg`
show the previous raster presentation and are not validation of Skia.
The arena remains the existing 1280 x 720 downsample of its 1672 x 941 source;
it has not been artificially upscaled or replaced.

## Scope and verification

No separate portraits, category/booster/reward artwork, audio, remote fonts,
additional arena images or image-generation dependencies were added.
Skia 2.14.0 is the SDK-matched renderer; Reanimated and Worklets were already
project dependencies. See [art direction](ART_DIRECTION.md) for visual rules.

Native iOS and physical-device acceptance remain separate from host tests
and Metro exports. The existing [platform audit](PLATFORM_VERIFICATION.md)
is historical evidence for the previous renderer.
