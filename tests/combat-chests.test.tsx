import { afterEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ChestForge from '../app/chest-forge';
import Rewards from '../app/battle/rewards';
import { CHESTS, CHEST_FAMILIES, chestFamilyFor } from '../src/assets/chests';
import { battleAssets } from '../src/assets/registry';
import { BattleScene } from '../src/components/battle/BattleScene';
import { ANIMATION_PREVIEWS } from '../src/components/battle/animationPreviews';
import { actionContact, actionDuration, COMBAT_ACTIONS } from '../src/components/fighters/combat/actions';
import { HUMAN_ORIGIN, HUMAN_PARTS, humanAdvance, sampleHumanPose, type HumanPose } from '../src/components/fighters/combat/human-rig';
import { usePlayerStore } from '../src/store/player-store';
import { manualBattle, play, withHp } from './battle/continuous-fixtures';

const mockMatchId = 'chest-fixture';
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ canGoBack: () => false, replace: jest.fn(), back: jest.fn() }),
    useLocalSearchParams: () => ({ matchId: mockMatchId }),
    useFocusEffect: function useFocusEffect(callback: () => void | (() => void)) { useEffect(callback, [callback]); },
  };
});

afterEach(() => { jest.restoreAllMocks(); });

function footY(pose: HumanPose, front: boolean) {
  const upper = front ? pose.angles.frontThigh : pose.angles.backThigh;
  const lower = front ? pose.angles.frontShin : pose.angles.backShin;
  return HUMAN_ORIGIN.y + pose.y + Math.cos(upper) * 116 + Math.cos(upper + lower) * 114 + 9;
}

test.each(COMBAT_ACTIONS)('%s produces finite independently articulated human joints', (action) => {
  const duration = actionDuration(action), contact = actionContact('ember', action);
  for (const fraction of [0, 0.1, 0.3, 0.5, 0.8, 1, 2]) {
    const pose = sampleHumanPose(action, duration * fraction, duration, contact, 96, 500);
    expect(Number.isFinite(pose.x) && Number.isFinite(pose.y)).toBe(true);
    expect(Object.values(pose.angles).every(Number.isFinite)).toBe(true);
    expect(Object.keys(pose.angles).sort()).toEqual(HUMAN_PARTS.map((part) => part.name).sort());
  }
});

test('punch extends shoulder and elbow while the kick articulates hip, knee and ankle', () => {
  const idle = sampleHumanPose('idle', 0, 3000, 0);
  const punch = sampleHumanPose('attack', 245, 680, 245, 96);
  const kick = sampleHumanPose('special', 380, 880, 380, 96);
  const chamber = sampleHumanPose('special', 190, 880, 380, 96);
  expect(Math.abs(punch.angles.frontForearm - idle.angles.frontForearm)).toBeGreaterThan(0.5);
  expect(Math.abs(punch.angles.frontArm - idle.angles.frontArm)).toBeGreaterThan(0.4);
  expect(Math.abs(kick.angles.frontThigh - idle.angles.frontThigh)).toBeGreaterThan(0.7);
  expect(Math.abs(chamber.angles.frontShin - idle.angles.frontShin)).toBeGreaterThan(0.5);
  expect(Math.abs(kick.angles.frontShin - chamber.angles.frontShin)).toBeGreaterThan(0.5);
  expect(Math.abs(kick.angles.frontFoot - idle.angles.frontFoot)).toBeGreaterThan(0.2);
});

test('stance feet and the support leg stay on the shared floor', () => {
  for (const idleMs of [0, 500, 1500, 2200]) {
    const pose = sampleHumanPose('idle', 0, 3000, 0, 0, idleMs);
    expect(footY(pose, false)).toBeCloseTo(HUMAN_ORIGIN.ground, 4);
    expect(footY(pose, true)).toBeCloseTo(HUMAN_ORIGIN.ground, 4);
  }
  const kick = sampleHumanPose('special', 380, 880, 380, 96);
  expect(footY(kick, false)).toBeCloseTo(HUMAN_ORIGIN.ground, 4);
  expect(footY(kick, true)).toBeLessThan(HUMAN_ORIGIN.ground - 150);
});

test('contact has a short cosmetic hold and KO remains collapsed', () => {
  expect(sampleHumanPose('attack', 265, 680, 245, 96))
    .toEqual(sampleHumanPose('attack', 245, 680, 245, 96));
  const fall = sampleHumanPose('fall', 800, 800, 0);
  expect(sampleHumanPose('fall', 1600, 800, 0)).toEqual(fall);
  expect(fall.angles.torso).toBeLessThan(-1);
  expect(fall.y).toBeGreaterThan(150);
  expect(HUMAN_ORIGIN.y + fall.y + Math.cos(fall.angles.backThigh) * 116)
    .toBeLessThan(HUMAN_ORIGIN.ground - 10);
  expect(footY(fall, false)).toBeCloseTo(HUMAN_ORIGIN.ground, 4);
  expect(humanAdvance(326)).toBe(96);
});

test('real impacts show action lettering, blocked hits do not become STRIKE, and KO is explicit', async () => {
  const hit = await render(<BattleScene view={ANIMATION_PREVIEWS[1].view} motionEnabled={false} />);
  expect(screen.getByText('STRIKE', { includeHiddenElements: true })).toBeTruthy();
  await hit.rerender(<BattleScene view={ANIMATION_PREVIEWS[3].view} motionEnabled={false} />);
  expect(screen.getByText('BLOCK', { includeHiddenElements: true })).toBeTruthy();
  expect(screen.queryByText('STRIKE', { includeHiddenElements: true })).toBeNull();
  await hit.rerender(<BattleScene view={ANIMATION_PREVIEWS[6].view} motionEnabled={false} />);
  expect(screen.getByText('KO', { includeHiddenElements: true })).toBeTruthy();
  expect(battleAssets.arena.label).toBe('The Relay fight stage');
});

test('four chest families are stable independent cosmetic containers', () => {
  expect(CHEST_FAMILIES).toHaveLength(4);
  const found = new Set<string>();
  for (let seed = 1; seed <= 40; seed++) {
    const family = chestFamilyFor(seed, `match-${seed}`);
    expect(chestFamilyFor(seed, `match-${seed}`)).toBe(family);
    expect(CHESTS[family].closed).toBeDefined();
    expect(CHESTS[family].open).toBeDefined();
    found.add(family);
  }
  expect(found.size).toBe(4);
});

test('forge previews all eight chest states without touching player data', async () => {
  const before = usePlayerStore.getState();
  await render(<ChestForge />);
  for (const family of CHEST_FAMILIES) {
    await fireEvent.press(screen.getByRole('radio', { name: CHESTS[family].name }));
    expect(screen.getByRole('image', { name: `Closed ${CHESTS[family].name}` })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Open preview chest' }));
    expect(screen.getByRole('image', { name: `Open ${CHESTS[family].name}` })).toBeTruthy();
    expect(screen.getByText('OPEN STATE / PREVIEW ONLY')).toBeTruthy();
    expect(screen.queryByText('CHEST OPENED / REWARD SAVED')).toBeNull();
  }
  expect(usePlayerStore.getState()).toBe(before);
});

test('chest save failure stays closed, retry settles once and reopening grants nothing', async () => {
  await usePlayerStore.getState().hydrate();
  const battle = play(withHp(manualBattle({ matchId: mockMatchId }), { opponent: 1 }), { player: 'correct', opponent: 'wrong' });
  const record = await usePlayerStore.getState().claimMatch(battle);
  if (!record?.capsule) throw new Error('Expected an earned reward fixture.');
  usePlayerStore.setState({
    matches: [{ ...record, capsule: { ...record.capsule, collectibleId: 'fighter:arcane' } }],
  });
  const before = usePlayerStore.getState().profile.shards;
  await render(<Rewards />);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));
  await fireEvent.press(screen.getByRole('button', { name: 'Open reward chest' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(false);
  expect(usePlayerStore.getState().profile.shards).toBe(before);
  await fireEvent.press(screen.getByRole('button', { name: 'Open reward chest' }));
  expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(true);
  expect(usePlayerStore.getState().profile.shards).toBe(before + 5);
  await usePlayerStore.getState().openCapsule(mockMatchId);
  expect(usePlayerStore.getState().profile.shards).toBe(before + 5);
  expect(screen.queryByRole('button', { name: 'Open reward chest' })).toBeNull();
});
