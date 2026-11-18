# Brain Brawlers / Identity build

The public name is **Brain Brawlers**. Characters are **Brawlers**, never agents.
This revision implements identity assets, modern reward hardware, expressive
type units and original action key art; it does not claim that every scene in
the larger experience blueprint is already implemented.

## Logo

The first generated concept established a split-BB emblem and forward-leaning
stacked wordmark. Production assets are rebuilt as real font-independent vector
outlines, not an upscaled or automatically traced concept PNG.

- [Color SVG](../assets/images/brand/brain-brawlers-color.svg)
- [Chalk SVG](../assets/images/brand/brain-brawlers-chalk.svg)
- [Ink SVG](../assets/images/brand/brain-brawlers-ink.svg)
- Matching transparent 1100 x 350 PNGs and a 1024 x 1024 app icon live in
  [the brand assets](../assets/images/brand).

The emblem, negative-space cuts and line proportions are authored in
[the build script](../scripts/build-brand-assets.py). Letter outlines derive
from the locally bundled SIL-OFL Barlow Condensed ExtraBold; no remote font or
image dependencies exist in the SVGs. Rebuild with installed Python, Pillow
and fontTools:

```powershell
python .\scripts\build-brand-assets.py
```

Use the color/chalk versions on ink; use the ink version on chalk. Preserve
the 1100:350 ratio. No glow, fake metal bevel, word splitting, substitution or
independently stretched letterforms. Small labels remain readable system text.
The app's display name and icon change; its slug, deep-link scheme, package
name, collection IDs and local storage keys remain stable for compatibility.

## Typography units

`TypeUnit` combines a condensed lead-in, an offset action slab, a controlled
8-degree slant and a thin accent edge. Three sizes and signal/acid/chalk
treatments cover:

- **THINK FAST. / HIT HARDER.** Arrival and artwork.
- **THE FIGHT IS ON. / BRAWL READY.** Preparation and promotional moments.
- **WELL PLAYED. / VICTORY.** Actual won-match results.
- **NEXT TIME. / DEFEAT.** Actual losses, never a fake victory treatment.
- **REWARD HARDWARE. / PRECISION BUILT.** Chest design inspection.

The unit is static, not a flashing marquee. It is never used for question text,
answer choices, timer values or long instructions. It exposes a single meaningful
heading, or can be explicitly decorative. Body text remains readable and
device-scaled. Logo copies on artwork are decorative; the shared screen logo is
announced once.

## Artwork direction

[The original key visual](../assets/images/brand/brawlers-key-visual.jpg)
uses existing Brawler identities in a new action composition: Nightblade's
foreshortened punch, Astral Sage's star energy and Ember Sentinel's high kick.
Angular painted shadow planes, textured brushwork, red/violet/cyan rim light
and restrained screenprint grain create a fast, tactile animated-film feel.

This takes inspiration from painterly animation craft. It does not reproduce
Arcane characters, frames, environments or logos. The artwork is an original
generated composition, not a claim of exclusive copyright ownership.

Key art is integrated into the mode scene, restrained Arena texture and the
Brand studio. It is not substituted for the saved equipped Brawler and never
implies all depicted Brawlers are owned. Actual combat retains the working
joint-driven painted mesh using the exact six selection textures. The key visual
is promotional composition, not a replacement combat animation set.
Artwork is explicitly fitted to its measured panel, not drawn at its natural
pixel dimensions. Panels shorter than 115 logical pixels omit the decorative
punchline instead of clipping it; their logo and actual mode information remain.

## Modern chests

The four cosmetic families now use modern horizontal tech-chest construction:

| Family | Current design |
| --- | --- |
| Field | Slim graphite smart-equipment shell, integrated handles, flush red lock, acid status strip |
| Arc | Faceted ivory ceramic shell, sharply sloped lid, violet light channels and recessed indicator |
| Overdrive | Aerodynamic red shell, carbon body, integrated cooling vents and acid LED rails |
| Sovereign | Monolithic midnight shell, champagne titanium trim and thin cyan light seam |

Eight transparent closed/open state images replace the prior strap, crystal and
royal-trim concepts. These remain static paired state illustrations, not a
segmented continuous hinge animation. Family selection, loot odds, duplicate
conversion and exactly-once settlement do not change.

## Implementation and review

- Shared screen headers use `BrandLogo`; Expo's name/icon use the new identity.
- Arena, selection, roster, setup copy, rarity labels and reward copy say Brawler.
  Internal `fighter` types, IDs and route names remain for save/deep-link safety.
- **Arena -> Design lab -> Brand studio** previews color/mono logo, key art and
  type treatments without changing player data.
- **Chest forge** previews modern closed/open states with explicit preview labels.
- [The experience board](GAME_EXPERIENCE_BOARD.html) includes downloadable SVGs,
  key art, type specimens, renamed Brawler navigation and all eight chest states.

## Checks

```powershell
npm test -- --runTestsByPath tests\brand.test.tsx tests\arena-lobby.test.tsx tests\volt-design.test.tsx tests\combat-chests.test.tsx tests\fixed-game-layout.test.tsx
npm run lint
```

Validate SVG structure, transparent raster bounds and artwork/chest assets as
well as screen contracts. Browser checks cover compact and standard phone
viewports. Application and targeted tests are type-checked independently of
known historical round/clash test failures. JS/Hermes exports are not native
device acceptance.
