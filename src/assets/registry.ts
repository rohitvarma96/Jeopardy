import type { ImageSourcePropType } from 'react-native';

import arena from '../../assets/images/arenas/relay-fight-stage.jpg';

type BattleAsset = {
  source: ImageSourcePropType;
  label: string;
  width: number;
  height: number;
};

export const battleAssets = {
  arena: { source: arena, label: 'The Relay fight stage', width: 1774, height: 887 },
} as const satisfies Record<string, BattleAsset>;
