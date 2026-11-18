import type { FighterId } from '../../game/types/fighter';
import { actionContact, actionDuration, type ActionCommand } from '../fighters/combat/actions';
import { sampleHumanPose } from '../fighters/combat/human-rig';

export const KO_END_MS = 1000;
export const KO_BODY_END_MS = 650;
export const KO_HOLD_MS = 80;

export function koFrame(time: number, motion = true) {
  'worklet';
  const progress = motion ? Math.max(0, Math.min(1, (time - 220) / 430)) : 1;
  return {
    progress,
    opacity: motion && time < KO_BODY_END_MS ? 1 : 0,
    edge: motion && time >= KO_HOLD_MS && time < KO_BODY_END_MS ? Math.min(1, (time - KO_HOLD_MS) / 100) : 0,
    shadow: motion ? Math.max(0, 1 - Math.max(0, time - 220) / 650) : 0,
  };
}

export function koFragment(time: number, index: number) {
  'worklet';
  const q = Math.max(0, (time - 320 - (index % 6) * 16) / 520);
  return {
    x: Math.sin(index * 2.399) * 32 * q,
    y: -(32 + index % 7 * 7) * q,
    opacity: q > 0 && q < 1 ? Math.sin(q * Math.PI) * (1 - q) * 1.5 : 0,
    scale: (.8 + index % 3 * .15) * (1 - Math.min(1, q) * .5),
    rotation: index * .7 + q * (index % 2 ? 1 : -1),
  };
}

function hash(x: number, y: number, seed: number) {
  'worklet';
  x = x * 123.34 - Math.floor(x * 123.34);
  y = y * 345.45 - Math.floor(y * 345.45);
  const dot = x * (x + 34.345 + seed) + y * (y + 34.345 + seed);
  const value = (x + dot) * (y + dot);
  return value - Math.floor(value);
}

function noise(x: number, y: number, seed: number) {
  'worklet';
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return (hash(ix, iy, seed) * (1 - u) + hash(ix + 1, iy, seed) * u) * (1 - v)
    + (hash(ix, iy + 1, seed) * (1 - u) + hash(ix + 1, iy + 1, seed) * u) * v;
}

/** CPU study/test counterpart of the GPU shader's source-local threshold field. */
export function dissolveField(x: number, y: number, seed: number) {
  'worklet';
  return noise(x * 19, y * 31, seed) * .65 + noise(x * 41, y * 67, seed) * .15 + y * .2;
}

/** A finishing hit holds an upright recoil, never the legacy collapse. */
export function presentedPose(
  fighterId: FighterId, commands: readonly ActionCommand[], elapsed: number, idle: number,
  advance: number, motion: boolean, defeatedAt?: number,
) {
  'worklet';
  if (defeatedAt !== undefined && (elapsed >= defeatedAt || !motion)) {
    return sampleHumanPose('knockback', motion ? Math.min(KO_HOLD_MS, Math.max(0, elapsed - defeatedAt)) : KO_HOLD_MS,
      actionDuration('knockback'), 0, advance);
  }
  let active = -1;
  for (let index = 0; index < commands.length; index++) if (commands[index].atMs <= elapsed) active = index;
  if (!motion && commands.length) active = commands.length - 1;
  if (active < 0) return sampleHumanPose('idle', 0, 3000, 0, advance, idle);
  const command = commands[active], duration = actionDuration(command.action);
  const time = motion ? Math.max(0, elapsed - command.atMs) : actionContact(fighterId, command.action);
  return time >= duration && motion
    ? sampleHumanPose('idle', 0, 3000, 0, advance, idle)
    : sampleHumanPose(command.action, Math.min(time, duration), duration, actionContact(fighterId, command.action), advance);
}

export const SIGNAL_DISSOLVE_SHADER = `
uniform shader artwork;
uniform float2 dimensions;
uniform float progress;
uniform float edge;
uniform float3 accent;
uniform float seed;
float hash(float2 p) {
  p = fract(p * float2(123.34, 345.45));
  p += dot(p, p + 34.345 + seed);
  return fract(p.x * p.y);
}
float noise(float2 p) {
  float2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + float2(1, 0)), f.x),
    mix(hash(i + float2(0, 1)), hash(i + float2(1, 1)), f.x), f.y);
}
half4 main(float2 p) {
  half4 original = artwork.eval(p);
  if (progress <= 0.0 && edge <= 0.0) return original;
  if (progress >= 1.0 || original.a <= 0.0) return half4(0);
  float2 uv = p / dimensions;
  float field = noise(uv * float2(19, 31)) * 0.65
    + noise(uv * float2(41, 67)) * 0.15 + uv.y * 0.2;
  float keep = progress <= 0.0 ? 1.0 : smoothstep(progress - 0.035, progress + 0.035, field);
  float neighbourAlpha = min(min(artwork.eval(p + float2(1.5, 0)).a, artwork.eval(p - float2(1.5, 0)).a),
    min(artwork.eval(p + float2(0, 1.5)).a, artwork.eval(p - float2(0, 1.5)).a));
  float contour = max(0.0, original.a - neighbourAlpha);
  float rim = max(1.0 - smoothstep(0.0, 0.07, abs(field - progress)), contour * 0.8) * edge;
  half3 rgb = mix(original.rgb, half3(accent) * original.a, rim * 0.85);
  return half4(rgb * keep, original.a * keep);
}`;
