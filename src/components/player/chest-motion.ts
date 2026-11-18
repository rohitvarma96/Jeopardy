export const CHEST_OPEN_MS = 650;
export const CHEST_ANTICIPATION_MS = 800;
export const CHEST_PRESENTATION_MS = 3200;
export const CHEST_DISCOVERY_MS = 250;
export const CHEST_CHARGE_END = .25;
export const CHEST_SKIP_MS = 140;

function ramp(value: number, from: number, to: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function chestFrame(progress: number) {
  'worklet';
  const p = Math.max(0, Math.min(1, progress));
  const hinge = ramp(p, .25, .66);
  return {
    latch: ramp(p, 0, .08) * (1 - ramp(p, .25, .4)),
    charge: ramp(p, .08, .25),
    hinge,
    angle: hinge * Math.PI * .54,
    glow: ramp(p, .27, .58) * (1 - ramp(p, .82, 1) * .55),
    particles: ramp(p, .45, .6) * (1 - ramp(p, .77, 1)),
  };
}

type Point = { x: number; y: number };
type Pair = readonly [number, number];
export type ChestGeometry = {
  width: number; height: number; padding: number;
  hinge: readonly [Pair, Pair]; depth: Pair; lift: number;
  latch: Pair; mouth: readonly Pair[];
};

/** Project a lid about its back hinge; the chest base never moves. */
export function projectChestLid(point: Point, geometry: ChestGeometry, angle: number): Point {
  'worklet';
  const [a, b] = geometry.hinge;
  const ux = b[0] - a[0], uy = b[1] - a[1], [vx, vy] = geometry.depth;
  const det = ux * vy - uy * vx;
  const dx = point.x - a[0], dy = point.y - a[1];
  const s = (dx * vy - dy * vx) / det;
  const t = (ux * dy - uy * dx) / det;
  return {
    x: a[0] + s * ux + t * vx * Math.cos(angle),
    y: a[1] + s * uy + t * (vy * Math.cos(angle) - geometry.lift * Math.sin(angle)),
  };
}

export function chestLidVertices(geometry: ChestGeometry, progress: number) {
  'worklet';
  const { angle } = chestFrame(progress);
  return [
    projectChestLid({ x: 0, y: 0 }, geometry, angle),
    projectChestLid({ x: geometry.width, y: 0 }, geometry, angle),
    projectChestLid({ x: 0, y: geometry.height }, geometry, angle),
    projectChestLid({ x: geometry.width, y: geometry.height }, geometry, angle),
  ];
}
