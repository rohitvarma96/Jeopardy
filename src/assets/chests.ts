import type { ImageSourcePropType } from 'react-native';

import { createRng, hashSeed } from '../game/random';

export type ChestFamily = 'field' | 'arc' | 'overdrive' | 'sovereign';
export const CHESTS = {
  field: {
    name: 'Field Chest', detail: 'Slim graphite smart chest, flush red latch and a precise acid status strip.',
    accent: '#E9FF3C',
    closed: require('../../assets/images/chests/field-closed.png'),
    open: require('../../assets/images/chests/field-open.png'),
  },
  arc: {
    name: 'Arc Chest', detail: 'Faceted ivory ceramic shell, sloped lid and a recessed violet indicator.',
    accent: '#C4A4FF',
    closed: require('../../assets/images/chests/arc-closed.png'),
    open: require('../../assets/images/chests/arc-open.png'),
  },
  overdrive: {
    name: 'Overdrive Chest', detail: 'Aerodynamic red shell, carbon body, integrated vents and acid LED rails.',
    accent: '#FF596B',
    closed: require('../../assets/images/chests/overdrive-closed.png'),
    open: require('../../assets/images/chests/overdrive-open.png'),
  },
  sovereign: {
    name: 'Sovereign Chest', detail: 'Monolithic midnight shell, champagne titanium trim and a thin cyan light seam.',
    accent: '#9CE2EF',
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
