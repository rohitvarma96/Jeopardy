import type { FighterId } from '../../../game/types/fighter';
import reference from './reference.json';
import { COMBAT_ROSTER } from './roster';

export const COMBAT_ACTIONS = ['idle', 'attack', 'block', 'knockback', 'fall', 'special'] as const;
export type CombatAction = typeof COMBAT_ACTIONS[number];
export const ACTION_LABELS: Record<CombatAction, string> = {
  idle: 'Idle', attack: 'Attack', block: 'Block', knockback: 'Knockback',
  fall: 'Vaporization KO', special: 'Power Kick',
};

export const BONE_NAMES = [
  'root', 'torso', 'neck', 'head', 'upperArmBack', 'forearmBack', 'handBack',
  'upperArmFront', 'forearmFront', 'handFront', 'thighBack', 'shinBack', 'footBack',
  'thighFront', 'shinFront', 'footFront', 'capeRoot', 'capeMid', 'capeTip',
] as const;
export type BoneName = typeof BONE_NAMES[number];
export type RigPose = readonly number[];
export type MotionClip = {
  frames: number; contact: number; loop: boolean; hold: boolean;
  keys: readonly { frame: number; easing: string; values: RigPose }[];
};
export type ActionCommand = { action: CombatAction; atMs: number };
export type BoneMatrix = { a: number; b: number; c: number; d: number; x: number; y: number };

const DURATIONS: Record<CombatAction, number> = {
  idle: 3000, attack: 680, block: 760, knockback: 740, fall: 800, special: 880,
};
const REST = reference.clips.idle.keys[0].values;

if (reference.rig.length !== BONE_NAMES.length ||
    reference.rig.some((bone, index) => bone.name !== BONE_NAMES[index])) {
  throw new Error('Imported combat rig does not match the shared skeleton.');
}

export const RIG = reference.rig.map((bone, index) => {
  const parentIndex = 'parent' in bone ? reference.rig.findIndex((entry) => entry.name === bone.parent) : -1;
  const x = bone.type === 'Bone' ? reference.rig[parentIndex].length : bone.x;
  const y = bone.type === 'Bone' ? 0 : bone.y;
  if (typeof x !== 'number' || typeof y !== 'number') throw new Error(`Missing bind position for ${bone.name}.`);
  return {
    name: BONE_NAMES[index],
    parentIndex,
    x,
    y,
  };
});

export function actionClip(fighterId: FighterId, action: CombatAction): MotionClip {
  'worklet';
  return action === 'special' && (fighterId === 'frost' || fighterId === 'shadow')
    ? reference.frostSpecial : reference.clips[action];
}

export function actionDuration(action: CombatAction) {
  'worklet';
  return DURATIONS[action];
}

export function actionContact(fighterId: FighterId, action: CombatAction) {
  'worklet';
  const clip = actionClip(fighterId, action);
  return Math.round(clip.contact / clip.frames * actionDuration(action));
}

export function sampleClip(clip: MotionClip, frame: number): number[] {
  'worklet';
  const position = clip.loop ? Math.max(0, frame) % clip.frames : Math.min(clip.frames, Math.max(0, frame));
  let index = 0;
  while (index < clip.keys.length - 2 && clip.keys[index + 1].frame < position) index += 1;
  const from = clip.keys[index];
  const to = clip.keys[index + 1];
  const t = Math.min(1, Math.max(0, (position - from.frame) / (to.frame - from.frame)));
  const eased = from.easing === 'hold' ? 0 : to.easing === 'linear' ? t
    : to.easing === 'snap' ? t * t * t : t * t * (3 - 2 * t);
  return from.values.map((value, channel) => {
    let delta = to.values[channel] - value;
    // The reference roll explicitly wraps 360 to 0 in one frame; those are the same pose.
    if (channel >= 3 && Math.abs(delta) >= Math.PI * 2 - 0.01) {
      delta -= Math.round(delta / (Math.PI * 2)) * Math.PI * 2;
    }
    return value + delta * eased;
  });
}

export function sampleAction(fighterId: FighterId, action: CombatAction, elapsedMs: number): number[] {
  'worklet';
  const duration = actionDuration(action);
  const clip = actionClip(fighterId, action);
  const pose = sampleClip(clip, elapsedMs / duration * clip.frames);
  const design = COMBAT_ROSTER[fighterId];
  if (action === 'attack') {
    const phase = Math.min(1, Math.max(0, elapsedMs / duration));
    const windup = Math.sin(Math.min(1, phase / 0.31) * Math.PI);
    const recovery = Math.sin(Math.max(0, (phase - 0.31) / 0.69) * Math.PI);
    const swing = design.weapon === 'hammer' || design.weapon === 'sword' || design.weapon === 'axe';
    pose[12] += (swing ? -0.95 * windup + 1.2 * recovery : -0.22 * windup);
    if (design.weapon === 'blades') pose[9] += Math.sin(phase * Math.PI * 2) * 0.34;
  }
  if (design.silhouette === 'sage' && action !== 'fall') pose[1] -= 8;
  return pose;
}

export function sampleTimeline(
  fighterId: FighterId, commands: readonly ActionCommand[], elapsedMs: number, idleMs = 0,
): RigPose {
  'worklet';
  let index = -1;
  for (let i = 0; i < commands.length; i += 1) {
    if (commands[i].atMs <= elapsedMs) index = i;
  }
  if (index < 0) return sampleAction(fighterId, 'idle', idleMs);
  const command = commands[index];
  const local = elapsedMs - command.atMs;
  const clip = actionClip(fighterId, command.action);
  if (local >= actionDuration(command.action) && !clip.hold) return sampleAction(fighterId, 'idle', idleMs);
  const pose = sampleAction(fighterId, command.action, local);
  if (local >= 70) return pose;
  const previous = commands[index - 1];
  const previousElapsed = previous ? command.atMs - previous.atMs : idleMs;
  const from = previous && (previousElapsed < actionDuration(previous.action) || actionClip(fighterId, previous.action).hold)
    ? sampleAction(fighterId, previous.action, previousElapsed) : sampleAction(fighterId, 'idle', idleMs);
  const blend = local / 70;
  return pose.map((value, channel) => from[channel] + (value - from[channel]) * blend);
}

export function boneMatrices(pose: RigPose): BoneMatrix[] {
  'worklet';
  const matrices: BoneMatrix[] = [];
  for (let index = 0; index < RIG.length; index += 1) {
    const bone = RIG[index];
    const parent = matrices[bone.parentIndex];
    const x = index === 0 ? pose[0] : bone.x;
    const y = index === 0 ? pose[1] : bone.y;
    const rotation = pose[index + 3];
    const scaleY = index === 1 ? pose[2] : 1;
    const a = Math.cos(rotation), b = Math.sin(rotation);
    const c = -b * scaleY, d = a * scaleY;
    matrices.push(parent ? {
      a: parent.a * a + parent.c * b, b: parent.b * a + parent.d * b,
      c: parent.a * c + parent.c * d, d: parent.b * c + parent.d * d,
      x: parent.x + parent.a * x + parent.c * y, y: parent.y + parent.b * x + parent.d * y,
    } : { a, b, c, d, x, y });
  }
  return matrices;
}

export const REST_POSE: RigPose = REST;
