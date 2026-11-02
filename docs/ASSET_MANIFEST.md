# MVP asset manifest

## Inventory and status

Before Phase 2, `assets` contained only `.gitkeep`; there was no existing game
artwork. Exactly three custom images were generated. `NEEDS_REVIEW` means
integrated, awaiting user art approval and native-device visual verification.

| Stable ID | Runtime path | Pixels | Format / alpha | Use | Source / owner | Status | Bytes / optimization |
|---|---|---|---|---|---|---|---|
| fighter.arcane.full | `assets/images/fighters/arcane/full.png` | 512 x 768 | PNG RGBA; alpha 0-255 | Player in battle; isolated gallery; Arena Home selected fighter, Fighter select and Matchmaking opponent card (Phase 3) | AI-generated for this project; source A | NEEDS_REVIEW | 478,929; Lanczos downsample, lossless PNG |
| fighter.shadow.full | `assets/images/fighters/shadow/full.png` | 512 x 768 | PNG RGBA; alpha 0-255 | AI fighter; isolated gallery; Arena Home, Fighter select and Matchmaking opponent card (Phase 3) | AI-generated using A as style reference; source B | NEEDS_REVIEW | 364,257; Lanczos downsample, lossless PNG; mirrored in composition |
| arena.mystic | `assets/images/arenas/mystic-arena.jpg` | 1280 x 720 | JPEG RGB; opaque | Shared background for both fighters | AI-generated for this project; source C | NEEDS_REVIEW | 143,336; centered 16:9 crop, quality 88 |

Total custom runtime image payload: **986,522 bytes (963.4 KiB)**.
All references are explicit imports in `src/assets/registry.ts`; no dynamic
image paths, remote fetches, placeholder image files or platform-specific files.
No ownership/licensing exclusivity is asserted for AI output.

### Placeholders (Phase 3)

Fighter selection must offer all four fighters (PH-06), so Sylva and Titan
show a UI-rendered placeholder from `src/components/fighters/FighterArt.tsx`:
a dashed 2:3 frame with the fighter's Ionicons glyph, the visible text
"Placeholder art pending" and the accessibility label "{Name} artwork
placeholder. Final artwork pending." Fighter select also shows a
"Placeholder art" badge. No file path is created or referenced;
`fighterArt.sylva` and `fighterArt.titan` are `null` in the registry.

| Missing asset ID | Status | Required specification (AST-03) | Dependent screens |
|---|---|---|---|
| fighter.sylva.full | PLACEHOLDER (missing artwork) | 1024 x 1536 px minimum (2:3), transparent PNG master, optimized PNG/WebP runtime; front 3/4, centered, feet visible; runtime path following the existing convention: `assets/images/fighters/sylva/full.png` | Fighter select; Arena Home when Sylva is saved; Matchmaking card for Thornwatch |
| fighter.titan.full | PLACEHOLDER (missing artwork) | Same as Sylva; `assets/images/fighters/titan/full.png` | Fighter select; Arena Home when Titan is saved; Matchmaking card for IronAegis |

Category and booster cards use generic Ionicons glyphs plus text labels (listed
in `src/data/categories.ts` and `src/data/boosters.ts`). They are UI icons, not
substitutes for the category/booster artwork excluded below.

### Source provenance (outside the app bundle)

Session image directory:
`C:\Users\rohit\.copilot\session-state\97f1bcb2-52de-4685-940b-721312f5e08a\images`

- A: `image-b885a1e4d76c6d54.png`; 1024 x 1536.
- B: `image-3513e2d91dd0fa7e.png`; 1024 x 1536.
- C: `image-fb4c35ec3d1a097f.png`; 1672 x 941.

Fighter transparency was already present in generated files; no background
substitution or local segmentation was applied. Source C is below the future
1920 x 1080 master specification; actual dimensions are retained honestly.
Archive these external originals separately if moving the project.

### Derived crops and review evidence

- Portraits: **none generated or exported**. A future portrait may crop A/B;
  it must not introduce new artwork.
- Arena: small centered aspect correction to 16:9, then downsample.
- `docs/qa/phase2-asset-preview.jpg`: 780 x 1320 composition proof assembled
  from the three runtime files. Not a fourth custom asset, not bundled, and
  not a native screenshot. It omits the in-app icon glyphs/animation.

## Explicitly excluded artwork

All rows below have status **POST_MVP_NOT_REQUIRED**. No files/imports are
created for them; dimensions/format/path are N/A until future scope approval.

| Future asset IDs / family | MVP replacement or decision |
|---|---|
| fighter.sylva.portrait, fighter.titan.portrait | Full-body placeholder frame only (see Placeholders) |
| fighter.arcane.portrait, fighter.shadow.portrait, separate battle crops | Full-body art is scaled in Phase 3 cards; no crops or extra files |
| arena.ancient-colosseum, all additional arenas | One shared Mystic Arena |
| booster.50-50, extra-time, second-chance, double-damage, mind-shield, streak-saver artwork | Existing Ionicons; no raster artwork |
| category.science, sports, history, movies-tv, space, technology, geography, music | Text labels plus generic Ionicons glyphs in the draft |
| reward.mystery-capsule, treasure-chest, coin, shard, fighter/booster thumbnails | Phase 6 cube-outline capsule, textual currencies and existing fighter/booster UI; no custom reward images |
| rarity.common, rarity.rare, rarity.epic | Token borders/badges, no custom frames |
| effect.attack, impact, victory, defeat | Phase 5 Reanimated transforms and code-driven trails/rings/slashes/burst; no artwork files |
| brand.wordmark, emblem, app-icon, home-hero, decorative illustrations | Text branding; no custom art in this phase |
| sound/music | Not required; no audio |

## Missing-asset report and platform status

- Required custom MVP images missing: **2** since Phase 3
  (`fighter.sylva.full`, `fighter.titan.full`), shown as labeled placeholders.
- Phase 3 adds no image files. Arcane/Shadow art is reused at 120-150 point
  heights in cards; small-size legibility is not device-verified.
- Phase 4 adds no image files. The live battle screen
  (`src/components/battle/BattleScreen.tsx`) uses the arena background and
  both fighters' art (placeholders for Sylva/Titan). It replaces
  `BattleAssetPreview.tsx`, which was removed.
- Phase 5 adds no image files. `BattleScene.tsx` reuses the same three runtime
  images for battle, Results and isolated development animation previews.
  Fighter movement and all combat effects are code-driven Reanimated/UI
  layers. Existing Sylva/Titan placeholders remain unchanged; no additional
  artwork, crop, icon image or arena was produced.
- Phase 6 adds no image files. Capsules use a labeled generic cube icon;
  common/rare/epic items use text and token borders. Existing fighter art and
  booster glyphs are reused in reward details and Vault. Sylva/Titan keep the
  same labeled placeholders when collected; no substitute artwork was added.
- Required native checks missing: **iOS and Android visual/runtime checks**.
- Pending artistic review: all three assets, including Shadow's mirrored light
  direction and the arena source's reduced master resolution.
- PNG alpha metadata and image dimensions verified locally; composite visually
  inspected. Standard PNG/JPEG chosen for both platforms, but device rendering,
  memory use and precise native layout are **NOT TESTED**.
- All future-product artwork is excluded, not silently reported as missing.
