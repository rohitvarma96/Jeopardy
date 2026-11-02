import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, StyleSheet } from 'react-native';
import * as ReactNative from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BattleScreen } from '../../src/components/battle/BattleScreen';
import { BOOSTERS } from '../../src/data/boosters';
import { useBattleStore } from '../../src/features/battle/store';
import { selectBattleView } from '../../src/game/battle';
import { manualBattle, play, wrongOption } from './helpers';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    Stack: { Screen: () => null },
    useRouter: () => ({ replace: jest.fn() }),
    useFocusEffect: function useFocusEffect(callback: () => void | (() => void)) { useEffect(callback, [callback]); },
  };
});

const initialAppState = AppState.currentState;
afterEach(() => {
  AppState.currentState = initialAppState;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

async function openBattle(width = 390, height = 844, fontScale = 1, prompt?: string) {
  jest.useFakeTimers();
  jest.setSystemTime(0);
  AppState.currentState = 'active';
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width, height, fontScale, scale: 1 });
  const battle = structuredClone(manualBattle());
  if (prompt) battle.turn!.sides.player!.question.prompt = prompt;
  useBattleStore.setState({ battle, nowMs: 0 });
  return render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}>
      <BattleScreen route="arena" />
    </SafeAreaProvider>,
  );
}

test.each([[390, 844, 1], [360, 640, 1], [430, 932, 1], [390, 844, 2]])(
  '%sx%s at font scale %s retains four answers, six dock slots and no scroll container',
  async (width, height, fontScale) => {
    await openBattle(width, height, fontScale);
    expect(JSON.stringify(screen.toJSON())).not.toContain('ScrollView');
    expect(screen.getByTestId('battle-safe-area').props.edges).toEqual({
      top: 'additive', bottom: 'additive', left: 'additive', right: 'additive',
    });
    expect(screen.getByTestId('fighter-player')).toBeTruthy();
    expect(screen.getByTestId('fighter-opponent')).toBeTruthy();
    for (let index = 0; index < 4; index++) {
      expect(StyleSheet.flatten(screen.getByTestId(`answer-${index}`).props.style).minHeight).toBeGreaterThanOrEqual(48);
    }
    for (const booster of BOOSTERS) {
      expect(StyleSheet.flatten(screen.getByTestId(`booster-${booster.id}`).props.style).minHeight).toBeGreaterThanOrEqual(48);
    }
    expect(screen.getByTestId('booster-mind-shield').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('booster-extra-time').props.accessibilityState.disabled).toBe(false);
    expect(screen.getByRole('progressbar', { name: 'Seconds remaining' }).props.accessibilityValue.now).toBe(12);
  },
);

test('long prompts stay complete and use the compact two-column answer layout', async () => {
  const prompt = 'Sunlight travels through the vacuum of space before it reaches our planet. Approximately how many minutes does light from the Sun take to reach the surface of Earth?';
  await openBattle(390, 844, 1, prompt);
  expect(screen.getByText(prompt).props.numberOfLines).toBeUndefined();
  expect(StyleSheet.flatten(screen.getByTestId('battle-answers').props.style).flexWrap).toBe('wrap');
  expect(screen.getAllByTestId(/^answer-/)).toHaveLength(4);
});

test('50:50 keeps removed answers visible and disables further boosters without resetting the clock', async () => {
  await openBattle();
  await act(() => jest.advanceTimersByTime(1000));
  await fireEvent.press(screen.getByTestId('booster-50-50'));
  expect(screen.getByRole('progressbar', { name: 'Seconds remaining' }).props.accessibilityValue.now).toBe(11);
  expect(screen.getAllByTestId(/^answer-/)).toHaveLength(4);
  expect(screen.getAllByRole('button', { name: /removed by 50:50/ })).toHaveLength(2);
  expect(screen.getByTestId('booster-extra-time').props.accessibilityState.disabled).toBe(true);
  expect(screen.getByTestId('booster-second-chance').props.accessibilityLabel).toContain('unavailable');
  expect(screen.getByTestId('booster-50-50').props.accessibilityLabel).toContain('used');
});

test('Second Chance stays in the dock and keep-answer remains operable', async () => {
  await openBattle();
  const battle = useBattleStore.getState().battle!;
  await fireEvent.press(screen.getByTestId(`answer-${wrongOption(battle, 'player')}`));
  expect(screen.getByTestId('booster-second-chance').props.accessibilityState.disabled).toBe(false);
  await fireEvent.press(screen.getByTestId('booster-second-chance'));
  expect(selectBattleView(useBattleStore.getState().battle!, 0).question?.status).toBe('retrying');
  expect(screen.queryByRole('button', { name: 'Keep answer' })).toBeNull();
});

test('keep-answer locks the submission without spending Second Chance', async () => {
  await openBattle();
  await fireEvent.press(screen.getByTestId(`answer-${wrongOption(useBattleStore.getState().battle!, 'player')}`));
  await fireEvent.press(screen.getByRole('button', { name: 'Keep answer' }));
  expect(selectBattleView(useBattleStore.getState().battle!, 0).question?.status).toBe('locked');
  expect(screen.getAllByTestId(/^answer-/).every((answer) => answer.props.accessibilityState.disabled)).toBe(true);
});

test('a resolution without an automatic deadline retains an operable Continue action', async () => {
  await openBattle();
  const resolved = play(useBattleStore.getState().battle!, { player: 'correct', opponent: 'correct' });
  await act(() => {
    jest.setSystemTime(resolved.nowMs);
    useBattleStore.setState({ battle: resolved, nowMs: resolved.nowMs, revealUntilMs: null });
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(useBattleStore.getState().battle?.phase).toBe('open');
  expect(useBattleStore.getState().battle?.turn?.key).not.toBe(resolved.turn?.key);
});
