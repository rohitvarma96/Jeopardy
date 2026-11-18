import { afterEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, act } from '@testing-library/react-native';
import { AccessibilityInfo, AppState } from 'react-native';
import * as Native from 'react-native';

import Arena from '../app/(tabs)/arena';
import Armory from '../app/(tabs)/armory';
import Brawlers from '../app/(tabs)/brawlers';
import Vault from '../app/(tabs)/vault';
import Career from '../app/(tabs)/career';
import { SceneEntrance } from '../src/components/world/WorldScene';
import { AppText } from '../src/components/ui';
import { WorldIcon } from '../src/components/world/WorldIcon';
import { worldIcons } from '../src/assets/world-icons';
import { preparationError, replacePower } from '../src/features/loadout/preparation';
import { useMatchSetupStore } from '../src/features/match-setup/store';
import { useBattleStore } from '../src/features/battle/store';
import { careerMilestones } from '../src/features/progression/career';
import { resolveMockMatch } from '../src/services/mock-matchmaking';
import { usePlayerStore } from '../src/store/player-store';
import { routes } from '../src/navigation/routes';
import { manualBattle, play, withHp } from './battle/continuous-fixtures';

const mockRouter = { push: jest.fn(), navigate: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false };
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual<typeof import('react')>('react');
  return {
    useRouter: () => mockRouter,
    useFocusEffect: (callback: () => void | (() => void)) => useEffect(callback, [callback]),
  };
});

afterEach(() => { jest.restoreAllMocks(); });

test('Arena deploys directly using saved preparation, without a mode/fighter/loadout wizard', async () => {
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  expect(screen.getByRole('header', { name: 'Arena' })).toBeTruthy();
  expect(screen.getByRole('image', { name: 'Astral Sage artwork' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Duel' }));
  expect(useMatchSetupStore.getState().modeId).toBe('offline-duel');
  expect(mockRouter.push).toHaveBeenCalledWith(routes.matchmaking);
  expect(mockRouter.push).not.toHaveBeenCalledWith(routes.mode);
});

test('world shortcuts lead to Brawlers, Armory and real pending rewards', async () => {
  await usePlayerStore.getState().hydrate();
  await render(<Arena />);
  await fireEvent.press(screen.getByRole('button', { name: 'Change Brawler' }));
  expect(mockRouter.navigate).toHaveBeenCalledWith(routes.brawlers);
  await fireEvent.press(screen.getByRole('button', { name: 'Inspect power socket 2' }));
  expect(mockRouter.navigate).toHaveBeenCalledWith(routes.armory);
  await fireEvent.press(screen.getByRole('button', { name: 'Open earned chests' }));
  expect(mockRouter.navigate).toHaveBeenCalledWith(routes.vault);
});

test('a legacy incompatible kit is visibly repairable and cannot deploy', async () => {
  await usePlayerStore.getState().hydrate();
  usePlayerStore.setState({ boosterIds: ['50-50', 'extra-time', 'second-chance'] });
  await render(<Arena />);
  expect(screen.queryByRole('button', { name: 'Duel' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Repair kit' }));
  expect(mockRouter.navigate).toHaveBeenCalledWith(routes.armory);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

test('a pending unsaved result disables deployment and offers explicit save retry', async () => {
  await usePlayerStore.getState().hydrate();
  useBattleStore.setState({ battle: play(withHp(manualBattle(), { opponent: 1 }), { player: 'correct', opponent: 'wrong' }) });
  await render(<Arena />);
  expect(screen.getByRole('button', { name: 'Duel', disabled: true })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saving finished match' }));
  expect(screen.getByRole('button', { name: 'Duel', disabled: false })).toBeTruthy();
});

test('locked Brawlers can be inspected but not equipped; owned saves remain authoritative', async () => {
  await usePlayerStore.getState().hydrate();
  await render(<Brawlers />);
  await fireEvent.press(screen.getByRole('radio', { name: 'Nightblade' }));
  expect(screen.getByRole('button', { name: 'Locked', disabled: true })).toBeTruthy();
  expect(usePlayerStore.getState().fighterId).toBe('arcane');
  await act(() => { usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:shadow'] })); });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(usePlayerStore.getState().fighterId).toBe('arcane');
  await fireEvent.press(screen.getByRole('button', { name: 'Equip Nightblade' }));
  expect(usePlayerStore.getState().fighterId).toBe('shadow');
  expect(screen.getByRole('button', { name: 'Equipped', disabled: true })).toBeTruthy();
});

test('three-socket Armory prevents duplicates and rolls back a failed replacement', async () => {
  await usePlayerStore.getState().hydrate();
  usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'booster:double-damage'] }));
  await render(<Armory />);
  await fireEvent.press(screen.getByRole('radio', { name: 'Power socket 2: Extra Time' }));
  await fireEvent.press(screen.getByRole('radio', { name: '50:50' }));
  expect(screen.getByRole('button', { name: 'Fit socket 2', disabled: true })).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Double Damage' }));
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));
  await fireEvent.press(screen.getByRole('button', { name: 'Fit socket 2' }));
  expect(usePlayerStore.getState().boosterIds).toEqual(['50-50', 'extra-time', 'mind-shield']);
  expect(screen.getByRole('alert')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Fit socket 2' }));
  expect(usePlayerStore.getState().boosterIds).toEqual(['50-50', 'double-damage', 'mind-shield']);
});

test('saved preparation is validated before assembling a ready match, with no new save needed', async () => {
  await usePlayerStore.getState().hydrate();
  const setup = useMatchSetupStore.getState();
  expect(setup.prepareSavedEquipment().ok).toBe(false);
  setup.beginSetup('offline-duel');
  setup.matchFound({ ...resolveMockMatch({ modeId: 'offline-duel', seed: 1 }), matchId: 'prepared-match' });
  useMatchSetupStore.getState().ban('science');
  useMatchSetupStore.getState().pick('space');
  const writes = jest.spyOn(AsyncStorage, 'setItem');
  const beforeWrites = writes.mock.calls.length;
  const result = useMatchSetupStore.getState().prepareSavedEquipment();
  expect(result).toMatchObject({ ok: true, setup: { fighterId: 'arcane', boosterIds: ['50-50', 'extra-time', 'mind-shield'] } });
  expect(writes.mock.calls.length).toBe(beforeWrites);
  expect(useBattleStore.getState().battle).toBeNull();
});

test('one-for-one replacement validates socket, compatibility and uniqueness', () => {
  const original = ['50-50', 'extra-time', 'mind-shield'] as const;
  expect(replacePower(original, 1, 'double-damage')).toEqual(['50-50', 'double-damage', 'mind-shield']);
  expect(original).toEqual(['50-50', 'extra-time', 'mind-shield']);
  expect(() => replacePower(original, 1, '50-50')).toThrow('two sockets');
  expect(() => replacePower(original, 0, 'second-chance')).toThrow('unavailable');
  expect(() => replacePower(original, 3, 'double-damage')).toThrow(RangeError);
  expect(preparationError({ status: 'loading', fighterId: 'arcane', boosterIds: original, collectionIds: [] })).toContain('Load');
});

test('Vault lists only genuinely unopened earned chests', async () => {
  await usePlayerStore.getState().hydrate();
  const battle = play(withHp(manualBattle(), { opponent: 1 }), { player: 'correct', opponent: 'wrong' });
  await usePlayerStore.getState().claimMatch(battle);
  await render(<Vault />);
  expect(screen.getByText('1 unopened chest / saved on this device')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Inspect earned chest' }));
  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: routes.rewards, params: { matchId: battle.setup.matchId } });
  await act(async () => { await usePlayerStore.getState().openCapsule(battle.setup.matchId); });
  await fireEvent.press(screen.getByRole('tab', { name: 'Earned chests' }));
  expect(screen.getByText('0 unopened chests / saved on this device')).toBeTruthy();
});

test('an empty Vault starts with four repeatable practice chests instead of an empty screen', async () => {
  await usePlayerStore.getState().hydrate();
  const before = usePlayerStore.getState();
  await render(<Vault />);
  expect(screen.getByRole('tab', { name: 'Practice chests', selected: true })).toBeTruthy();
  for (const family of ['Field', 'Arc', 'Overdrive', 'Sovereign']) {
    await fireEvent.press(screen.getByRole('button', { name: `Open practice ${family} Chest` }));
    expect(mockRouter.push).toHaveBeenLastCalledWith({
      pathname: routes.chestForge, params: { family: family.toLowerCase(), discovery: '1' },
    });
    if (family !== 'Sovereign') await fireEvent.press(screen.getByRole('button', { name: 'Next practice chest' }));
  }
  expect(usePlayerStore.getState()).toBe(before);
});

test('Career and milestones are derived recognition, not fake rewards or rank', async () => {
  await usePlayerStore.getState().hydrate();
  await render(<Career />);
  expect(screen.getByText('Demo rank: Bronze II')).toBeTruthy();
  await fireEvent.press(screen.getByRole('tab', { name: 'milestones' }));
  expect(screen.getByText('First full duel')).toBeTruthy();
  expect(careerMilestones([], 1)[0].value).toBe(0);
  expect(screen.queryByRole('button', { name: /claim/i })).toBeNull();
});

test.each([[320, 568, 1], [390, 844, 2], [1440, 900, 1]])('world screens remain fixed at %sx%s / %sx text', async (width, height, fontScale) => {
  jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width, height, fontScale, scale: 1 });
  await usePlayerStore.getState().hydrate();
  const app = await render(<Arena />);
  expect(JSON.stringify(screen.toJSON())).not.toMatch(/ScrollView|FlatList/);
  expect(screen.getByRole('button', { name: 'Duel' })).toBeTruthy();
  await app.rerender(<Armory />);
  expect(screen.getAllByRole('radio')).toHaveLength(9);
  await app.rerender(<Brawlers />);
  expect(screen.getAllByRole('radio')).toHaveLength(6);
});

test('scene entrance respects system motion reduction and does not change game data', async () => {
  AppState.currentState = 'active';
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const before = usePlayerStore.getState();
  await render(<SceneEntrance><AppText>Scene content</AppText></SceneEntrance>);
  expect(screen.getByText('Scene content')).toBeTruthy();
  expect(usePlayerStore.getState()).toBe(before);
});

test('all world sigils are bundled images, not one graphics context per icon', async () => {
  expect(Object.keys(worldIcons)).toHaveLength(31);
  await render(<WorldIcon name="armory" size={32} color="#EEFA36" />);
  expect(JSON.stringify(screen.toJSON())).not.toContain('Canvas');
});
