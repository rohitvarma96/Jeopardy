import type { FighterId } from '../../../game/types/fighter';
import { sampleHumanPose, type HumanJoint, type HumanPose } from './human-rig';
import coverage from '../../../assets/painted-coverage.json';

type Point = { x: number; y: number };
type Pair = readonly [number, number];
type Chain = readonly [Pair, Pair, Pair, Pair];
type Anatomy = {
  hip: Pair; neck: Pair; crown: Pair; backArm: Chain; frontArm: Chain; backLeg: Chain; frontLeg: Chain;
  attachment?: { joint: HumanJoint; bounds: readonly [number, number, number, number] };
};
type Bone = { joint: HumanJoint; parent: number; pivot: Point; end: Point };
type Weight = { bone: number; amount: number };
type Matrix = { a: number; b: number; c: number; d: number; x: number; y: number };
export type PaintedMesh = {
  bind: Point[]; textures: Point[]; indices: number[];
  weights: Weight[][]; bones: Bone[]; rest: HumanPose;
  support: Point;
};

/** Source-specific anatomy in normalized coordinates of the actual selection paintings. */
export const PAINTED_ANATOMY: Record<FighterId, Anatomy> = {
  arcane: {
    hip: [.49, .40], neck: [.48, .16], crown: [.48, .05],
    backArm: [[.20, .21], [.13, .33], [.25, .42], [.28, .44]],
    frontArm: [[.61, .22], [.65, .34], [.82, .31], [.89, .27]],
    backLeg: [[.42, .42], [.28, .68], [.15, .91], [.14, .98]],
    frontLeg: [[.56, .42], [.55, .67], [.61, .90], [.68, .97]],
    attachment: { joint: 'frontHand', bounds: [.71, .10, .99, .28] },
  },
  shadow: {
    hip: [.48, .38], neck: [.45, .16], crown: [.43, .05],
    backArm: [[.24, .23], [.17, .37], [.08, .47], [.07, .50]],
    frontArm: [[.62, .23], [.68, .37], [.73, .46], [.74, .49]],
    backLeg: [[.40, .40], [.32, .68], [.25, .90], [.20, .98]],
    frontLeg: [[.56, .40], [.68, .69], [.79, .90], [.81, .98]],
  },
  sylva: {
    hip: [.50, .40], neck: [.50, .17], crown: [.48, .05],
    backArm: [[.25, .22], [.20, .37], [.23, .48], [.25, .50]],
    frontArm: [[.66, .23], [.72, .33], [.88, .25], [.92, .23]],
    backLeg: [[.42, .42], [.30, .65], [.23, .90], [.18, .98]],
    frontLeg: [[.57, .41], [.60, .69], [.60, .91], [.68, .98]],
    attachment: { joint: 'frontHand', bounds: [.76, .10, 1, .25] },
  },
  titan: {
    hip: [.51, .44], neck: [.50, .16], crown: [.50, .05],
    backArm: [[.18, .23], [.12, .38], [.12, .47], [.15, .50]],
    frontArm: [[.76, .23], [.82, .38], [.89, .46], [.90, .49]],
    backLeg: [[.41, .45], [.35, .72], [.26, .91], [.23, .98]],
    frontLeg: [[.59, .45], [.66, .72], [.75, .91], [.82, .98]],
    attachment: { joint: 'backHand', bounds: [0, .48, .29, .75] },
  },
  ember: {
    hip: [.49, .40], neck: [.44, .17], crown: [.42, .06],
    backArm: [[.22, .23], [.18, .35], [.30, .39], [.33, .40]],
    frontArm: [[.62, .23], [.63, .34], [.78, .28], [.86, .25]],
    backLeg: [[.40, .41], [.29, .68], [.18, .91], [.16, .98]],
    frontLeg: [[.56, .41], [.62, .68], [.65, .91], [.70, .98]],
    attachment: { joint: 'frontHand', bounds: [.70, .14, .99, .28] },
  },
  frost: {
    hip: [.50, .43], neck: [.40, .17], crown: [.39, .05],
    backArm: [[.20, .22], [.13, .38], [.27, .41], [.30, .42]],
    frontArm: [[.63, .24], [.65, .36], [.80, .31], [.87, .28]],
    backLeg: [[.43, .44], [.37, .70], [.30, .91], [.25, .98]],
    frontLeg: [[.56, .44], [.55, .70], [.62, .92], [.68, .98]],
    attachment: { joint: 'frontHand', bounds: [.72, .13, 1, .31] },
  },
};

function distance(point: Point, from: Point, to: Point) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const t = Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / Math.max(1, dx * dx + dy * dy)));
  return (point.x - from.x - t * dx) ** 2 + (point.y - from.y - t * dy) ** 2;
}

export function createPaintedMesh(fighterId: FighterId, imageWidth: number, imageHeight: number): PaintedMesh {
  if (!Number.isFinite(imageWidth) || !Number.isFinite(imageHeight) || imageWidth <= 0 || imageHeight <= 0) {
    throw new RangeError('Painted combat requires valid source dimensions.');
  }
  const anatomy = PAINTED_ANATOMY[fighterId];
  const width = 480 * imageWidth / imageHeight;
  const point = ([x, y]: Pair): Point => ({ x: 260 + (x - .5) * width, y: 66 + y * 480 });
  const bones: Bone[] = [
    { joint: 'torso', parent: -1, pivot: point(anatomy.hip), end: point(anatomy.neck) },
    { joint: 'head', parent: 0, pivot: point(anatomy.neck), end: point(anatomy.crown) },
  ];
  const chain = (points: Chain, joints: readonly [HumanJoint, HumanJoint, HumanJoint], parent: number) => {
    const start = bones.length;
    for (let index = 0; index < 3; index++) bones.push({
      joint: joints[index], parent: index === 0 ? parent : start + index - 1,
      pivot: point(points[index]), end: point(points[index + 1]),
    });
  };
  chain(anatomy.backArm, ['backArm', 'backForearm', 'backHand'], 0);
  chain(anatomy.frontArm, ['frontArm', 'frontForearm', 'frontHand'], 0);
  chain(anatomy.backLeg, ['backThigh', 'backShin', 'backFoot'], -1);
  chain(anatomy.frontLeg, ['frontThigh', 'frontShin', 'frontFoot'], -1);
  const mask = coverage[fighterId];
  if (mask.width !== imageWidth || mask.height !== imageHeight) throw new Error('Painted source dimensions changed. Rebuild painted coverage.');
  const { columns, rows } = mask;
  const visible = new Set(mask.cells);
  const bind: Point[] = [], textures: Point[] = [], indices: number[] = [], weights: Weight[][] = [];
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const x = column / columns, y = row / rows, vertex = point([x, y]);
      const torsoProgress = Math.max(0, Math.min(1, (y - anatomy.neck[1]) / (anatomy.hip[1] - anatomy.neck[1])));
      const torsoLeft = (anatomy.backArm[0][0] + .09) * (1 - torsoProgress) + (anatomy.backLeg[0][0] - .10) * torsoProgress;
      const torsoRight = (anatomy.frontArm[0][0] - .09) * (1 - torsoProgress) + (anatomy.frontLeg[0][0] + .10) * torsoProgress;
      const attached = anatomy.attachment;
      bind.push(vertex);
      textures.push({ x: x * imageWidth, y: y * imageHeight });
      // Faces remain one rigid painted piece rather than bending across neighbouring arm weights.
      if (y <= anatomy.neck[1] && Math.abs(x - anatomy.neck[0]) < .2) {
        weights.push([{ bone: 1, amount: 1 }]);
      } else if (attached && x >= attached.bounds[0] && y >= attached.bounds[1] && x <= attached.bounds[2] && y <= attached.bounds[3]) {
        weights.push([{ bone: bones.findIndex((bone) => bone.joint === attached.joint), amount: 1 }]);
      } else if (y > anatomy.neck[1] && y < anatomy.hip[1] + .025 && x > torsoLeft && x < torsoRight) {
        weights.push([{ bone: 0, amount: 1 }]);
      } else {
        const belowHands = y > Math.max(anatomy.backArm[3][1], anatomy.frontArm[3][1], anatomy.hip[1]) + .06;
        const candidates = bones.map((bone, index) => ({ bone: index, score: distance(vertex, bone.pivot, bone.end) }))
          .filter((candidate) => !belowHands || candidate.bone === 0 || candidate.bone >= 8)
          .sort((a, b) => a.score - b.score).slice(0, 2);
        const scores = candidates.map((candidate) => 1 / (candidate.score + 25) ** 2);
        const sum = scores[0] + scores[1];
        weights.push(candidates.map((candidate, index) => ({ bone: candidate.bone, amount: scores[index] / sum })));
      }
      if (row < rows && column < columns && visible.has(row * columns + column)) {
        const a = row * (columns + 1) + column, b = a + 1, c = a + columns + 1, d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  return { bind, textures, indices, weights, bones, rest: sampleHumanPose('idle', 0, 3000, 0), support: point(anatomy.backLeg[3]) };
}

function transform(matrix: Matrix, point: Point): Point {
  'worklet';
  return { x: matrix.a * point.x + matrix.c * point.y + matrix.x, y: matrix.b * point.x + matrix.d * point.y + matrix.y };
}

function paintedTransforms(mesh: PaintedMesh, pose: HumanPose) {
  'worklet';
  const matrices: Matrix[] = [];
  for (const bone of mesh.bones) {
    const parent = bone.parent < 0 ? { a: 1, b: 0, c: 0, d: 1, x: 0, y: 0 } : matrices[bone.parent];
    let delta = pose.angles[bone.joint] - mesh.rest.angles[bone.joint];
    if (pose.action === 'attack' && (bone.joint === 'frontArm' || bone.joint === 'frontForearm')) {
      const desired = Math.PI / 2 + pose.angles.torso + pose.angles.frontArm
        + (bone.joint === 'frontForearm' ? pose.angles.frontForearm : 0);
      const source = Math.atan2(bone.end.y - bone.pivot.y, bone.end.x - bone.pivot.x);
      let aimed = desired - source - Math.atan2(parent.b, parent.a);
      while (aimed > Math.PI) aimed -= Math.PI * 2;
      while (aimed < -Math.PI) aimed += Math.PI * 2;
      delta += (aimed - delta) * pose.effort;
    }
    const cos = Math.cos(delta), sin = Math.sin(delta);
    const a = parent.a * cos + parent.c * sin, b = parent.b * cos + parent.d * sin;
    const c = parent.c * cos - parent.a * sin, d = parent.d * cos - parent.b * sin;
    const pivot = transform(parent, bone.pivot);
    matrices.push({ a, b, c, d, x: pivot.x - a * bone.pivot.x - c * bone.pivot.y, y: pivot.y - b * bone.pivot.x - d * bone.pivot.y });
  }
  const supportIndex = mesh.bones.findIndex((bone) => bone.joint === 'backFoot');
  const foot = transform(matrices[supportIndex], mesh.support);
  const collapse = Math.max(0, Math.min(1, (-pose.angles.torso - .5) / .85));
  const correctionX = (mesh.support.x - foot.x - pose.x) * (1 - collapse);
  const correctionY = (mesh.support.y - foot.y - pose.y) * (1 - collapse);
  return { matrices, collapse, correctionX, correctionY };
}

export function paintedAnchor(mesh: PaintedMesh, pose: HumanPose, joint: HumanJoint, along = 1): Point {
  'worklet';
  const index = mesh.bones.findIndex(bone => bone.joint === joint);
  if (index < 0) throw new Error(`Missing painted joint: ${joint}`);
  const bone = mesh.bones[index];
  const { matrices, correctionX, correctionY } = paintedTransforms(mesh, pose);
  const point = transform(matrices[index], {
    x: bone.pivot.x + (bone.end.x - bone.pivot.x) * along,
    y: bone.pivot.y + (bone.end.y - bone.pivot.y) * along,
  });
  return { x: point.x + pose.x + correctionX, y: point.y + pose.y + correctionY };
}

export function deformPaintedMesh(mesh: PaintedMesh, pose: HumanPose): Point[] {
  'worklet';
  const { matrices, collapse, correctionX, correctionY } = paintedTransforms(mesh, pose);
  let vertices = mesh.bind.map((point, index) => {
    let x = 0, y = 0;
    for (const weight of mesh.weights[index]) {
      const mapped = transform(matrices[weight.bone], point);
      x += mapped.x * weight.amount;
      y += mapped.y * weight.amount;
    }
    return { x: x + pose.x + correctionX, y: y + pose.y + correctionY };
  });
  if (collapse > 0) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const vertex of vertices) {
      minX = Math.min(minX, vertex.x); maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y); maxY = Math.max(maxY, vertex.y);
    }
    const scale = Math.min(1, 490 / Math.max(1, maxX - minX), 460 / Math.max(1, maxY - minY));
    const dx = 260 - (minX + maxX) / 2 * scale;
    const dy = 538 - maxY * scale;
    vertices = vertices.map((vertex) => ({
      x: vertex.x * (1 + (scale - 1) * collapse) + dx * collapse,
      y: vertex.y * (1 + (scale - 1) * collapse) + dy * collapse,
    }));
  }
  return vertices;
}
