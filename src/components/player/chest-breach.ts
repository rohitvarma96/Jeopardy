import type { ChestFamily } from '../../assets/chests';
import { CHEST_PRESENTATION_MS } from './chest-motion';

export const CHEST_BREACH = {
  field: { width: 615, height: 300, closedHeight: 300, mouth: { x: 300, y: 169 }, frontY: 188 },
  arc: { width: 615, height: 310, closedHeight: 310, mouth: { x: 310, y: 161 }, frontY: 186 },
  overdrive: { width: 615, height: 310, closedHeight: 310, mouth: { x: 300, y: 144 }, frontY: 169 },
  sovereign: { width: 615, height: 358, closedHeight: 358, mouth: { x: 306, y: 141 }, frontY: 165 },
} as const satisfies Record<ChestFamily, {
  width: number; height: number; closedHeight: number; mouth: { x: number; y: number }; frontY: number;
}>;
export type BreachGeometry = (typeof CHEST_BREACH)[ChestFamily];

function ramp(time: number, from: number, to: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, (time - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function breachFrame(progress: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, progress)) * CHEST_PRESENTATION_MS;
  const release = ramp(t, 1250, 1500), clear = ramp(t, 2050, 2950);
  const motionTime = t >= 1000 && t < 1250 ? 1000 : t >= 1250 ? t - 250 : t;
  return {
    phase: t < 350 ? 'isolate' : t < 1000 ? 'pressure' : t < 1250 ? 'hold'
      : t < 1500 ? 'rupture' : t < 2200 ? 'volume' : t < 2650 ? 'emerge' : t < 3200 ? 'receipt' : 'complete',
    time: motionTime,
    grade: ramp(t, 0, 350) * (1 - ramp(t, 2700, 3200)) * .88,
    copy: 1 - ramp(t, 0, 350),
    push: 1 + ramp(t, 0, 1000) * .08 * (1 - ramp(t, 1500, 2650)),
    seam: ramp(t, 150, 850) * (1 - release),
    shell: 1 - ramp(t, 0, 350) * (1 - release) * .5,
    opened: t >= 1375,
    release,
    sheet: ramp(t, 1375, 1470) * (1 - ramp(t, 1850, 2400)),
    vapor: ramp(t, 1375, 1675) * (1 - clear),
    spread: ramp(t, 1450, 2500),
    chest: 1 - ramp(t, 2150, 2630),
    reward: ramp(t, 2200, 2650),
    rewardLight: ramp(t, 2180, 2370) * (1 - ramp(t, 2500, 2820)),
    receipt: ramp(t, 2650, 2980),
    impulse: t >= 1300 && t < 1460 ? Math.sin((t - 1300) / 160 * Math.PI) * 2 : 0,
  };
}

export function breachLayout(width: number, height: number, geometry: BreachGeometry, fullStage = false) {
  'worklet';
  const scale = fullStage ? Math.min(width * .84 / geometry.width, height * .36 / geometry.height)
    : Math.min(width / geometry.width, height / geometry.height);
  const x = (width - geometry.width * scale) / 2;
  const y = fullStage ? height * .35 + (height * .36 - geometry.height * scale) / 2 : (height - geometry.height * scale) / 2;
  return { scale, x, y, floor: y + geometry.height * scale };
}

export function containmentMouth(progress: number, width: number, height: number, geometry: BreachGeometry, fullStage = true) {
  'worklet';
  const f = breachFrame(progress), fit = breachLayout(width, height, geometry, fullStage);
  return {
    x: width / 2 + (geometry.mouth.x - geometry.width / 2) * fit.scale * f.push,
    y: fit.floor + (geometry.mouth.y - geometry.height) * fit.scale * f.push + f.impulse,
    rimY: fit.floor + (geometry.frontY - geometry.height) * fit.scale * f.push + f.impulse,
  };
}

export function containmentCloud(progress: number, index: number, width: number, height: number,
  geometry: BreachGeometry = CHEST_BREACH.field, fullStage = true) {
  'worklet';
  const f = breachFrame(progress), t = Math.max(0, Math.min(1, progress)) * CHEST_PRESENTATION_MS;
  const mouth = containmentMouth(progress, width, height, geometry, fullStage);
  const growth = ramp(t, 1375, index === 2 ? 1660 : 2200), side = index === 0 ? -1 : index === 1 ? 1 : 0;
  const span = width * ((index === 2 ? .16 : .12) + growth * (index === 2 ? .32 : .65));
  const tall = width * ((index === 2 ? .05 : .03) + growth * (index === 2 ? .66 : .53));
  return {
    x: mouth.x + side * width * (.035 + f.spread * .26),
    y: mouth.y - tall * .41,
    width: span, height: tall,
    opacity: index === 2 ? f.sheet * .84 : f.vapor * (index === 0 ? .88 : .76),
  };
}

export const CONTAINMENT_VAPOR_SHADER = `
uniform shader vapor;
uniform float startX;
uniform float time;
uniform float depth;
half4 main(float2 p) {
  float2 local = p - float2(startX, 0);
  float2 drift = float2(
    sin(local.y * .025 - time * 2.1) * 8.0 + sin(local.y * .067 + time) * 3.0,
    cos(local.x * .018 + time * 1.7) * 5.0);
  float2 q = local + drift;
  if (q.x < 0 || q.x > 511 || q.y < 0 || q.y > 383) return half4(0);
  half4 color = vapor.eval(q + float2(startX, 0));
  float sideLight = .78 + .22 * sin(q.x * .01 + q.y * .014 - time * .8);
  return half4(color.rgb * sideLight * depth, color.a);
}`;
