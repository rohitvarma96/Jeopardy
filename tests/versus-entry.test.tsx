import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Asset } from 'expo-asset';
import { AppState } from 'react-native';

import Versus from '../app/battle/versus';
import { useBattleStore } from '../src/features/battle/store';
import { useMatchSetupStore } from '../src/features/match-setup/store';
import { resolveMockMatch } from '../src/services/mock-matchmaking';
import { usePlayerStore } from '../src/store/player-store';
import { routes } from '../src/navigation/routes';

const mockRouter = { replace: jest.fn(), push: jest.fn(), dismissAll: jest.fn(), navigate: jest.fn() };
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    get router() { return mockRouter; }, Stack: { Screen: () => null }, useRouter: () => mockRouter,
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
  };
});

const appState = AppState.currentState;
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); AppState.currentState = appState; });

async function prepare() {
  jest.useFakeTimers();
  AppState.currentState = 'active';
  await usePlayerStore.getState().hydrate();
  await usePlayerStore.getState().saveSettings({ soundEnabled: false, reducedMotion: true });
  const setup = useMatchSetupStore.getState();
  setup.beginSetup('offline-duel');
  setup.matchFound({ ...resolveMockMatch({ modeId: 'offline-duel', seed: 1 }), matchId: 'vs-ready' });
  useMatchSetupStore.getState().ban('science');
  useMatchSetupStore.getState().pick('space');
  expect(useMatchSetupStore.getState().prepareSavedEquipment().ok).toBe(true);
}

function assets(download: () => Promise<void>) {
  jest.spyOn(Asset, 'fromModule').mockImplementation(() => {
    const asset = new Asset({ name: 'fixture', type: 'png', uri: 'file:///fixture.png' });
    asset.downloadAsync = async () => { await download(); return asset; };
    return asset;
  });
}

test('battle does not exist until required sources are ready; explicit entry starts only once', async () => {
  await prepare();
  let release!: () => void;
  const loaded = new Promise<void>((resolve) => { release = resolve; });
  assets(() => loaded);
  await render(<Versus />);
  expect(useBattleStore.getState().battle).toBeNull();
  expect(screen.getByRole('button', { name: 'Loading arena', disabled: true })).toBeTruthy();
  await act(async () => { release(); await loaded; });
  await fireEvent.press(screen.getByRole('button', { name: 'Enter duel now' }));
  await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
  expect(useBattleStore.getState().battle?.setup.matchId).toBe('vs-ready');
  expect(mockRouter.push).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).toHaveBeenCalledWith(routes.battleArena);
});

test('source failure is visible and retry can prepare without starting an early timer', async () => {
  await prepare();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const download = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Missing stage'));
  assets(download);
  await render(<Versus />);
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(useBattleStore.getState().battle).toBeNull();
  download.mockResolvedValue(undefined);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry entrance' }));
  expect(screen.getByRole('button', { name: 'Enter duel now', disabled: false })).toBeTruthy();
});

test('cancelling while sources load cannot start a stale entrance', async () => {
  await prepare();
  let release!: () => void;
  const loaded = new Promise<void>((resolve) => { release = resolve; });
  assets(() => loaded);
  await render(<Versus />);
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel entrance' }));
  await act(async () => { release(); await loaded; await jest.advanceTimersByTimeAsync(1500); });
  expect(useBattleStore.getState().battle).toBeNull();
  expect(useMatchSetupStore.getState().ready).toBeNull();
  expect(mockRouter.replace).toHaveBeenCalledWith(routes.arena);
});

test('equipment changed after validation must be re-deployed, not silently substituted', async () => {
  await prepare();
  let release!: () => void;
  const loaded = new Promise<void>((resolve) => { release = resolve; });
  assets(() => loaded);
  await render(<Versus />);
  await act(async () => {
    usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:shadow'] }));
    await usePlayerStore.getState().saveFighter('shadow');
    release(); await loaded;
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Enter duel now' }));
  expect(screen.getByRole('alert').props.children).toContain('Equipment changed');
  expect(useBattleStore.getState().battle).toBeNull();
});
