import { afterEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import Arena from '../app/(tabs)/arena';
import Result from '../app/battle/result';
import Rewards from '../app/battle/rewards';
import { COLLECTIBLES, getCollectible, type CollectibleId } from '../src/data/collectibles';
import { DEFAULT_LOADOUT } from '../src/data/boosters';
import { DEMO_PLAYER } from '../src/data/player';
import { addXp, grantMatch, revealCapsule, rollCollectible, summarizeMatch, xpForLevel, type RewardRecord } from '../src/game/rewards';
import { parsePlayerData, PLAYER_DATA_KEY } from '../src/services/player-storage';
import { usePlayerStore } from '../src/store/player-store';
import { useBattleStore } from '../src/features/battle/store';
import { leaveBattle } from '../src/features/battle/session';
import type { MatchSetup } from '../src/game/types/match';
import { resolveMockMatch } from '../src/services/mock-matchmaking';
import { manualBattle, ok, play, withHp } from './battle/continuous-fixtures';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  const router = { replace: jest.fn(), push: jest.fn(), back: jest.fn(), dismissAll: jest.fn(), canGoBack: () => false };
  return {
    router, Stack: { Screen: () => null }, useRouter: () => router, useLocalSearchParams: () => ({}),
    useFocusEffect: function useFocusEffect(callback: () => void | (() => void)) { useEffect(callback, [callback]); },
  };
});

afterEach(() => { jest.restoreAllMocks(); });

const finished = (matchId = 'fixture', won = true) =>
  play(withHp(manualBattle({ matchId }), won ? { opponent: 1 } : { player: 1 }),
    won ? { player: 'correct', opponent: 'wrong' } : { player: 'wrong', opponent: 'correct' });

async function rewardWithItem(id: CollectibleId, matchId: string) {
  const record = await usePlayerStore.getState().claimMatch(finished(matchId));
  if (!record?.capsule) throw new Error('Expected a capsule.');
  const fixture: RewardRecord = { ...record, capsule: { collectibleId: id, opened: false, duplicate: false, shards: 0 } };
  usePlayerStore.setState((state) => ({ matches: state.matches.map((entry) => entry.matchId === matchId ? fixture : entry) }));
  return fixture;
}

test.each([
  ['win', true, false, 120, 50],
  ['loss', false, false, 70, 25],
  ['forfeit', false, true, 0, 0],
] as const)('%s grants the approved XP/coins, separate from the final score', (_label, won, forfeit, xp, coins) => {
  const battle = forfeit ? ok(manualBattle(), { type: 'forfeit', side: 'player', atMs: 0 }) : finished('math', won);
  const summary = summarizeMatch(battle);
  summary.fighters.player.stats.correct = 4;
  const grant = grantMatch(DEMO_PLAYER, summary);
  expect(grant.record).toMatchObject({ xp, coins });
  expect(grant.profile).toMatchObject({ xp: DEMO_PLAYER.xp + xp, coins: DEMO_PLAYER.coins + coins, level: 3 });
  expect(grant.record.fighters.player.score).toBe(battle.fighters.player.stats.damageDealt);
  expect(grant.record.capsule === null).toBe(forfeit);
});

test('XP thresholds preserve the remainder and support more than one level-up', () => {
  expect(xpForLevel(3)).toBe(400);
  expect(addXp(DEMO_PLAYER, 160)).toMatchObject({ level: 4, xp: 0, xpForNextLevel: 500 });
  expect(addXp(DEMO_PLAYER, 700)).toMatchObject({ level: 5, xp: 40, xpForNextLevel: 600 });
  expect(addXp(DEMO_PLAYER, 0)).toEqual(DEMO_PLAYER);
  expect(() => addXp(DEMO_PLAYER, -1)).toThrow(RangeError);
});

test('capsule generation is deterministic and returns only the existing common/rare/epic catalogue', () => {
  const rarities = new Set<string>();
  for (let seed = 1; seed <= 100; seed++) {
    const id = rollCollectible(seed, `match-${seed}`);
    expect(rollCollectible(seed, `match-${seed}`)).toBe(id);
    expect(COLLECTIBLES.some((item) => item.id === id)).toBe(true);
    rarities.add(getCollectible(id).rarity);
  }
  expect([...rarities].sort()).toEqual(['common', 'epic', 'rare']);
});

test.each([
  ['fighter:arcane', 5], ['fighter:shadow', 15], ['fighter:titan', 40],
] as const)('duplicate %s converts into exactly %i shards once', (id, shards) => {
  const record = grantMatch(DEMO_PLAYER, summarizeMatch(finished())).record;
  record.capsule = { collectibleId: id, opened: false, duplicate: false, shards: 0 };
  const reveal = revealCapsule(record, [id]);
  expect(reveal).toMatchObject({ shards, collectionIds: [id], record: { capsule: { opened: true, duplicate: true, shards } } });
  expect(revealCapsule(reveal.record, reveal.collectionIds).shards).toBe(0);
});

test('concurrent grants, screen reopen and restart cannot grant the same match twice', async () => {
  await usePlayerStore.getState().hydrate();
  const id = await usePlayerStore.getState().reserveMatchId();
  if (!id) throw new Error('Expected a durable match ID.');
  const battle = finished(id);
  const [first, second] = await Promise.all([usePlayerStore.getState().claimMatch(battle), usePlayerStore.getState().claimMatch(battle)]);
  expect(first).toEqual(second);
  const original = usePlayerStore.getState().profile;
  expect(usePlayerStore.getState().matches).toHaveLength(1);
  expect(original.coins).toBe(DEMO_PLAYER.coins + 50);
  const app = await render(<Result />);
  expect(screen.getByText('+105 XP / +50 coins')).toBeTruthy();
  await app.unmount();
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  await usePlayerStore.getState().hydrate();
  await usePlayerStore.getState().claimMatch(battle);
  expect(usePlayerStore.getState().profile).toEqual(original);
  expect(usePlayerStore.getState().matches).toHaveLength(1);
  expect(await usePlayerStore.getState().reserveMatchId()).not.toBe(id);
});

test('new heroes can be equipped on Arena, persist, and a later duplicate adds shards only', async () => {
  await usePlayerStore.getState().hydrate();
  await expect(usePlayerStore.getState().saveFighter('shadow')).rejects.toThrow('Collect');
  await rewardWithItem('fighter:shadow', 'first-shadow');
  await Promise.all([usePlayerStore.getState().openCapsule('first-shadow'), usePlayerStore.getState().openCapsule('first-shadow')]);
  expect(usePlayerStore.getState().collectionIds.filter((id) => id === 'fighter:shadow')).toHaveLength(1);
  expect(usePlayerStore.getState().profile.shards).toBe(40);
  const arena = await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Change Brawler' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Nightblade', disabled: false }));
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(usePlayerStore.getState().fighterId).toBe('shadow');
  await arena.unmount();
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  await usePlayerStore.getState().hydrate();
  expect(usePlayerStore.getState().fighterId).toBe('shadow');
  expect(usePlayerStore.getState().collectionIds).toContain('fighter:shadow');
  await usePlayerStore.getState().openCapsule('first-shadow');
  expect(usePlayerStore.getState().profile.shards).toBe(40);
  await rewardWithItem('fighter:shadow', 'second-shadow');
  await usePlayerStore.getState().openCapsule('second-shadow');
  expect(usePlayerStore.getState().profile.shards).toBe(55);
  await usePlayerStore.getState().openCapsule('second-shadow');
  expect(usePlayerStore.getState().profile.shards).toBe(55);
  const rewards = await render(<Rewards />);
  expect(screen.getByText('Duplicate converted')).toBeTruthy();
  expect(screen.getByText('Already owned: +15 shards saved.')).toBeTruthy();
  await rewards.unmount();
  const raw = await AsyncStorage.getItem(PLAYER_DATA_KEY);
  if (!raw) throw new Error('Expected persisted player data.');
  expect(parsePlayerData(raw).profile.shards).toBe(55);
});

test('failed writes do not publish balances or claims, and retry grants exactly once', async () => {
  await usePlayerStore.getState().hydrate();
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const before = usePlayerStore.getState().profile;
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Disk full'));
  expect(await usePlayerStore.getState().claimMatch(finished('retry'))).toBeNull();
  expect(usePlayerStore.getState().profile).toEqual(before);
  expect(usePlayerStore.getState().matches).toHaveLength(0);
  expect(usePlayerStore.getState().error).toContain('retry');
  expect(warn).toHaveBeenCalled();
  expect(await usePlayerStore.getState().claimMatch(finished('retry'))).not.toBeNull();
  expect(usePlayerStore.getState().matches).toHaveLength(1);
});

test('malformed persisted data fails closed and retains the original claim storage', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  await AsyncStorage.setItem(PLAYER_DATA_KEY, '{broken');
  await usePlayerStore.getState().hydrate();
  expect(usePlayerStore.getState().status).toBe('error');
  expect(await AsyncStorage.getItem(PLAYER_DATA_KEY)).toBe('{broken');
  const app = await render(<Arena />);
  expect(screen.getByText(/Unable to load player data/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry loading player data' })).toBeTruthy();
  await app.unmount();
});

test('an unsaved finished match remains retryable after leaving and gates the next battle', async () => {
  await usePlayerStore.getState().hydrate();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const battle = finished('unsaved');
  useBattleStore.setState({ battle });
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('Disk full'));
  await usePlayerStore.getState().claimMatch(battle);
  const nextSetup: MatchSetup = {
    ...resolveMockMatch({ modeId: 'offline-duel', seed: 2 }),
    categories: battle.setup.categoryIds.map((categoryId) => ({ categoryId, source: 'system' as const })),
    fighterId: 'arcane', boosterIds: DEFAULT_LOADOUT,
  };
  expect(() => useBattleStore.getState().start(nextSetup)).toThrow('Save the finished match');
  leaveBattle();
  expect(useBattleStore.getState().battle).toBe(battle);
  const app = await render(<Arena />);
  expect(screen.getByRole('button', { name: 'Play' }).props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saving finished match' }));
  await act(async () => { await usePlayerStore.getState().claimMatch(battle); });
  expect(usePlayerStore.getState().matches).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Play' }).props.accessibilityState.disabled).toBe(false);
  await app.unmount();
  useBattleStore.getState().start(nextSetup);
  expect(useBattleStore.getState().battle?.phase).toBe('open');
});
