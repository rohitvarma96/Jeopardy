import type { ImageSourcePropType } from 'react-native';

import arena from '../../assets/images/arenas/mystic-arena.jpg';

type BattleAsset = {
  source: ImageSourcePropType;
  label: string;
  width: number;
  height: number;
};

export const battleAssets = {
  arena: { source: arena, label: 'Mystic Arena', width: 1280, height: 720 },
} as const satisfies Record<string, BattleAsset>;
