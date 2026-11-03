import { describe, expect, test } from '@jest/globals';

import { ANIMATION_PREVIEWS } from '../../src/components/battle/animationPreviews';
import { combatCues } from '../../src/components/battle/combatFeedback';
import { actionPresentation, battlePresentation } from '../../src/components/battle/combatPresentation';
import {
  actionClip, actionContact, actionDuration, BONE_NAMES, boneMatrices, COMBAT_ACTIONS,
  REST_POSE, sampleAction, sampleTimeline,
} from '../../src/components/fighters/combat/actions';
import reference from '../../src/components/fighters/combat/reference.json';
import { COMBAT_ROSTER } from '../../src/components/fighters/combat/roster';
import { COLLECTIBLES } from '../../src/data/collectibles';
import { FIGHTERS, isFighterId } from '../../src/data/fighters';
import { REVEAL_MS } from '../../src/features/battle/store';
import { SIDES } from '../../src/game/battle';

const ids = FIGHTERS.map((fighter) => fighter.id);

test('six complete designs have different silhouettes, weapons and elemental palettes', () => {
  expect(ids).toHaveLength(6);
  expect(Object.keys(COMBAT_ROSTER).sort()).toEqual([...ids].sort());
  for (const field of ['silhouette', 'weapon', 'element', 'accent'] as const) {
    expect(new Set(ids.map((id) => COMBAT_ROSTER[id][field])).size).toBe(6);
  }
  for (const id of ids) {
    expect(isFighterId(id)).toBe(true);
    expect(COLLECTIBLES.some((item) => item.id === `fighter:${id}`)).toBe(true);
    expect(Object.values(COMBAT_ROSTER[id].palette).every((value) => /^#[A-F0-9]{6}$/i.test(value))).toBe(true);
  }
  expect(isFighterId('missing')).toBe(false);
});

test('the adapted 19-bone bind pose reproduces the reference transforms and three-bone cape weights', () => {
  const matrices = boneMatrices(REST_POSE);
  expect(matrices).toHaveLength(19);
  BONE_NAMES.forEach((name, index) => {
    const rest = reference.bind[name];
    expect(matrices[index].x).toBeCloseTo(rest.x, 3);
    expect(matrices[index].y).toBeCloseTo(rest.y, 3);
    expect(matrices[index].a).toBeCloseTo(Math.cos(rest.rotation), 3);
    expect(matrices[index].b).toBeCloseTo(Math.sin(rest.rotation), 3);
  });
  for (const panel of reference.skins.sentinel.cape) {
    expect(panel.weights.length).toBe(panel.points.length);
    for (const weights of panel.weights) expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 8);
  }
});

describe.each(ids)('%s action library', (id) => {
  test.each(COMBAT_ACTIONS)('%s has an independent, finite skeletal trajectory', (action) => {
    const duration = actionDuration(action), clip = actionClip(id, action);
    expect(actionContact(id, action)).toBeGreaterThanOrEqual(0);
    expect(actionContact(id, action)).toBeLessThanOrEqual(duration);
    const before = JSON.stringify(clip);
    const poses = [0, 0.1, 0.3, 0.5, 0.8, 1, 2].map((phase) => sampleAction(id, action, duration * phase));
    for (const pose of poses) {
      expect(pose).toHaveLength(REST_POSE.length);
      expect(pose.every(Number.isFinite)).toBe(true);
      expect(boneMatrices(pose).every((matrix) => Object.values(matrix).every(Number.isFinite))).toBe(true);
    }
    expect(poses.some((pose) => pose.some((value, channel) => Math.abs(value - poses[0][channel]) > 0.001))).toBe(true);
    expect(JSON.stringify(clip)).toBe(before);
    if (action === 'fall') expect(poses[6]).toEqual(poses[5]);
    else expect(poses[5]).toEqual(poses[6]);
  });

  test('interruptions blend from the current pose, recover to idle, and never automatically revive a fall', () => {
    const commands = [{ action: 'attack' as const, atMs: 0 }, { action: 'block' as const, atMs: 200 }];
    expect(sampleTimeline(id, commands, 200)).toEqual(sampleAction(id, 'attack', 200));
    expect(sampleTimeline(id, commands, 270)).toEqual(sampleAction(id, 'block', 70));
    expect(sampleTimeline(id, commands, 1200, 100)).toEqual(sampleAction(id, 'idle', 100));
    const fall = [{ action: 'fall' as const, atMs: 0 }];
    expect(sampleTimeline(id, fall, 9000)).toEqual(sampleAction(id, 'fall', actionDuration('fall')));
    expect(sampleTimeline(id, [...fall, { action: 'idle', atMs: 9500 }], 10000, 0))
      .toEqual(sampleAction(id, 'idle', 500));
  });
});

test('all 36 character pairings compose every combination of six independent actions', () => {
  for (const player of ids) for (const opponent of ids) {
    for (const left of COMBAT_ACTIONS) for (const right of COMBAT_ACTIONS) {
      const presentation = actionPresentation({ player, opponent }, { player: left, opponent: right }, 1);
      for (const side of SIDES) {
        expect(sampleTimeline(presentation.fighters[side], presentation.commands[side], 500).every(Number.isFinite)).toBe(true);
      }
      expect(presentation.endMs).toBeLessThan(REVEAL_MS);
      for (const cue of presentation.cues) {
        expect(cue.contactMs).toBe(cue.delayMs + actionContact(presentation.fighters[cue.attacker], cue.action));
        if (cue.blocked) {
          expect(presentation.commands[cue.target][0].atMs +
            actionContact(presentation.fighters[cue.target], 'block')).toBe(cue.contactMs);
        }
      }
    }
  }
});

test('two specials, reactions, particles and damage labels fit the unchanged reveal deadline for every pairing', () => {
  const base = ANIMATION_PREVIEWS[1].view;
  const reveal = base.reveal!;
  const hit = reveal.hits[0];
  for (const player of ids) for (const opponent of ids) {
    const view = {
      ...base, player: { ...base.player, fighterId: player }, opponent: { ...base.opponent, fighterId: opponent },
      reveal: { ...reveal, hits: [
        { ...hit, doubled: true },
        { ...hit, attacker: 'opponent' as const, doubled: true, targetHp: 0 },
      ] },
      outcome: { winner: 'opponent' as const, reason: 'knockout' as const, atMs: 1 },
    };
    const before = JSON.stringify(view);
    const presentation = battlePresentation(view);
    expect(presentation.cues.map((cue) => cue.action)).toEqual(['special', 'special']);
    expect(presentation.endMs).toBeLessThan(REVEAL_MS);
    expect(presentation.commands.player.at(-1)?.action).toBe('fall');
    expect(JSON.stringify(view)).toBe(before);
  }
});

test('only authoritative non-void hits produce effects; shields and zero damage never recoil a target', () => {
  const view = ANIMATION_PREVIEWS[1].view;
  expect(combatCues({ ...view, reveal: null, opponent: { ...view.opponent, hp: 0 } })).toEqual([]);
  expect(combatCues({ ...view, reveal: { ...view.reveal!, hits: [{ ...view.reveal!.hits[0], void: true }] } })).toEqual([]);
  for (const blocked of [true, false]) {
    const presentation = battlePresentation({ ...view, reveal: {
      ...view.reveal!, hits: [{ ...view.reveal!.hits[0], damage: 0, blocked }],
    } });
    expect(presentation.commands.opponent.map((command) => command.action)).toEqual(blocked ? ['block'] : []);
  }
});

test('forfeit has no invented knockout while result-only knockout holds its downed pose', () => {
  const view = ANIMATION_PREVIEWS.find((fixture) => fixture.label === 'Finisher / victory')!.view;
  const result = battlePresentation(view, true);
  expect(result.cues).toEqual([]);
  expect(result.commands.opponent).toEqual([{ action: 'fall', atMs: -actionDuration('fall') }]);
  expect(battlePresentation({ ...view, reveal: null, outcome: { ...view.outcome!, reason: 'forfeit' } }).commands.opponent).toEqual([]);
});
