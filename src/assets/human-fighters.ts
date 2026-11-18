import type { ImageSourcePropType } from 'react-native';

import type { FighterId } from '../game/types/fighter';

export const humanFighters = {
  arcane: { source: require('../../assets/images/fighters/human/arcane.png'), width: 274, height: 492 },
  shadow: { source: require('../../assets/images/fighters/human/shadow.png'), width: 248, height: 483 },
  sylva: { source: require('../../assets/images/fighters/human/sylva.png'), width: 259, height: 491 },
  titan: { source: require('../../assets/images/fighters/human/titan.png'), width: 267, height: 492 },
  ember: { source: require('../../assets/images/fighters/human/ember.png'), width: 290, height: 495 },
  frost: { source: require('../../assets/images/fighters/human/frost.png'), width: 278, height: 496 },
} as const satisfies Record<FighterId, { source: ImageSourcePropType; width: number; height: number }>;
