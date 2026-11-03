import { afterEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, AppState } from 'react-native';

import AnimationPreview from '../../app/battle/animation-preview';
import { ACTION_LABELS, COMBAT_ACTIONS } from '../../src/components/fighters/combat/actions';
import { FIGHTERS } from '../../src/data/fighters';
import { useBattleStore } from '../../src/features/battle/store';
import { usePlayerStore } from '../../src/store/player-store';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => ({ replace: jest.fn(), back: jest.fn(), canGoBack: () => false }),
    useFocusEffect: function useFocusEffect(callback: () => void | (() => void)) { useEffect(callback, [callback]); },
  };
});

const initialAppState = AppState.currentState;
afterEach(() => {
  AppState.currentState = initialAppState;
  jest.restoreAllMocks();
});

test('the atelier independently selects every character and action without touching battle or player state', async () => {
  AppState.currentState = 'active';
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const battle = useBattleStore.getState(), player = usePlayerStore.getState();
  await render(<AnimationPreview />);
  expect(screen.getByRole('header', { name: 'Combat atelier' })).toBeTruthy();
  for (const fighter of FIGHTERS) {
    await fireEvent.press(screen.getByRole('radio', { name: `player character ${fighter.name}` }));
    expect(screen.getByTestId('fighter-player').props.accessibilityLabel).toBe(`${fighter.name} artwork`);
    expect(screen.getByTestId('fighter-opponent').props.accessibilityLabel).toBe('Frost Warden artwork');
  }
  await fireEvent.press(screen.getByRole('radio', { name: 'opponent character Nightblade' }));
  for (const action of COMBAT_ACTIONS) {
    const name = `player action ${ACTION_LABELS[action]}`;
    await fireEvent.press(screen.getByRole('radio', { name }));
    expect(screen.getByRole('radio', { name, checked: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'opponent action Idle', checked: true })).toBeTruthy();
  }
  await fireEvent.press(screen.getByRole('radio', { name: 'opponent action Block' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Replay animation' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Preview reduced motion' }));
  expect(screen.getByRole('button', { name: 'Use system motion preference' })).toBeTruthy();
  expect(useBattleStore.getState()).toBe(battle);
  expect(usePlayerStore.getState()).toBe(player);
});
