import type { ImageSourcePropType } from 'react-native';

import type { FighterId } from '../game/types/fighter';
import arcane from '../../assets/images/fighters/arcane/full.png';
import shadow from '../../assets/images/fighters/shadow/full.png';
import arena from '../../assets/images/arenas/mystic-arena.jpg';

type BattleAsset = {
  source: ImageSourcePropType;
  label: string;
  width: number;
  height: number;
};

export const battleAssets = {
  arcane: { source: arcane, label: 'Arcane, player mage', width: 512, height: 768 },
  shadow: { source: shadow, label: 'Shadow, AI opponent', width: 512, height: 768 },
  arena: { source: arena, label: 'Mystic Arena', width: 1280, height: 720 },
} as const satisfies Record<string, BattleAsset>;

/**
 * Full-body fighter art. `null` = artwork not produced; UI must render the labeled placeholder
 * recorded in docs/ASSET_MANIFEST.md, never another fighter's image.
 */
export const fighterArt = {
  arcane: { source: arcane, width: 512, height: 768 },
  shadow: { source: shadow, width: 512, height: 768 },
  sylva: null,
  titan: null,
} as const satisfies Record<FighterId, Omit<BattleAsset, 'label'> | null>;
