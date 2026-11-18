import type { ImageSourcePropType } from 'react-native';

import { createRng, hashSeed } from '../game/random';

export type ChestFamily = 'field' | 'arc' | 'overdrive' | 'sovereign';
export const CHESTS = {
  field: {
    name: 'Field Chest', detail: 'Graphite steel, red straps and a square signal latch.',
    accent: '#E9FF3C',
    closed: require('../../assets/images/chests/field-closed.png'),
    open: require('../../assets/images/chests/field-open.png'),
  },
  arc: {
    name: 'Arc Chest', detail: 'Ivory arch lid, ceramic panels and a violet crystal lock.',
    accent: '#C4A4FF',
    closed: require('../../assets/images/chests/arc-closed.png'),
    open: require('../../assets/images/chests/arc-open.png'),
  },
  overdrive: {
    name: 'Overdrive Chest', detail: 'Reinforced red braces, dark vents and acid power rails.',
    accent: '#FF596B',
    closed: require('../../assets/images/chests/overdrive-closed.png'),
    open: require('../../assets/images/chests/overdrive-open.png'),
  },
  sovereign: {
    name: 'Sovereign Chest', detail: 'Obsidian, warm gold armor and a ruby signal crest.',
    accent: '#E6BB72',
    closed: require('../../assets/images/chests/sovereign-closed.png'),
    open: require('../../assets/images/chests/sovereign-open.png'),
  },
} as const satisfies Record<ChestFamily, {
  name: string; detail: string; accent: string; closed: ImageSourcePropType; open: ImageSourcePropType;
}>;

export const CHEST_FAMILIES: readonly ChestFamily[] = ['field', 'arc', 'overdrive', 'sovereign'];

/** Container styling is stable and has no influence on the existing loot roll. */
export function chestFamilyFor(seed: number, matchId: string): ChestFamily {
  const random = createRng(hashSeed('chest-skin-v1', seed, matchId));
  return CHEST_FAMILIES[Math.floor(random() * CHEST_FAMILIES.length)];
}
