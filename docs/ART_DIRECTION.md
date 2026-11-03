# Combat art direction

## Visual language

An illustrated fantasy duel: inked contours, bevelled plate, layered fabric,
elemental rim light and restrained gold against the retained midnight-violet
Mystic Arena. Readable full-body silhouettes take priority over particle density.
Equipment and faces remain character-specific, including in compact layouts.

| Warrior | Silhouette / palette | Weapon | Special |
|---|---|---|---|
| Astral Sage | Tall crescent hood, flowing violet robes, antique gold | Living-star staff | Astral Convergence |
| Nightblade | Narrow masked profile, short crimson scarf, charcoal armour | Twin crescent blades | Eclipse Requiem |
| Thorn Ranger | Branching antlers, leaf mantle, green/brown leathers | Thornbow | Verdant Tempest |
| Iron Bastion | Broad ivory plate, tall crest, blue tabard | Warhammer and tower shield | Dawnfall Judgment |
| Ember Sentinel | Bronze plate, flame crest, sweeping crimson cape | Solar greatsword | Solar Cataclysm |
| Frost Warden | Swept ivory horns, silver plate, teal mantle | Glacial axe | Winterbreak Ascension |

These are the same designs in the lobby, hero picker, mode card, matchmaking,
fighter selection, live battle, results and reward details. No missing-art
placeholders or old raster fighters are used.

## Reference adaptation

BB / 2D-Animation-Lab was inspected before implementation: its original Ember
and Frost contours, 19-bone hierarchy, three weighted cape bones, state-machine
transitions, contact frames and special variants inform this renderer.

`scripts/import_combat_reference.py` reproducibly imports the original vector
geometry and skeletal keys from that local repository into
`src/components/fighters/combat/reference.json`. Source hashes are recorded
there. The importer does not use captures or rasterize animation frames.

Skia replaces the reference's Rive-specific rendering layer, avoiding an
additional native runtime. The shared animation channels remain reusable.
New silhouettes, weapons and palettes extend the two original designs;
independent per-side command timelines allow all character/action pairings.

## Motion and VFX

- Idle: quiet chest breathing, weighted cape sway and restrained ambient motes.
- Attack: anticipation, weapon strike at the authored contact frame, recovery.
- Block: a closing guard, timed shield glyph and small contact recoil.
- Knockback: lifted backward arc, articulated limbs, cushioned landing.
- Fall Down: stagger, complete collapse, settling dust, held downed pose.
- Special Attack: charge, beam or aerial-roll variant, elemental impact,
  controlled glow and recovery. No added damage or gameplay mechanic.

Reanimated runs a shared exchange clock on the UI thread. Skia transforms the
bones and deforms each weighted cape vertex from its bind pose. Non-idle
transitions blend for 70 ms. Weapon trails, particles, impact rings, energy
bursts and limited arena shake align with the same authored contact timestamp.
Glacial crystals, leaf bursts and eclipse/astral/solar accents use each
warrior's palette. No animation depends on an opponent-specific asset.

Presentation consumes only published battle resolutions. Void attacks have no
effects; blocked and zero-damage hits do not invent knockback. Cosmetics fit
inside the existing 2.2-second reveal window, never gate answers or progression,
ignore touch input and remain clipped to the arena.

The Skia stage is retained across preview replays and ignores timer-only React
renders; shared clocks, not repeated scene reconstruction, drive motion.
Outcome feedback uses small top-corner pills so a downed character stays visible
even in the compact arena.

Reduced motion shows static informative poses and numeric feedback, without
particles, travelling trails, loops or shake. Blur, background and unmount
cancel animation work. The app cannot override the system motion preference.

## Review

In development, open `/battle/animation-preview` (Combat atelier), or use
Animation preview on Results. Both sides independently select six warriors
and six actions while the stage remains visible above the scrolling controls.
Replay exchanges, test shield contact and held falls, switch to live battle
fixtures, and inspect reduced motion. The header explicitly identifies motion
versus still presentation. This route cannot mutate the match store.

The original phase screenshots document the old renderer. Native iOS,
physical-device appearance and comparative frame-rate measurements require
separate acceptance; Jest and JavaScript exports are not native evidence.

Current evidence: 164 focused Android/iOS preset tests, application/focused-test
TypeScript, repository lint and both production Hermes exports pass. Android
Expo Go emulator checks covered six designs, articulated strikes/guards, live
Skia effects, held falls, the unchanged setup journey, automatic battle
progression and knockout/result rendering at 390x844 and 360x640. This was not
a physical-device, native iOS or frame-rate acceptance test. The full-repository
typecheck remains blocked by unrelated, pre-existing round/clash test APIs.
