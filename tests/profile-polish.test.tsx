import { afterEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { AccessibilityInfo, AppState, Dimensions, Platform, StyleSheet } from 'react-native';

import Profile from '../app/(tabs)/profile';
import Settings from '../app/settings';
import { BattleScreen } from '../src/components/battle/BattleScreen';
import { useBattleClock } from '../src/features/battle/useBattleClock';
import { useBattleStore } from '../src/features/battle/store';
import { useMatchSetupStore } from '../src/features/match-setup/store';
import Matchmaking from '../app/battle/matchmaking';
import { PLAYER_DATA_KEY } from '../src/services/player-storage';
import { usePlayerStore } from '../src/store/player-store';
import { useReducedMotion } from '../src/hooks/useReducedMotion';
import { layout } from '../src/theme';
import { manualBattle, ok, play, withHp } from './battle/helpers';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    Stack: { Screen: () => null },
    useRouter: () => ({ push: jest.fn(), navigate: jest.fn(), replace: jest.fn(), canGoBack: () => false }),
    useFocusEffect: function useFocusEffect(callback: () => void | (() => void)) { useEffect(callback, [callback]); },
  };
});

const originalAppState = AppState.currentState;
const originalDimensions = { window: Dimensions.get('window'), screen: Dimensions.get('screen') };
afterEach(() => {
  AppState.currentState = originalAppState;
  jest.restoreAllMocks();
  jest.useRealTimers();
  Dimensions.set(originalDimensions);
});

const finished = (id: string) => play(withHp(manualBattle({ matchId: id }), { opponent: 1 }),
  { player: 'correct', opponent: 'wrong' });

test('Phase 7 migrates version 2 without losing progression, equipment or claim receipts', async () => {
  await usePlayerStore.getState().claimMatch(finished('migration'));
  const current = usePlayerStore.getState();
  const raw = await AsyncStorage.getItem(PLAYER_DATA_KEY);
  if (!raw) throw new Error('Missing saved player.');
  const legacy = { ...JSON.parse(raw), version: 2 };
  delete legacy.avatarId;
  delete legacy.settings;
  await AsyncStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(legacy));
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  await usePlayerStore.getState().hydrate();
  expect(usePlayerStore.getState()).toMatchObject({
    version: 3, profile: current.profile, matches: current.matches, collectionIds: current.collectionIds,
    boosterIds: current.boosterIds, fighterId: current.fighterId, nextMatchNumber: current.nextMatchNumber,
    avatarId: 'initials', settings: { soundEnabled: false, reducedMotion: false },
  });
  await usePlayerStore.getState().claimMatch(finished('migration'));
  expect(usePlayerStore.getState().profile).toEqual(current.profile);
  expect(JSON.parse((await AsyncStorage.getItem(PLAYER_DATA_KEY))!).version).toBe(3);
});

test('Phase 7 identity and preferences persist alongside concurrent rewards', async () => {
  await usePlayerStore.getState().hydrate();
  await Promise.all([
    usePlayerStore.getState().saveIdentity('  New   Brawler  ', 'shield'),
    usePlayerStore.getState().saveSettings({ soundEnabled: true, reducedMotion: true }),
    usePlayerStore.getState().claimMatch(finished('concurrent')),
  ]);
  const expected = usePlayerStore.getState().profile;
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  await usePlayerStore.getState().hydrate();
  expect(usePlayerStore.getState()).toMatchObject({
    profile: expected, avatarId: 'shield', settings: { soundEnabled: true, reducedMotion: true },
  });
  expect(expected.username).toBe('New Brawler');
  expect(usePlayerStore.getState().matches).toHaveLength(1);
  await expect(usePlayerStore.getState().saveIdentity(' ', 'initials')).rejects.toThrow('between 2 and 24');
  await expect(usePlayerStore.getState().saveIdentity('x'.repeat(25), 'initials')).rejects.toThrow('between 2 and 24');
});

test('Phase 7 failed preference writes stay visible, retain previous values, and can be retried', async () => {
  await usePlayerStore.getState().hydrate();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk unavailable'));
  await render(<Settings />);
  await fireEvent.press(screen.getByRole('switch', { name: 'Reduce motion' }));
  expect(screen.getByRole('alert').props.children).toContain('not saved');
  expect(screen.getByRole('switch', { name: 'Reduce motion' }).props.accessibilityState.checked).toBe(false);
  await fireEvent.press(screen.getByRole('switch', { name: 'Reduce motion' }));
  expect(screen.getByRole('switch', { name: 'Reduce motion' }).props.accessibilityState.checked).toBe(true);
  expect(screen.getByText('Preference saved.')).toBeTruthy();
});

test('Phase 7 malformed preferences fail closed without overwriting storage', async () => {
  await usePlayerStore.getState().hydrate();
  const raw = await AsyncStorage.getItem(PLAYER_DATA_KEY);
  if (!raw) throw new Error('Missing saved player.');
  const invalid = JSON.stringify({ ...JSON.parse(raw), settings: { soundEnabled: 'yes', reducedMotion: false } });
  await AsyncStorage.setItem(PLAYER_DATA_KEY, invalid);
  usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  await usePlayerStore.getState().hydrate();
  await render(<Profile />);
  expect(usePlayerStore.getState().status).toBe('error');
  expect(await AsyncStorage.getItem(PLAYER_DATA_KEY)).toBe(invalid);
  expect(screen.getByRole('button', { name: 'Retry loading player data' })).toBeTruthy();
  expect(screen.queryByText('Match statistics')).toBeNull();
});

test('Phase 7 Profile renders empty history and earned win/loss statistics; Settings saves identity', async () => {
  await usePlayerStore.getState().hydrate();
  const profile = await render(<Profile />);
  expect(screen.getByText('No completed matches yet')).toBeTruthy();
  expect(screen.getByLabelText('Initials player avatar')).toBeTruthy();
  expect(screen.getByText('Demo rank: Bronze II')).toBeTruthy();
  await act(async () => {
    await usePlayerStore.getState().claimMatch(finished('win'));
    await usePlayerStore.getState().claimMatch(ok(manualBattle({ matchId: 'forfeit' }), { type: 'forfeit', side: 'player', atMs: 0 }));
  });
  expect(screen.getByText('50%')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Defeat \(forfeit\) vs/ })).toBeTruthy();
  await profile.unmount();
  await render(<Settings />);
  await fireEvent.changeText(screen.getByLabelText('Player name'), 'Small Screen Brawler');
  await fireEvent.press(screen.getByRole('radio', { name: 'Star avatar' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save identity' }));
  expect(screen.getByText('Identity saved.')).toBeTruthy();
  expect(usePlayerStore.getState()).toMatchObject({ profile: { username: 'Small Screen Brawler' }, avatarId: 'star' });
  expect(screen.getByRole('switch', { name: 'Sound effects' }).props.accessibilityState.checked).toBe(false);
});

test('Phase 7 reduced motion honors either app or OS preference, never overriding the OS', async () => {
  await usePlayerStore.getState().hydrate();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const subscribe = jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  const hook = await renderHook(useReducedMotion);
  expect(hook.result.current).toBe(false);
  await act(async () => { await usePlayerStore.getState().saveSettings({ soundEnabled: false, reducedMotion: true }); });
  expect(hook.result.current).toBe(true);
  const listener = subscribe.mock.calls[0]?.[1];
  if (!listener) throw new Error('Missing accessibility listener.');
  await act(() => listener(true));
  await act(async () => { await usePlayerStore.getState().saveSettings({ soundEnabled: false, reducedMotion: false }); });
  expect(hook.result.current).toBe(true);
});

test.each(['ios', 'android'] as const)('Phase 7 %s structural layout at compact/reference sizes keeps long answers scrollable in safe areas', async (platform) => {
  jest.replaceProperty(Platform, 'OS', platform);
  jest.useFakeTimers();
  jest.setSystemTime(0);
  for (const [width, height, fontScale] of [[320, 640, 2], [360, 800, 1], [390, 844, 1]]) {
    const size = { width, height, scale: 1, fontScale };
    await act(() => Dimensions.set({ window: size, screen: size }));
    const initial = manualBattle();
    const turn = initial.turn?.sides.player;
    if (!turn) throw new Error('Missing player question.');
    turn.question = { ...turn.question, prompt: 'A deliberately long question with wrapping text. '.repeat(15),
      options: ['First long answer '.repeat(8), 'Second long answer '.repeat(8), 'Third long answer '.repeat(8), 'Fourth long answer '.repeat(8)] };
    useBattleStore.setState({ battle: initial, nowMs: 0 });
    const app = await render(<BattleScreen route="arena" />);
    const safeArea = screen.getByTestId('screen-safe-area');
    expect(safeArea.props.edges).toMatchObject({ top: 'additive', bottom: 'additive', left: 'additive', right: 'additive' });
    const tray = screen.getByTestId('battle-answer-scroll');
    expect(StyleSheet.flatten(tray.props.style).maxHeight).toBe(height * 0.55);
    expect(screen.getByTestId('screen-footer')).toBeTruthy();
    for (const label of ['A', 'B', 'C', 'D']) {
      const button = screen.getByRole('button', { name: new RegExp(`^${label}\\. `) });
      expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(layout.touchTarget);
      let ancestor = button.parent;
      while (ancestor && ancestor !== tray) ancestor = ancestor.parent;
      expect(ancestor).toBe(tray);
    }
    expect(screen.getByText(turn.question.prompt).props.numberOfLines).toBeUndefined();
    await fireEvent.press(screen.getByRole('button', { name: 'Forfeit' }));
    expect(screen.getByText('Forfeit this match?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Keep playing' }));
    await app.unmount();
  }
});

test('Phase 7 battle background/resume catches up once and cleans up intervals', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
  AppState.currentState = 'active';
  const remove = jest.fn();
  const subscribe = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
  const intervals = jest.spyOn(globalThis, 'setInterval');
  const clear = jest.spyOn(globalThis, 'clearInterval');
  useBattleStore.setState({ battle: manualBattle(), nowMs: 0 });
  const hook = await renderHook(() => useBattleClock(true));
  const listener = subscribe.mock.calls[0]?.[1];
  if (!listener) throw new Error('Missing lifecycle subscription.');
  await act(() => listener('inactive'));
  await act(() => listener('background'));
  await act(() => jest.advanceTimersByTime(20000));
  expect(useBattleStore.getState().nowMs).toBe(0);
  await act(() => listener('active'));
  const resumed = useBattleStore.getState().battle;
  expect(resumed?.phase).toBe('resolved');
  expect(resumed?.fighters.player.stats.timeouts).toBe(1);
  await act(() => listener('active'));
  expect(useBattleStore.getState().battle).toBe(resumed);
  expect(intervals).toHaveBeenCalledTimes(2);
  await hook.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
  for (const result of intervals.mock.results) {
    if (result.type === 'return') expect(clear).toHaveBeenCalledWith(result.value);
  }
});

test('Phase 7 matchmaking cancels background work and resumes with only one found match', async () => {
  jest.useFakeTimers();
  AppState.currentState = 'active';
  const subscribe = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
  await usePlayerStore.getState().hydrate();
  useMatchSetupStore.getState().beginSetup('offline-duel');
  const app = await render(<Matchmaking />);
  const listener = subscribe.mock.calls[0]?.[1];
  if (!listener) throw new Error('Missing matchmaking lifecycle subscription.');
  await act(() => listener('background'));
  await act(() => jest.advanceTimersByTime(5000));
  expect(useMatchSetupStore.getState().match).toBeNull();
  await act(() => listener('active'));
  await act(() => jest.advanceTimersByTime(1200));
  expect(useMatchSetupStore.getState().match).not.toBeNull();
  expect(usePlayerStore.getState().nextMatchNumber).toBe(2);
  await act(() => useMatchSetupStore.getState().beginSetup('offline-duel'));
  await app.unmount();
  await act(() => jest.advanceTimersByTime(5000));
  expect(useMatchSetupStore.getState().match).toBeNull();
  expect(usePlayerStore.getState().nextMatchNumber).toBe(2);
  for (const result of subscribe.mock.results) {
    if (result.type === 'return') expect(result.value.remove).toHaveBeenCalled();
  }
});
