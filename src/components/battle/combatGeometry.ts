import type { Side } from '../../game/battle';

export type StageGeometry = { width: number; height: number; fighterHeight: number };

export function actorPosition(side: Side, geometry: StageGeometry) {
  'worklet';
  return {
    x: geometry.width / 2 + (side === 'player' ? -1 : 1) * Math.min(geometry.width * .24, geometry.fighterHeight * .34),
    ground: geometry.height - (geometry.height < 120 ? 5 : 14),
    scale: geometry.fighterHeight / 480,
    direction: side === 'player' ? 1 : -1,
  };
}
