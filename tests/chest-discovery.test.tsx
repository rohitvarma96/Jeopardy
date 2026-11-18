import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findEventHandler } from '@testing-library/react-native/dist/events/propagation';

import Rewards from '../app/battle/rewards';
import ChestForge from '../app/chest-forge';
import { CHESTS, CHEST_FAMILIES } from '../src/assets/chests';
import { usePlayerStore } from '../src/store/player-store';
import { manualBattle, play, withHp } from './battle/continuous-fixtures';

const mockId = 'opening-sequence';
const mockSkip = jest.fn();
const mockParams: { matchId?: string; family?: string; discovery?: string } = { matchId: mockId };
let mockFinish: (() => void) | undefined;
jest.mock('../src/hooks/useChestOpening', () => {
  const { useSharedValue } = jest.requireMock<typeof import('react-native-reanimated')>('react-native-reanimated');
  return {
    useChestOpening: ({ onComplete }: { onComplete?: () => void }) => {
      mockFinish = onComplete;
      return { progress: useSharedValue(0), skip: mockSkip };
    },
  };
});
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  const router = { push: jest.fn(), navigate: jest.fn(), replace: jest.fn(), dismissAll: jest.fn() };
  return {
    router, useRouter: () => router, useLocalSearchParams: () => mockParams,
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
  };
});
afterEach(() => {
  jest.restoreAllMocks(); mockFinish = undefined;
  delete mockParams.family; delete mockParams.discovery; mockParams.matchId = mockId;
});

async function earned() {
  await usePlayerStore.getState().hydrate();
  const battle = play(withHp(manualBattle({ matchId: mockId }), { opponent: 1 }), { player: 'correct', opponent: 'wrong' });
  const record = await usePlayerStore.getState().claimMatch(battle);
  if (!record?.capsule) throw new Error('Expected an earned chest fixture.');
  usePlayerStore.setState({
    matches: [{ ...record, capsule: { ...record.capsule, collectibleId: 'fighter:arcane' } }],
  });
}

test('settlement happens once and repeated taps cannot skip the reference open-state hold', async () => {
  await earned();
  const before = usePlayerStore.getState().profile.shards;
  const writes = jest.spyOn(AsyncStorage, 'setItem'), beforeWrites = writes.mock.calls.length;
  await render(<Rewards />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open reward chest' }));
  expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(true);
  expect(usePlayerStore.getState().profile.shards).toBe(before + 5);
  expect(screen.queryByText('+5 SHARDS')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Chest discovery pending', disabled: true }));
  expect(mockSkip).not.toHaveBeenCalled();
  expect(writes.mock.calls.length).toBe(beforeWrites + 1);
  await act(() => mockFinish?.());
  expect(screen.getByText('+5 SHARDS')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Open reward chest' })).toBeNull();
});

test('repeated taps during a slow write cannot settle or reveal twice', async () => {
  await earned();
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(() => pending);
  await render(<Rewards />);
  const { handler } = findEventHandler(screen.getByRole('button', { name: 'Open reward chest' }), 'press', { bubbles: true });
  if (!handler) throw new Error('Expected the chest opening handler.');
  let request!: Promise<unknown>;
  await act(() => { request = Promise.resolve(handler()); });
  try {
    expect(screen.getByRole('button', { name: 'Securing chest reward', disabled: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Securing chest reward' }));
    expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(false);
    expect(mockSkip).not.toHaveBeenCalled();
  } finally { await act(async () => { release(); await request; }); }
  expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(true);
  expect(screen.queryByText('+5 SHARDS')).toBeNull();
});

test('failed save stays closed and retries the real transaction rather than a success animation', async () => {
  await earned();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));
  await render(<Rewards />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open reward chest' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Open reward chest' }));
  expect(screen.getByRole('button', { name: 'Chest discovery pending', disabled: true })).toBeTruthy();
  await act(() => mockFinish?.());
  expect(screen.getByText('+5 SHARDS')).toBeTruthy();
});

test('reopening a settled record shows its receipt without an opening or another grant', async () => {
  await earned();
  await usePlayerStore.getState().openCapsule(mockId);
  const profile = usePlayerStore.getState().profile;
  await render(<Rewards />);
  expect(screen.getByText('+5 SHARDS')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Skip chest opening' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Open reward chest' })).toBeNull();
  expect(usePlayerStore.getState().profile).toEqual(profile);
});

test('all four Vault practice chests reveal repeatable samples without granting inventory or currency', async () => {
  await usePlayerStore.getState().hydrate();
  mockParams.family = 'arc'; mockParams.discovery = '1';
  const before = usePlayerStore.getState();
  await render(<ChestForge />);
  for (const family of CHEST_FAMILIES) {
    await fireEvent.press(screen.getByRole('button', { name: 'Practice chest controls' }));
    await fireEvent.press(screen.getByRole('radio', { name: CHESTS[family].name }));
    await fireEvent.press(screen.getByRole('button', { name: 'Preview opening the chest' }));
    expect(screen.getByRole('image', { name: `Open ${CHESTS[family].name}` })).toBeTruthy();
    await act(() => mockFinish?.());
    expect(screen.getByText('NEW BRAWLER')).toBeTruthy();
    expect(screen.getByText('NIGHTBLADE')).toBeTruthy();
    expect(screen.getByText('SAMPLE CONTENTS / NOT A REAL DROP')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open again' })).toBeTruthy();
  }
  expect(usePlayerStore.getState()).toBe(before);
});

test('the practice duplicate matches the board receipt without adding shards or equipping a Brawler', async () => {
  await usePlayerStore.getState().hydrate();
  mockParams.family = 'overdrive'; mockParams.discovery = '1';
  const before = usePlayerStore.getState();
  await render(<ChestForge />);
  await fireEvent.press(screen.getByRole('button', { name: 'Practice chest controls' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Preview duplicate' }));
  expect(screen.getByText('DUPLICATE BRAWLER')).toBeTruthy();
  expect(screen.getByText('ALREADY OWNED / CONVERTED')).toBeTruthy();
  expect(screen.getByText('+15 SHARDS')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Preview equipping the discovered Brawler' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Open again' }));
  expect(screen.getByRole('image', { name: 'Closed Overdrive Chest' })).toBeTruthy();
  expect(usePlayerStore.getState()).toBe(before);
});

test('a real new-Brawler discovery still explicitly persists equip after the saved grant', async () => {
  await earned();
  usePlayerStore.setState(state => ({
    matches: state.matches.map(record => record.capsule ? {
      ...record, capsule: { ...record.capsule, collectibleId: 'fighter:shadow' },
    } : record),
  }));
  await render(<Rewards />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open reward chest' }));
  await act(() => mockFinish?.());
  expect(screen.getByRole('image', { name: 'Nightblade discovery artwork' })).toBeTruthy();
  expect(usePlayerStore.getState().fighterId).toBe('arcane');
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(usePlayerStore.getState().fighterId).toBe('shadow');
  expect(screen.getByRole('button', { name: 'Equipped', disabled: true })).toBeTruthy();
});

test('a saved power waits through the same presentation before exposing its real Armory action', async () => {
  await earned();
  usePlayerStore.setState(state => ({
    matches: state.matches.map(record => record.capsule ? {
      ...record, capsule: { ...record.capsule, collectibleId: 'booster:double-damage' },
    } : record),
  }));
  await render(<Rewards />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open reward chest' }));
  expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(true);
  expect(screen.queryByText('NEW POWER')).toBeNull();
  await act(() => mockFinish?.());
  expect(screen.getByText('NEW POWER')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Inspect in Armory' })).toBeTruthy();
});
