import { humanFighters } from '../../../assets/human-fighters';
import type { FighterId } from '../../../game/types/fighter';
import { createPaintedMesh, type PaintedMesh } from './painted-mesh';

const meshes: Partial<Record<FighterId, PaintedMesh>> = {};

/** Immutable CPU skinning data, bounded to the six bundled paintings. */
export function paintedMeshFor(fighterId: FighterId) {
  const existing = meshes[fighterId];
  if (existing) return existing;
  const art = humanFighters[fighterId];
  const mesh = createPaintedMesh(fighterId, art.width, art.height);
  meshes[fighterId] = mesh;
  return mesh;
}
