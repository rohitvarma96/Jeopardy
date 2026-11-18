import type { FighterId } from '../../../game/types/fighter';
import { AMBIENT_PERIOD_MS } from '../../atmosphere/motion';
import { deformPaintedMesh, PAINTED_ANATOMY, type PaintedMesh } from './painted-mesh';

function smooth(from: number, to: number, value: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function deformLobbyIdle(mesh: PaintedMesh, fighterId: FighterId, time: number) {
  'worklet';
  const phase = time / AMBIENT_PERIOD_MS * Math.PI * 2;
  const breath = (1 - Math.cos(phase * 6)) * .5;
  const lean = Math.sin(phase * 2) * .005;
  const pose = {
    ...mesh.rest,
    angles: {
      ...mesh.rest.angles,
      torso: mesh.rest.angles.torso + lean,
      head: mesh.rest.angles.head - lean,
      frontArm: mesh.rest.angles.frontArm + Math.sin(phase * 4) * .004,
      backArm: mesh.rest.angles.backArm - Math.sin(phase * 4) * .003,
    },
  };
  const vertices = deformPaintedMesh(mesh, pose);
  const anatomy = PAINTED_ANATOMY[fighterId];
  const hip = anatomy.hip[1], neck = anatomy.neck[1], pivot = mesh.bones[0].pivot.x;
  return vertices.map((point, index) => {
    const y = (mesh.bind[index].y - 66) / 480;
    const upper = 1 - smooth(hip, hip + .1, y);
    // Both feet and the lower silhouette stay in the original painted stance.
    if (upper === 0) return mesh.bind[index];
    const head = mesh.weights[index].length === 1 && mesh.weights[index][0].bone === 1;
    const torso = mesh.weights[index].reduce((sum, weight) => sum + (weight.bone === 0 ? weight.amount : 0), 0);
    const chest = smooth(neck, neck + .05, y) * (1 - smooth(hip - .05, hip + .05, y));
    return {
      x: mesh.bind[index].x + (point.x - mesh.bind[index].x) * upper
        + (head ? 0 : (point.x - pivot) * breath * .012 * chest * torso),
      y: mesh.bind[index].y + (point.y - mesh.bind[index].y) * upper - breath * 1.5 * (head ? 1 : upper),
    };
  });
}
