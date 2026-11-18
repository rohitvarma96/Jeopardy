import type { FighterId } from '../../../game/types/fighter';
import type { CombatAction } from './actions';

export type HumanJoint = 'torso' | 'head' | 'backArm' | 'backForearm' | 'backHand'
  | 'frontArm' | 'frontForearm' | 'frontHand' | 'backThigh' | 'backShin' | 'backFoot'
  | 'frontThigh' | 'frontShin' | 'frontFoot';
export type HumanPose = {
  x: number; y: number;
  action: CombatAction; effort: number;
  angles: Record<HumanJoint, number>;
};
type Paint = 'skin' | 'shade' | 'hair' | 'cloth' | 'dark' | 'panel' | 'accent' | 'metal' | 'ink';
type Shape = { path: string; fill: Paint; stroke?: Paint; width?: number };
export type HumanPart = {
  name: HumanJoint; parent: HumanJoint | null; x: number; y: number; shapes: readonly Shape[];
};
export type HumanDesign = Record<Paint, string> & { hairPath: string; longCoat: boolean };
export const HUMAN_ORIGIN = { x: 260, y: 311, ground: 540 } as const;

export function humanAdvance(distance: number) {
  'worklet';
  return Math.max(0, distance - 230);
}

export const HUMAN_DESIGNS: Record<FighterId, HumanDesign> = {
  arcane: {
    skin: '#9D6853', shade: '#613E39', hair: '#D5D5DC', cloth: '#282734', dark: '#141722',
    panel: '#D8D8D6', accent: '#A58DFF', metal: '#828D9B', ink: '#10131D', longCoat: true,
    hairPath: 'M-25 -24 L-31 -49 L-20 -66 L-8 -73 L-11 -64 L8 -75 L5 -65 L24 -67 L19 -58 L30 -55 L20 -48 L-5 -51 L-17 -32 Z',
  },
  shadow: {
    skin: '#D7A18B', shade: '#915B5B', hair: '#1C1B29', cloth: '#33313B', dark: '#151923',
    panel: '#44454F', accent: '#FF405E', metal: '#8E96A0', ink: '#10131D', longCoat: false,
    hairPath: 'M-25 -14 L-34 -40 L-25 -61 L-6 -71 L17 -66 L30 -51 L5 -50 L-7 -26 L-5 -46 L-20 -23 Z',
  },
  sylva: {
    skin: '#BC8662', shade: '#75563F', hair: '#403026', cloth: '#69734B', dark: '#29382C',
    panel: '#A7AD79', accent: '#B5DE64', metal: '#899386', ink: '#10131D', longCoat: false,
    hairPath: 'M-27 -20 L-35 -43 L-26 -63 L-7 -70 L18 -65 L28 -53 L-6 -48 L-21 -31 L-31 -5 L-45 20 L-47 -7 Z',
  },
  titan: {
    skin: '#AC7859', shade: '#674838', hair: '#29252A', cloth: '#D4D0BC', dark: '#333A42',
    panel: '#F1ECD8', accent: '#D3AE65', metal: '#959A9F', ink: '#10131D', longCoat: true,
    hairPath: 'M-25 -31 L-28 -52 L-14 -65 L12 -67 L27 -55 L26 -47 L0 -51 L-18 -42 Z',
  },
  ember: {
    skin: '#CD9270', shade: '#8E574A', hair: '#AB572F', cloth: '#B9512C', dark: '#382C31',
    panel: '#E17B3C', accent: '#FFD36B', metal: '#A79480', ink: '#10131D', longCoat: false,
    hairPath: 'M-26 -18 L-36 -39 L-29 -57 L-16 -57 L-15 -70 L1 -67 L12 -75 L20 -64 L34 -60 L29 -49 L6 -48 L-14 -32 L-20 -12 Z',
  },
  frost: {
    skin: '#D1BAB0', shade: '#8A8595', hair: '#BBC7D7', cloth: '#60758C', dark: '#283747',
    panel: '#C4D7DC', accent: '#9CE2EF', metal: '#AFBEC9', ink: '#10131D', longCoat: true,
    hairPath: 'M-26 -25 L-32 -47 L-21 -64 L-4 -73 L-9 -60 L18 -72 L14 -61 L31 -60 L23 -49 L-5 -48 L-20 -28 Z',
  },
};

const arm: readonly Shape[] = [
  { path: 'M-18 -7 Q0 -17 19 -3 L14 67 L9 84 L-12 82 L-17 57 Z', fill: 'cloth', stroke: 'ink', width: 3 },
  { path: 'M-14 3 L-4 -6 L2 62 L-8 71 Z', fill: 'panel' },
  { path: 'M7 10 L17 0 L12 65 L4 77 Z', fill: 'dark' },
];
const forearm: readonly Shape[] = [
  { path: 'M-12 -7 L12 -6 L14 26 L10 73 L-8 76 L-13 37 Z', fill: 'dark', stroke: 'ink', width: 3 },
  { path: 'M-9 12 L7 5 L10 29 L5 55 L-8 59 Z', fill: 'cloth' },
  { path: 'M-9 54 L10 52 L9 66 L-8 69 Z', fill: 'accent' },
];
const hand: readonly Shape[] = [
  { path: 'M-9 -2 L10 -3 L16 5 L17 19 L10 29 L-6 28 L-13 18 L-12 8 Z', fill: 'skin', stroke: 'ink', width: 2 },
  { path: 'M-11 0 L10 -2 L12 6 L-8 10 Z', fill: 'dark' },
  { path: 'M1 9 L14 8 M1 15 L15 14 M1 21 L12 20 M-8 10 L-3 15 L-5 23', fill: 'skin', stroke: 'shade', width: 1.5 },
];
const thigh: readonly Shape[] = [
  { path: 'M-22 -8 L20 -9 L22 24 L16 91 L11 116 L-13 117 L-23 74 Z', fill: 'dark', stroke: 'ink', width: 3 },
  { path: 'M-16 0 L-4 -3 L-6 84 L-13 101 L-19 64 Z', fill: 'cloth' },
  { path: 'M4 13 L19 7 L18 51 L8 57 Z', fill: 'panel' },
  { path: 'M-16 82 L14 80 L12 96 L-13 101 Z', fill: 'metal' },
];
const shin: readonly Shape[] = [
  { path: 'M-13 -6 L13 -6 L17 16 L11 95 L6 110 L-11 110 L-17 63 Z', fill: 'dark', stroke: 'ink', width: 3 },
  { path: 'M-9 5 L10 2 L12 25 L4 61 L-8 70 Z', fill: 'cloth' },
  { path: 'M-9 28 L7 24 M-10 42 L5 38 M-10 56 L4 52', fill: 'cloth', stroke: 'metal', width: 2 },
];
const foot: readonly Shape[] = [
  { path: 'M-12 -24 L9 -25 L16 -12 L37 -8 L44 1 L40 9 L-20 9 L-23 3 L-19 -8 Z', fill: 'dark', stroke: 'ink', width: 3 },
  { path: 'M-15 -6 L8 -9 L14 -3 L35 0 L34 4 L-17 4 Z', fill: 'metal' },
  { path: 'M-8 -21 L5 -21 L9 -11 L-10 -10 Z', fill: 'cloth' },
];

export const HUMAN_PARTS: readonly HumanPart[] = [
  { name: 'backThigh', parent: null, x: -18, y: 0, shapes: thigh },
  { name: 'backShin', parent: 'backThigh', x: 0, y: 116, shapes: shin },
  { name: 'backFoot', parent: 'backShin', x: 0, y: 114, shapes: foot },
  { name: 'torso', parent: null, x: 0, y: 0, shapes: [
    { path: 'M-13 -181 L15 -180 L20 -143 L-15 -139 Z', fill: 'skin', stroke: 'ink', width: 2 },
    { path: 'M-42 -143 L-18 -160 L22 -157 L44 -137 L34 -65 L28 -8 L-29 -6 L-40 -58 Z', fill: 'cloth', stroke: 'ink', width: 3 },
    { path: 'M-18 -158 L-5 -132 L-11 -44 L-30 -8 L-34 -67 L-29 -147 Z', fill: 'panel' },
    { path: 'M19 -154 L3 -131 L10 -40 L28 -9 L34 -69 L31 -144 Z', fill: 'dark' },
    { path: 'M0 -126 L7 -110 L3 -30 L-1 -31 Z', fill: 'metal' },
    { path: 'M-40 -135 L-26 -145 L-18 -118 L-32 -107 Z', fill: 'accent' },
    { path: 'M-32 -15 L31 -17 L32 2 L-32 4 Z', fill: 'dark', stroke: 'ink', width: 2 },
    { path: 'M-7 -16 L9 -16 L11 -1 L-8 0 Z', fill: 'metal' },
  ] },
  { name: 'head', parent: 'torso', x: 2, y: -180, shapes: [
    { path: 'M-22 -59 L5 -64 L24 -55 L30 -36 L40 -27 L30 -20 L26 -5 L8 3 L-10 -4 L-23 -22 Z', fill: 'skin', stroke: 'ink', width: 2.5 },
    { path: 'M-21 -47 L-6 -51 L-8 -27 L6 -15 L24 -13 L25 -5 L8 0 L-10 -5 L-23 -23 Z', fill: 'shade' },
    { path: 'M3 -43 L23 -40 L26 -34 L11 -36 Z', fill: 'hair' },
    { path: 'M12 -33 L24 -32 M24 -27 L29 -25 M12 -10 L24 -10', fill: 'skin', stroke: 'ink', width: 2 },
    { path: 'M-18 -32 Q-28 -37 -26 -23 Q-21 -13 -14 -22', fill: 'skin', stroke: 'shade', width: 2 },
  ] },
  { name: 'backArm', parent: 'torso', x: -32, y: -140, shapes: arm },
  { name: 'backForearm', parent: 'backArm', x: 0, y: 80, shapes: forearm },
  { name: 'backHand', parent: 'backForearm', x: 0, y: 74, shapes: hand },
  { name: 'frontThigh', parent: null, x: 18, y: 0, shapes: thigh },
  { name: 'frontShin', parent: 'frontThigh', x: 0, y: 116, shapes: shin },
  { name: 'frontFoot', parent: 'frontShin', x: 0, y: 114, shapes: foot },
  { name: 'frontArm', parent: 'torso', x: 34, y: -145, shapes: arm },
  { name: 'frontForearm', parent: 'frontArm', x: 0, y: 80, shapes: forearm },
  { name: 'frontHand', parent: 'frontForearm', x: 0, y: 74, shapes: hand },
];

export function solveLimb(x: number, y: number, upper: number, lower: number, bend: number) {
  'worklet';
  const raw = Math.sqrt(x * x + y * y);
  const distance = Math.min(upper + lower - 0.001, Math.max(Math.abs(upper - lower) + 0.001, raw));
  const direction = Math.atan2(y, x);
  const shoulder = direction + bend * Math.acos(Math.max(-1, Math.min(1,
    (upper * upper + distance * distance - lower * lower) / (2 * upper * distance))));
  const kneeX = Math.cos(shoulder) * upper, kneeY = Math.sin(shoulder) * upper;
  const endpointX = Math.cos(direction) * distance, endpointY = Math.sin(direction) * distance;
  const elbow = Math.atan2(endpointY - kneeY, endpointX - kneeX);
  return { upper: shoulder - Math.PI / 2, lower: elbow - shoulder };
}

function smooth(value: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

/** Cosmetic joint motion only. Contact/duration come from the existing action clock. */
export function sampleHumanPose(
  action: CombatAction, time: number, duration: number, contact: number, advance = 100, idleMs = 0,
): HumanPose {
  'worklet';
  const hitStop = 48;
  const t = time <= contact ? time : time < contact + hitStop ? contact
    : contact + (time - contact - hitStop) / Math.max(1, duration - contact - hitStop) * (duration - contact);
  const attack = action === 'attack' || action === 'special';
  const wind = smooth(t / Math.max(1, contact));
  const recovery = smooth((t - contact) / Math.max(1, duration - contact));
  const effort = attack ? wind * (1 - recovery) : 0;
  const reaction = action === 'knockback' ? Math.sin(Math.min(1, time / duration) * Math.PI) : 0;
  const fall = action === 'fall' ? smooth(time / duration) : 0;
  const guard = action === 'block' ? Math.sin(Math.min(1, time / duration) * Math.PI) : 0;
  const idle = action === 'idle' ? Math.sin(idleMs / 3000 * Math.PI * 2) : 0;
  const x = advance * effort - 26 * reaction - 24 * fall;
  const y = 16 * effort + 10 * reaction + 179 * fall + idle * 1.5;
  const torso = 0.14 * effort - 0.24 * guard - 0.3 * reaction - 1.35 * fall;
  const footLift = attack && time < contact ? Math.sin(wind * Math.PI) * 28 : 0;
  const backFootX = -55 - x * 0.25 - fall * 18;
  const frontFootX = 55 + x * 0.1 + fall * 25;
  const backLeg = solveLimb(backFootX + 18, 220 - y, 116, 114, -1);
  if (fall > 0) {
    const folded = solveLimb(backFootX + 18, 220 - y, 116, 114, 1);
    const blend = smooth(fall * 3);
    backLeg.upper += (folded.upper - backLeg.upper) * blend;
    backLeg.lower += (folded.lower - backLeg.lower) * blend;
  }
  const kick = action === 'special' ? effort : 0;
  const frontLeg = solveLimb(
    frontFootX - 18 + kick * 155, (220 - y - footLift) * (1 - kick) - 65 * kick, 116, 114, -1,
  );
  const backArm = solveLimb(93 - guard * 26, 13 - guard * 27, 80, 74, 1);
  const frontArm = solveLimb(78 + (action === 'attack' ? effort * 74 : -kick * 18),
    -11 + (action === 'attack' ? effort * 34 : -guard * 42), 80, 74, 1);
  return {
    x, y, action, effort,
    angles: {
      torso, head: -torso * 0.4 - reaction * 0.2,
      backArm: backArm.upper, backForearm: backArm.lower,
      backHand: -0.5 - backArm.upper - backArm.lower,
      frontArm: frontArm.upper, frontForearm: frontArm.lower,
      frontHand: -Math.PI / 2 - frontArm.upper - frontArm.lower,
      backThigh: backLeg.upper, backShin: backLeg.lower,
      backFoot: -backLeg.upper - backLeg.lower,
      frontThigh: frontLeg.upper, frontShin: frontLeg.lower,
      frontFoot: -frontLeg.upper - frontLeg.lower - kick * 0.3,
    },
  };
}
