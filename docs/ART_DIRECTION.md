# MVP match art direction

Phase 2 is restricted by the current MVP brief to **three custom images**:
Arcane, Shadow and Mystic Arena. This overrides the full future-product
inventory in AST-03 through AST-09. No gameplay or backend is included.

## Visual language

- Painterly 2D fantasy arcade; midnight/navy/violet with controlled gold.
- Arcane: silver-haired scholarly mage, layered robes, staff, floating book.
- Shadow: agile dark-haired duelist, fitted dark-violet armor and twin blades.
- Shared full-body 2:3 proportions, front three-quarter perspective, warm key
  and violet rim lighting. Both feet and equipment remain visible.
- Arena: empty violet stone platform, central arch, distant columns and mist;
  no baked-in characters, text or UI.
- Fighter layers use `contain`; the arena uses centered `cover`. Shadow is
  mirrored in the battle composition to face Arcane. This also mirrors her
  directional highlights; review that artistic compromise before approval.
- Health and question content use opaque theme-colored panels, not text over
  busy artwork. The stage scales with available portrait width; the screen
  scrolls and respects safe areas.

## Scope and lightweight assets

Keep the existing Ionicons outline family for booster controls (50:50,
Extra Time and Mind Shield in this preview). Labels and 48-point minimum
targets accompany icons. Categories are text badges. Panels use design tokens.
No emoji or stock imagery substitutes are used.

Phase 5 uses Reanimated transforms on these static illustrations for entrance,
breathing, attack, hit and outcome poses. Attack trails, impact rings/slashes,
damage labels and the gold victory burst are code-driven views, not image
assets. Effects are confined to the arena, never over question/answer controls.
Reduced motion keeps static damage/answer/booster/combo labels and outcome
poses; blur, backgrounding and unmount cancel animation work. Gameplay remains
independent of all cosmetic timing.

Phase 6 represents the capsule with a labeled generic cube glyph, and
collectible rarity with text plus common/rare/epic token borders. Vault and
reward details reuse the existing full-body art and booster glyphs.
Sylva/Titan remain clearly labeled artwork placeholders. No reward, currency,
rarity, portrait or additional fighter artwork was produced.

## Formats and production

The two generated sources are 1024 x 1536 with real alpha. Runtime copies are
512 x 768 RGBA PNG. No portraits or derived portrait files were necessary.
The arena source is 1672 x 941 (below the future 1920 x 1080 master target);
the MVP runtime is a centered 1280 x 720 RGB JPEG. No fake upscaling was used.
JPEG is deliberate for an opaque background; PNG preserves fighter alpha.
Both formats use React Native's standard iOS/Android image pipeline, avoiding
unverified WebP/vector-image format differences.

Original generated PNGs remain outside the app bundle in the session image
directory, listed in the manifest. Runtime files are committed-ready local
assets; the app never loads remote URLs or external source paths.

Rebuild with Python and Pillow:

```powershell
python scripts\prepare_assets.py --arcane "<source.png>" --shadow "<source.png>" --arena "<source.png>"
```

The optimizer validates fighter aspect ratio/alpha and uses Lanczos resizing,
lossless optimized PNG and quality-88 optimized JPEG. Its output dimensions
match the typed static registry. Do not generate any other artwork.

## Review

Inspect the [composition proof](qa/phase2-asset-preview.jpg) and open
`/battle/arena` via Play preview. `View source assets` shows each source
independently against a contrasting panel.

Approval is pending. Static alpha/size inspection and composition review do
not replace native rendering checks. iOS and Android device checks were
intentionally not run in this phase at the user's request to minimize testing.
