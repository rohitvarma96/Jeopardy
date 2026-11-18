import { afterEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import Arena from '../app/(tabs)/arena';
import { usePlayerStore } from '../src/store/player-store';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
  };
});

afterEach(() => { jest.restoreAllMocks(); });

test('scene lobby shows the saved identity, real balances and authoritative XP', async () => {
  await usePlayerStore.getState().hydrate();
  await usePlayerStore.getState().saveIdentity('Arena Champion', 'star');
  await render(<Arena />);
  expect(screen.getByText('Arena Champion')).toBeTruthy();
  expect(screen.getByLabelText('Coins: 1250')).toBeTruthy();
  expect(screen.getByLabelText('Shards: 40')).toBeTruthy();
  expect(screen.getByLabelText('Level 3')).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'XP to level 4' }).props.accessibilityValue).toMatchObject({ now: 240, max: 400 });
  expect(screen.getByText('Arcane Insight')).toBeTruthy();
  expect(screen.queryByText('Missions')).toBeNull();
});

test.each(['idle', 'loading', 'error'] as const)('%s player data does not expose a playable stale kit', async (status) => {
  usePlayerStore.setState({ status, error: status === 'error' ? 'Unable to load player data.' : null });
  await render(<Arena />);
  expect(screen.queryByRole('button', { name: 'Duel' })).toBeNull();
  expect(screen.queryByLabelText('Astral Sage artwork')).toBeNull();
});

test('a failed local load remains visible and retry restores deployment', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('Storage unavailable'));
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  expect(screen.getByRole('alert')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry loading player data' }));
  expect(screen.getByRole('button', { name: 'Duel', disabled: false })).toBeTruthy();
});
