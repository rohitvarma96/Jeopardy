import { expect, jest, test } from '@jest/globals';
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

test('mode selection is a lobby inspection, with only AI Duel playable', async () => {
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose game mode' }));
  expect(screen.getByRole('header', { name: 'Game modes' })).toBeTruthy();
  expect(screen.getByText(/Online Ranked and Friend Challenge are not available/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'AI Duel selected' }));
  expect(screen.queryByTestId('world-overlay')).toBeNull();
});
