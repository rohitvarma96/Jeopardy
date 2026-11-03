import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { AccessibilityInfo, AppState, StyleSheet } from 'react-native';
import * as ReactNative from 'react-native';
import * as Reanimated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ANIMATION_PREVIEWS } from '../../src/components/battle/animationPreviews';
import { BattleScene } from '../../src/components/battle/BattleScene';
import { BattleScreen } from '../../src/components/battle/BattleScreen';
import { combatCues, transitionFeedback } from '../../src/components/battle/combatFeedback';
import { battlePresentation } from '../../src/components/battle/combatPresentation';
import * as FighterRigs from '../../src/components/fighters/combat/FighterRig';
import { HealthBar } from '../../src/components/ui';
import { REVEAL_MS, useBattleStore } from '../../src/features/battle/store';
import { selectBattleView, step } from '../../src/game/battle';
import { correctOption, manualBattle, wrongOption } from './continuous-fixtures';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  const router = { replace: jest.fn(), push: jest.fn(), back: jest.fn(), canGoBack: () => false };
  return {
    Stack: { Screen: () => null },
    useRouter: () => router,
    useFocusEffect: function useFocusEffect(callback: () => void | (() => void)) {
      useEffect(callback, [callback]);
    },
  };
});

const initialAppState = AppState.currentState;
afterEach(() => {
  AppState.currentState = initialAppState;
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('major presentation fixtures schedule motion and retain readable static reduced-motion feedback', async () => {
  const timing = jest.spyOn(Reanimated, 'withTiming');
  const repeat = jest.spyOn(Reanimated, 'withRepeat');
  const cancel = jest.spyOn(Reanimated, 'cancelAnimation');

  for (const { view } of ANIMATION_PREVIEWS) {
    const before = JSON.stringify(view);
    const app = await render(
      <>
        <BattleScene view={view} motionEnabled />
        <HealthBar label="Preview health" value={view.opponent.hp} animate />
      </>,
    );
    expect(screen.getByText(transitionFeedback(view).label)).toBeTruthy();
    expect(screen.getByTestId('battle-scene').props.pointerEvents).toBe('none');
    expect(screen.getByTestId('fighter-player')).toBeTruthy();
    expect(screen.getByTestId('fighter-opponent')).toBeTruthy();
    expect(screen.getByTestId('combat-skia-canvas')).toBeTruthy();
    for (const cue of combatCues(view)) {
      expect(screen.getByTestId(`damage-${cue.key}`)).toBeTruthy();
      expect(battlePresentation(view).commands[cue.attacker]).toContainEqual({ action: cue.action, atMs: cue.delayMs });
    }
    if (view.reveal?.results.player?.comboAfter === 3) expect(screen.getByText('Combo x3!')).toBeTruthy();
    if (view.question?.boosterUsed) expect(screen.getByText('Extra Time activated')).toBeTruthy();

    const cancellations = cancel.mock.calls.length;
    await app.rerender(<BattleScene view={view} motionEnabled={false} />);
    expect(cancel.mock.calls.length).toBeGreaterThan(cancellations);
    expect(screen.getByText(transitionFeedback(view).label)).toBeTruthy();
    for (const cue of combatCues(view)) {
      const label = cue.blocked ? 'Shielded' : cue.damage === 0 ? 'No damage' : `-${cue.damage}`;
      expect(within(screen.getByTestId(`damage-${cue.key}`)).getByText(label)).toBeTruthy();
    }
    expect(JSON.stringify(view)).toBe(before);
    await app.unmount();
  }
  for (const duration of [3000, 380, ...ANIMATION_PREVIEWS.map(({ view }) => battlePresentation(view).endMs).filter(Boolean)]) {
    expect(timing.mock.calls.some((call) => call[1]?.duration === duration)).toBe(true);
  }
  expect(repeat).toHaveBeenCalled();
});

test('answer submission and automatic progression preserve the battle clock during motion', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
  AppState.currentState = 'active';
  const subscribe = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const repeat = jest.spyOn(Reanimated, 'withRepeat');
  const initial = manualBattle();
  useBattleStore.setState({ battle: initial, nowMs: 0 });
  const app = await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}>
      <BattleScreen />
    </SafeAreaProvider>,
  );
  expect(repeat).toHaveBeenCalled();

  await fireEvent.press(screen.getByRole('button', { name: 'Extra Time booster, ready' }));
  expect(screen.getByText('Extra Time activated')).toBeTruthy();
  await act(() => jest.advanceTimersByTime(1000));
  expect(screen.getByRole('progressbar', { name: 'Seconds remaining' }).props.accessibilityValue.now).toBe(16);

  const beforeAnswer = useBattleStore.getState().battle!;
  const index = correctOption(beforeAnswer, 'player');
  const option = selectBattleView(beforeAnswer, Date.now()).question!.options[index];
  await fireEvent.press(screen.getByRole('button', { name: `${option.label}. ${option.text}` }));
  expect(useBattleStore.getState().battle?.turn?.sides.player?.status).toBe('final');
  expect(selectBattleView(useBattleStore.getState().battle!, Date.now()).question?.correctIndex).toBeNull();

  const waiting = useBattleStore.getState().battle!;
  const result = step(waiting, { type: 'answer', side: 'opponent', optionIndex: wrongOption(waiting, 'opponent'), atMs: Date.now() });
  if (!result.ok) throw new Error(result.error.message);
  await act(() => useBattleStore.setState({
    battle: result.state, nowMs: Date.now(), revealKey: result.state.log.at(-1)!.key,
    revealUntilMs: Date.now() + REVEAL_MS,
  }));
  expect(screen.getByRole('progressbar', { name: `${initial.fighters.opponent.name} health` }).props.accessibilityValue.now)
    .toBe(result.state.fighters.opponent.hp);
  expect(screen.getByTestId(`damage-${combatCues(selectBattleView(result.state, Date.now()))[0].key}`)).toBeTruthy();

  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  await act(() => jest.advanceTimersByTime(REVEAL_MS + 100));
  expect(useBattleStore.getState().battle?.phase).toBe('open');
  expect(useBattleStore.getState().battle?.turn?.key).not.toBe(waiting.turn?.key);
  await act(() => jest.advanceTimersByTime(1000));
  expect(screen.getByRole('progressbar', { name: 'Seconds remaining' }).props.accessibilityValue.now).toBe(11);
  const lifecycle = subscribe.mock.calls.filter(([event]) => event === 'change').map(([, listener]) => listener);
  await act(() => lifecycle.forEach((listener) => listener('background')));
  const pausedRenderTime = useBattleStore.getState().nowMs;
  await act(() => jest.advanceTimersByTime(1000));
  expect(useBattleStore.getState().nowMs).toBe(pausedRenderTime);
  await act(() => lifecycle.forEach((listener) => listener('active')));
  expect(screen.getByRole('progressbar', { name: 'Seconds remaining' }).props.accessibilityValue.now).toBe(10);
  const next = useBattleStore.getState().battle!;
  const nextOption = selectBattleView(next, Date.now()).question!.options[correctOption(next, 'player')];
  await fireEvent.press(screen.getByRole('button', { name: `${nextOption.label}. ${nextOption.text}` }));
  expect(useBattleStore.getState().battle?.turn?.sides.player?.status).toBe('final');
  await app.unmount();
  for (const subscription of subscribe.mock.results) {
    if (subscription.type === 'return') expect(subscription.value.remove).toHaveBeenCalled();
  }
});

test('tick renders do not restart motion; voided attacks never produce cosmetic damage', async () => {
  const view = ANIMATION_PREVIEWS[1].view;
  const timing = jest.spyOn(Reanimated, 'withTiming');
  const rigs = jest.spyOn(FighterRigs, 'FighterRig');
  const app = await render(<BattleScene view={view} motionEnabled />);
  const scheduled = timing.mock.calls.length;
  const drawn = rigs.mock.calls.length;
  await app.rerender(<BattleScene view={{ ...view, reveal: view.reveal ? { ...view.reveal } : null }} motionEnabled />);
  expect(timing.mock.calls.length).toBe(scheduled);
  expect(rigs.mock.calls.length).toBe(drawn);
  const reveal = view.reveal;
  if (!reveal) throw new Error('Missing preview resolution.');
  expect(combatCues({ ...view, reveal: { ...reveal, hits: reveal.hits.map((hit) => ({ ...hit, void: true })) } })).toEqual([]);
  await app.unmount();
});

test('compact phone layouts keep fighter frames inside their arena slots', async () => {
  const dimensions = jest.spyOn(ReactNative, 'useWindowDimensions');
  for (const [width, height] of [[360, 800], [390, 844]]) {
    dimensions.mockReturnValue({ width, height, scale: 1, fontScale: 1 });
    const app = await render(<BattleScene view={ANIMATION_PREVIEWS[0].view} motionEnabled={false} />);
    const sceneHeight = StyleSheet.flatten(screen.getByTestId('battle-scene').props.style).height;
    const art = StyleSheet.flatten(screen.getByLabelText('Astral Sage artwork').props.style);
    expect(sceneHeight).toBeGreaterThanOrEqual(170);
    expect(sceneHeight).toBeLessThanOrEqual(260);
    expect(art.height).toBeLessThan(sceneHeight);
    expect(art.width).toBeLessThan((width - 48) / 2);
    await app.unmount();
  }
});

test('compressed arena prioritizes fighters over the decorative round banner', async () => {
  await render(<BattleScene view={ANIMATION_PREVIEWS[0].view} motionEnabled={false} fill />);
  await fireEvent(screen.getByTestId('battle-scene'), 'layout', { nativeEvent: { layout: { width: 336, height: 80 } } });
  expect(StyleSheet.flatten(screen.getByLabelText('Astral Sage artwork').props.style).height).toBe(64);
  expect(screen.queryByText(transitionFeedback(ANIMATION_PREVIEWS[0].view).label)).toBeNull();
  expect(screen.getByTestId('fighter-opponent')).toBeTruthy();
});
