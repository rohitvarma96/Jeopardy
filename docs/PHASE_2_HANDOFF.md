# Phase 2 handoff - minimum MVP asset pipeline

## Delivered

Exactly three custom image assets: transparent Arcane, transparent Shadow and
one Mystic Arena. Both fighters are separate layers in the existing battle
route. Added an isolated asset gallery, three labeled Ionicons booster
controls, opaque question/health panels and a cosmetic hit-feedback button.
No gameplay, AI decision logic, match state, rewards or backend was added.

- [Asset preview](qa/phase2-asset-preview.jpg) (composition proof, not screenshot)
- [Manifest and missing-asset report](ASSET_MANIFEST.md)
- [Art direction and regeneration instructions](ART_DIRECTION.md)

In the app: Play preview -> continue to Battle arena, or open `/battle/arena`.
Use `View source assets` and `Preview hit feedback`. Booster presses report
that they are previews, not activations.

## Files and decisions

Created:
- `assets/images/fighters/arcane/full.png`
- `assets/images/fighters/shadow/full.png`
- `assets/images/arenas/mystic-arena.jpg`
- `src/assets/images.d.ts`, `src/assets/registry.ts`
- `src/components/battle/BattleAssetPreview.tsx`
- `scripts/prepare_assets.py`
- `docs/ART_DIRECTION.md`, `docs/ASSET_MANIFEST.md`, this handoff
- `docs/qa/phase2-asset-preview.jpg`

Modified:
- `src/components/navigation/JourneyScreen.tsx`
- `src/components/ui/Screen.tsx`
- `src/navigation/journey.ts`
- `README.md`

Deleted: none. Existing dependencies/SDK and previous routes preserved.
No new app dependency or lockfile change. One-time image tools were installed
locally; the reproducible optimizer requires only Pillow.

Use PNG alpha and opaque JPEG rather than assuming mobile WebP support.
Runtime payload is 986,522 bytes. Originals remain outside the bundle.
No portrait files, secondary arenas or decorative art were generated.
Full-spec exclusions are marked `POST_MVP_NOT_REQUIRED` in the manifest.

## Minimal validation results

| Check | Actual result |
|---|---|
| Asset inventory | No pre-existing artwork; only `.gitkeep` |
| Image metadata | Two 512 x 768 RGBA PNGs with alpha 0-255; one 1280 x 720 RGB JPEG |
| File/import inspection | All three explicit imports resolve to files |
| Composition proof | Visually inspected: two distinct full-body fighters, same arena, readable opaque UI |
| `npm run typecheck` | Passed, exit 0 |
| `npm run lint` | Passed, exit 0 after using a stable Animated value initializer compatible with the existing hooks lint rules |
| App dependency install | Not needed; no dependency changes |
| Automated test suites | Not run, per request |
| Android / iOS / bundle builds | Not run, per request; iOS hardware/simulator unavailable in this Windows session |

## Acceptance status

1. Separate fighters: **implemented; local image/composite inspection passed**.
2. Both in same arena: **implemented; composite inspection passed**.
3. Portrait composition: **implemented; static proof inspected; native layouts not tested**.
4. Readable UI: **opaque panels implemented; static proof inspected**.
5. Lightweight booster controls: **implemented; labeled minimum-48-point buttons; interaction not device-tested**.
6. UI combat feedback: **cosmetic demo implemented; motion cleanup/reduced-motion handling included; runtime not tested**.
7. All three integrated/documented: **passed**.
8. Works on iOS and Android: **NOT TESTED**. Compatible built-in formats/API
   selected, but no claim of verified native rendering is made.

## Remaining risks and missing items

No required MVP custom image is missing. All artwork awaits user approval.
Source arena is 1672 x 941 rather than the future 1920 x 1080 master target;
it was not falsely upscaled. Shadow is mirrored to face Arcane, reversing
her highlight direction. Edge/alpha inspection on native devices is pending.
Previous dependency audit advisories were not re-audited or changed.

This is an asset preview, not the playable MVP match. Gameplay and additional
animation sequences remain in later phases.

Stopped after Phase 2; awaiting approval for the next phase.
