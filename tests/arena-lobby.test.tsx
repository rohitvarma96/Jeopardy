import { afterEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { findEventHandler } from '@testing-library/react-native/dist/events/propagation';

import Arena from '../app/(tabs)/arena';
import { DEFAULT_LOADOUT } from '../src/data/boosters';
import { useBattleStore } from '../src/features/battle/store';
import { createBattle, step } from '../src/game/battle';
import { routes } from '../src/navigation/routes';
import { usePlayerStore } from '../src/store/player-store';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

afterEach(() => { jest.restoreAllMocks(); });

test('Arena shows saved identity, balances, fighter and loadout without Missions', async () => {
  await usePlayerStore.getState().hydrate();
  await usePlayerStore.getState().saveIdentity('Arena Champion', 'star');
  await render(<Arena />);

  expect(screen.getByRole('header', { name: 'Arena' })).toBeTruthy();
  expect(screen.getByText('Arena Champion')).toBeTruthy();
  expect(screen.getByLabelText('Star player avatar')).toBeTruthy();
  expect(screen.getByLabelText('Coins: 1250')).toBeTruthy();
  expect(screen.getByLabelText('Shards: 40')).toBeTruthy();
  expect(screen.getByLabelText('Level 3')).toBeTruthy();
  expect(screen.getByText('Demo rank: Bronze II')).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'XP to level 4' }).props.accessibilityValue)
    .toMatchObject({ now: 240, max: 400 });
  expect(screen.getByLabelText('Astral Sage artwork')).toBeTruthy();
  expect(screen.getByText('Arcane Insight')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Battle kit' }));
  for (const name of ['50:50', 'Extra Time', 'Mind Shield']) {
    if (!screen.queryByText(name)) await fireEvent.press(screen.getByRole('button', { name: 'Next Battle kit' }));
    expect(screen.getByText(name)).toBeTruthy();
  }
  expect(screen.queryByText('Missions')).toBeNull();
  expect(screen.queryByText('Win 1 offline duel')).toBeNull();
  expect(screen.queryByText('Offline duel')).toBeNull();
  expect(screen.queryByText('VS AI')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Manage loadout' })).toBeNull();
});

test('Play keeps the existing mode journey', async () => {
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  expect(mockPush).toHaveBeenCalledWith(routes.mode);
});

test('Arena equips an owned hero and restores that choice after a restart', async () => {
  await usePlayerStore.getState().hydrate();
  usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:shadow'] }));
  const app = await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Change hero' }));
  expect(screen.getByRole('radio', { name: 'Astral Sage', checked: true })).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Iron Bastion', disabled: true })).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Iron Bastion' }));
  expect(screen.getByRole('radio', { name: 'Astral Sage', checked: true })).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Nightblade', disabled: false }));
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(screen.queryByTestId('hero-picker')).toBeNull();
  expect(screen.getByLabelText('Nightblade artwork')).toBeTruthy();
  expect(screen.getByText('Swift Strike')).toBeTruthy();
  await app.unmount();
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  await usePlayerStore.getState().hydrate();
  expect(usePlayerStore.getState().fighterId).toBe('shadow');
  await render(<Arena />);
  expect(screen.getByLabelText('Nightblade artwork')).toBeTruthy();
});

test('closing the hero picker discards an unconfirmed selection', async () => {
  await usePlayerStore.getState().hydrate();
  usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:shadow'] }));
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Change hero' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Nightblade' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Close hero picker' }));
  expect(usePlayerStore.getState().fighterId).toBe('arcane');
  expect(screen.queryByTestId('hero-picker')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Change hero' }));
  expect(screen.getByRole('radio', { name: 'Astral Sage', checked: true })).toBeTruthy();
});

test('failed hero saves stay visible in the picker and can be retried', async () => {
  await usePlayerStore.getState().hydrate();
  usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:shadow'] }));
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Change hero' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Nightblade' }));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(within(screen.getByTestId('hero-picker')).getByRole('alert').props.children).toContain('not saved');
  expect(usePlayerStore.getState().fighterId).toBe('arcane');
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(screen.queryByTestId('hero-picker')).toBeNull();
  expect(usePlayerStore.getState().fighterId).toBe('shadow');
});

test('a pending hero save cannot close a newly reopened picker', async () => {
  await usePlayerStore.getState().hydrate();
  usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:shadow'] }));
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Change hero' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Nightblade' }));
  let complete!: () => void;
  jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(() => new Promise<void>((resolve) => { complete = resolve; }));
  const { handler: onPress } = findEventHandler(screen.getByRole('button', { name: 'Equip Nightblade' }), 'press', { bubbles: true });
  if (!onPress) throw new Error('Expected the equip handler.');
  let saving!: Promise<void>;
  await act(() => { saving = Promise.resolve(onPress()).then(() => undefined); });
  try {
    expect(screen.getByRole('radio', { name: 'Astral Sage', disabled: true })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Close hero picker' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Change hero' }));
  } finally {
    await act(async () => { complete(); await saving; });
  }
  expect(screen.getByTestId('hero-picker')).toBeTruthy();
  expect(usePlayerStore.getState().fighterId).toBe('shadow');
});

test('the showcase renders the equipped fighter without missing-art placeholders', async () => {
  await usePlayerStore.getState().hydrate();
  usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:titan'] }));
  await usePlayerStore.getState().saveFighter('titan');
  await render(<Arena />);
  expect(screen.getByText('Iron Bastion')).toBeTruthy();
  expect(screen.getByText('Bulwark')).toBeTruthy();
  expect(screen.getByRole('image', { name: 'Iron Bastion artwork' })).toBeTruthy();
  expect(screen.queryByText(/art pending/)).toBeNull();
  expect(screen.queryByLabelText('Astral Sage artwork')).toBeNull();
});

test.each(['idle', 'loading', 'error'] as const)('%s player data hides stale details and disables Play', async (status) => {
  usePlayerStore.setState({ status, error: status === 'error' ? 'Unable to load player data.' : null });
  await render(<Arena />);
  const play = screen.getByRole('button', { name: 'Play', disabled: true });
  await fireEvent.press(play);
  expect(mockPush).not.toHaveBeenCalled();
  expect(screen.queryByText('Rookie Brawler')).toBeNull();
  expect(screen.queryByText('Your loadout')).toBeNull();
  expect(screen.queryByLabelText('Astral Sage artwork')).toBeNull();
});

test('loading errors stay visible and can be retried before playing', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage unavailable'));
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  expect(screen.getByRole('alert')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry loading player data' }));
  expect(screen.getByRole('button', { name: 'Play', disabled: false })).toBeTruthy();
  expect(screen.getByText('Rookie Brawler')).toBeTruthy();
});

test('an unsaved finished match blocks Play until its save succeeds', async () => {
  await usePlayerStore.getState().hydrate();
  const result = step(createBattle({
    matchId: 'arena-unsaved-match', seed: 1,
    player: { name: 'You', fighterId: 'arcane', boosterIds: DEFAULT_LOADOUT, level: 3 },
    opponent: { name: 'Rival', fighterId: 'shadow', boosterIds: DEFAULT_LOADOUT, level: 3 },
    categoryIds: ['science', 'sports', 'history', 'space', 'music'],
  }, 0), { type: 'forfeit', side: 'player', atMs: 0 });
  if (!result.ok) throw new Error(result.error.message);
  const battle = result.state;
  useBattleStore.setState({ battle });
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Play', disabled: true }));
  expect(mockPush).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saving finished match' }));
  expect(usePlayerStore.getState().matches.some((match) => match.matchId === battle.setup.matchId)).toBe(true);
  expect(screen.getByRole('button', { name: 'Play', disabled: false })).toBeTruthy();
});
