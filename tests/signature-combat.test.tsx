import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo, AppState } from 'react-native';
import * as Reanimated from 'react-native-reanimated';

import Result from '../app/battle/result';
import fragments from '../src/assets/brawler-fragments.json';
import { humanFighters } from '../src/assets/human-fighters';
import { ANIMATION_PREVIEWS } from '../src/components/battle/animationPreviews';
import { useCombatClock } from '../src/components/battle/CombatStage';
import { battlePresentation } from '../src/components/battle/combatPresentation';
import { impactWords } from '../src/components/battle/combatFeedback';
import { ResultTableau } from '../src/components/battle/ResultTableau';
import { dissolveField, KO_END_MS, koFragment, koFrame, presentedPose } from '../src/components/battle/signature-motion';
import { createPaintedMesh, deformPaintedMesh, paintedAnchor } from '../src/components/fighters/combat/painted-mesh';
import { getFighter, FIGHTERS } from '../src/data/fighters';
import { DEMO_PLAYER } from '../src/data/player';
import { useBattleStore } from '../src/features/battle/store';
import { grantMatch, summarizeMatch } from '../src/game/rewards';
import { usePlayerStore } from '../src/store/player-store';
import { manualBattle, ok, play, withHp } from './battle/continuous-fixtures';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  const router = { replace: jest.fn(), push: jest.fn(), back: jest.fn(), dismissAll: jest.fn(), canGoBack: () => false };
  return {
    router, Stack: { Screen: () => null }, useRouter: () => router, useLocalSearchParams: () => ({}),
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
  };
});
const initialState = AppState.currentState;
afterEach(() => { jest.restoreAllMocks(); AppState.currentState = initialState; });

const finished = (id: string, won = true) => play(
  withHp(manualBattle({ matchId: id }), won ? { opponent: 1 } : { player: 1 }),
  won ? { player: 'correct', opponent: 'wrong' } : { player: 'wrong', opponent: 'correct' },
);

test.each(FIGHTERS)('$name KO holds an upright pose, preserves exact source anchors and stays gone', fighter => {
  const art = humanFighters[fighter.id], mesh = createPaintedMesh(fighter.id, art.width, art.height);
  const spec = fragments[fighter.id];
  expect(spec.points).toHaveLength(32);
  expect(new Set(spec.points.map(point => point.vertex)).size).toBe(32);
  expect(spec).toMatchObject({ width: art.width, height: art.height });
  const held = presentedPose(fighter.id, [], 300, 0, 0, true, 0);
  expect(held.action).toBe('knockback');
  expect(held.angles.torso).toBeGreaterThan(-.5);
  expect(presentedPose(fighter.id, [], 10000, 0, 0, true, 0)).toEqual(held);
  const vertices = deformPaintedMesh(mesh, held);
  for (const point of spec.points) {
    expect(point.vertex).toBeLessThan(vertices.length);
    expect(point.color).toMatch(/^#[0-9A-F]{6}$/);
    expect(Number.isFinite(vertices[point.vertex].x) && Number.isFinite(vertices[point.vertex].y)).toBe(true);
  }
  for (const joint of ['frontHand', 'frontFoot', 'torso'] as const) {
    const position = paintedAnchor(mesh, held, joint);
    expect(Number.isFinite(position.x) && Number.isFinite(position.y)).toBe(true);
  }
  for (const time of [650, 1100, 100000]) expect(koFrame(time).opacity).toBe(0);
  expect(koFrame(0, false).opacity).toBe(0);
  for (let index = 0; index < 32; index++) {
    expect(koFragment(0, index).opacity).toBe(0);
    expect(koFragment(KO_END_MS, index).opacity).toBe(0);
  }
});

test('dissolve is deterministic, monotonic and source-local; neither side nor forfeit invents a collapse', () => {
  const fields = Array.from({ length: 200 }, (_, index) => dissolveField((index % 10) / 10, Math.floor(index / 10) / 20, 7));
  expect(fields).toEqual(Array.from({ length: 200 }, (_, index) => dissolveField((index % 10) / 10, Math.floor(index / 10) / 20, 7)));
  expect(fields.every(value => value >= 0 && value <= 1)).toBe(true);
  expect(fields.filter(value => value > .75).length).toBeLessThan(fields.filter(value => value > .25).length);
  for (const index of [6, 7]) {
    const view = ANIMATION_PREVIEWS[index].view;
    const presentation = battlePresentation(view), loser = view.outcome?.winner === 'player' ? 'opponent' : 'player';
    expect(presentation.defeats[loser]).toBeDefined();
    expect(presentation.commands[loser].some(command => command.action === 'fall')).toBe(false);
    expect(battlePresentation(view, true).defeats[loser]).toBe(-KO_END_MS);
    const forfeit = battlePresentation({ ...view, reveal: null, outcome: { winner: 'opponent', reason: 'forfeit', atMs: 1 } });
    expect(forfeit.defeats).toEqual({});
    expect(battlePresentation({ ...view, outcome: { winner: 'opponent', reason: 'forfeit', atMs: 1 } }).cues).toEqual([]);
  }
});

test('unread motion preferences do not skip a fresh KO, while blur/resume cannot replay a settled one', async () => {
  const timing = jest.spyOn(Reanimated, 'withTiming');
  const base = battlePresentation(ANIMATION_PREVIEWS[6].view);
  const hook = await renderHook<ReturnType<typeof useCombatClock>, { enabled: boolean; ready: boolean; key: string }>(
    ({ enabled, ready, key }) => useCombatClock({ ...base, key }, enabled, ready),
    { initialProps: { enabled: false, ready: false, key: 'first' } },
  );
  expect(timing).not.toHaveBeenCalled();
  await hook.rerender({ enabled: true, ready: true, key: 'first' });
  expect(timing).toHaveBeenCalledTimes(1);
  await hook.rerender({ enabled: false, ready: false, key: 'first' });
  await hook.rerender({ enabled: true, ready: true, key: 'first' });
  expect(timing).toHaveBeenCalledTimes(1);
  expect(hook.result.current.elapsed.get()).toBe(base.endMs);
  await hook.rerender({ enabled: true, ready: true, key: 'explicit-replay' });
  expect(timing).toHaveBeenCalledTimes(2);
});

test('turning reduction off cannot resurrect a KO that initially rendered reduced', async () => {
  const timing = jest.spyOn(Reanimated, 'withTiming'), presentation = battlePresentation(ANIMATION_PREVIEWS[7].view);
  const hook = await renderHook<ReturnType<typeof useCombatClock>, { enabled: boolean }>(
    ({ enabled }) => useCombatClock(presentation, enabled), { initialProps: { enabled: false } },
  );
  await hook.rerender({ enabled: true });
  expect(timing).not.toHaveBeenCalled();
  expect(hook.result.current.elapsed.get()).toBe(presentation.endMs);
});

test('one impact word wins each contact beat without mutating cues or inventing zero-damage strikes', () => {
  const cue = battlePresentation(ANIMATION_PREVIEWS[6].view).cues[0];
  const cues = [
    { ...cue, key: 'strike', finishing: false, contactMs: 200 },
    { ...cue, key: 'zero', damage: 0, finishing: false, contactMs: 100 },
    { ...cue, key: 'ko', contactMs: 200 },
  ];
  const before = JSON.stringify(cues);
  expect(impactWords(cues).map(value => value.key)).toEqual(['ko']);
  expect(impactWords(cues, true).map(value => value.key)).toEqual(['zero', 'ko']);
  expect(JSON.stringify(cues)).toBe(before);
});

test.each([true, false])('saved tableau uses the real winning Brawler and exact saved XP: player win %s', async won => {
  AppState.currentState = 'active';
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const timing = jest.spyOn(Reanimated, 'withTiming');
  const { record, profile } = grantMatch({ ...DEMO_PLAYER, xp: 390 }, summarizeMatch(finished(`tableau-${won}`, won)));
  const before = usePlayerStore.getState();
  const app = await render(<ResultTableau record={record} fresh account={profile} />);
  const winner = getFighter(record.fighters[record.outcome.winner].fighterId);
  expect(screen.getByRole('image', { name: `${winner.name} artwork` })).toBeTruthy();
  expect(screen.getByRole('header', { name: won ? 'VICTORY' : 'DEFEAT' })).toBeTruthy();
  expect(screen.getByText(`+${record.xp} XP / +${record.coins} coins`)).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Saved account XP' }).props.accessibilityValue.now).toBe(profile.xp);
  expect(screen.getByRole('progressbar', { name: 'Saved account XP' }).props['aria-valuenow']).toBe(profile.xp);
  expect(screen.getByText(`LEVEL ${record.levelBefore} -> ${record.levelAfter} / SAVED`)).toBeTruthy();
  expect(timing.mock.calls.some(call => call[1]?.duration === (won ? 820 : 520))).toBe(true);
  expect(usePlayerStore.getState()).toBe(before);
  await app.unmount();
  timing.mockClear();
  await render(<ResultTableau record={record} fresh account={profile} />);
  expect(timing).not.toHaveBeenCalled();
});

test('history and forfeit remain static receipts, not another earned celebration', async () => {
  AppState.currentState = 'active';
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const timing = jest.spyOn(Reanimated, 'withTiming');
  const history = grantMatch(DEMO_PLAYER, summarizeMatch(finished('history-only'))).record;
  const app = await render(<ResultTableau record={history} fresh={false} />);
  expect(timing).not.toHaveBeenCalled();
  const forfeit = grantMatch(DEMO_PLAYER, summarizeMatch(ok(manualBattle(), { type: 'forfeit', side: 'player', atMs: 0 }))).record;
  await app.rerender(<ResultTableau key="forfeit" record={forfeit} fresh />);
  expect(screen.getByRole('header', { name: 'FORFEIT' })).toBeTruthy();
  expect(screen.getByText('+0 XP / +0 coins')).toBeTruthy();
  expect(timing).not.toHaveBeenCalled();
});

test('failed result persistence cannot show a hero tableau or optimistic rewards', async () => {
  await usePlayerStore.getState().hydrate();
  const battle = finished('save-before-hero');
  useBattleStore.setState({ battle });
  const before = usePlayerStore.getState().profile;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));
  await render(<Result />);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.queryByTestId('result-tableau')).toBeNull();
  expect(usePlayerStore.getState().profile).toEqual(before);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saving finished match' }));
  await act(async () => {});
  expect(screen.getByTestId('result-tableau')).toBeTruthy();
  expect(usePlayerStore.getState().matches.filter(record => record.matchId === battle.setup.matchId)).toHaveLength(1);
});
