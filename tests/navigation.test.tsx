import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, renderRouter, screen, testRouter, within } from 'expo-router/testing-library';
import { Asset } from 'expo-asset';
import { AppState } from 'react-native';

import { getCategory } from '../src/data/categories';
import { availableCategories } from '../src/features/category-draft/draft';
import { useBattleStore } from '../src/features/battle/store';
import { useMatchSetupStore } from '../src/features/match-setup/store';
import { usePlayerStore } from '../src/store/player-store';
import { manualBattle, ok } from './battle/continuous-fixtures';

const initialAppState = AppState.currentState;
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  AppState.currentState = initialAppState;
});

test('launch opens the world lobby and all five destinations work', async () => {
  const app = await renderRouter('./app');
  expect(app.getPathname()).toBe('/arena');
  for (const name of ['Brawlers', 'Armory', 'Vault', 'Career', 'Arena']) {
    await fireEvent.press(screen.getByLabelText(`${name} tab`));
    expect(app.getPathname()).toBe(`/${name.toLowerCase()}`);
    expect(screen.getByRole('header', { name })).toBeTruthy();
  }
  expect(screen.queryByLabelText('Profile tab')).toBeNull();
}, 60000);

test.each([
  ['/profile', '/career', 'Career'],
  ['/battle/mode', '/arena', 'Arena'],
  ['/battle/fighter-select', '/brawlers', 'Brawlers'],
  ['/battle/loadout', '/armory', 'Armory'],
])('legacy entry %s safely resolves to %s', async (initialUrl, pathname, heading) => {
  const app = await renderRouter('./app', { initialUrl });
  expect(app.getPathname()).toBe(pathname);
  expect(screen.getByRole('header', { name: heading })).toBeTruthy();
});

test('Career settings return to Career', async () => {
  const app = await renderRouter('./app', { initialUrl: '/career' });
  await fireEvent.press(screen.getByRole('button', { name: 'Settings' }));
  expect(app.getPathname()).toBe('/settings');
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(app.getPathname()).toBe('/career');
});

test.each([
  ['/battle/matchmaking', 'Opponent acquisition'],
  ['/battle/category-draft', 'Category draft'],
  ['/battle/versus', 'Versus'],
  ['/battle/result', 'Results'],
  ['/battle/rewards', 'Reward chest'],
])('direct match entry %s has a safe lobby recovery', async (initialUrl, heading) => {
  const app = await renderRouter('./app', { initialUrl });
  expect(screen.getByRole('header', { name: heading })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
  expect(app.getPathname()).toBe('/arena');
  expect(testRouter.canGoBack()).toBe(false);
  expect(useMatchSetupStore.getState().match).toBeNull();
});

test('unknown paths still recover without stale navigation', async () => {
  const app = await renderRouter('./app', { initialUrl: '/unknown-route' });
  expect(screen.getByRole('header', { name: 'Page not found' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
  expect(app.getPathname()).toBe('/arena');
});

test('an unknown result ID cannot claim another finished match', async () => {
  useBattleStore.setState({ battle: ok(manualBattle(), { type: 'forfeit', side: 'player', atMs: 0 }) });
  const app = await renderRouter('./app', { initialUrl: '/battle/result?matchId=missing-match' });
  expect(screen.getByText('The requested match was not found.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Retry reward grant' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Arena home' }));
  expect(app.getPathname()).toBe('/arena');
});

test('returning player deploys through queue, draft and VS without repeated equipment forms', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
  AppState.currentState = 'active';
  await usePlayerStore.getState().hydrate();
  await usePlayerStore.getState().saveSettings({ soundEnabled: false, reducedMotion: true });
  jest.spyOn(Asset, 'fromModule').mockImplementation(() => {
    const asset = new Asset({ name: 'fixture', type: 'png', uri: 'file:///fixture.png' });
    asset.downloadAsync = jest.fn(async () => asset);
    return asset;
  });
  const app = await renderRouter('./app', { initialUrl: '/arena' });
  expect(within(screen.getByRole('button', { name: 'Duel' })).getByText('DUEL')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Duel' }));
  expect(app.getPathname()).toBe('/battle/matchmaking');
  await act(async () => { await jest.advanceTimersByTimeAsync(1300); });
  expect(app.getPathname()).toBe('/battle/category-draft');
  expect(within(screen.getByRole('button', { name: 'Confirm ban' })).getByText('BAN')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Science' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm ban' }));
  const draft = useMatchSetupStore.getState().draft;
  if (!draft) throw new Error('Expected draft.');
  const available = availableCategories(draft)[0];
  expect(within(screen.getByRole('button', { name: 'Confirm pick' })).getByText('PICK')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: getCategory(available).name }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm pick' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Enter arena' }));
  await act(async () => { await jest.advanceTimersByTimeAsync(1); });
  expect(app.getPathname()).toBe('/battle/arena');
  expect(useBattleStore.getState().battle?.setup.player.fighterId).toBe('arcane');
  expect(useBattleStore.getState().battle?.setup.player.boosterIds).toEqual(['50-50', 'extra-time', 'mind-shield']);
  expect(useMatchSetupStore.getState().ready).toBeNull();
});
