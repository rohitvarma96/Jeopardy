import { afterEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_LOADOUT } from '../../src/data/boosters';
import { CATEGORY_IDS } from '../../src/data/categories';
import { OPPONENTS } from '../../src/data/opponents';
import {
  availableCategories,
  createDraft,
  isDraftComplete,
  submitBan,
  submitPick,
} from '../../src/features/category-draft/draft';
import { isValidLoadout, loadoutError, toggleBooster } from '../../src/features/loadout/loadout';
import { useMatchSetupStore, validateMatchSetup } from '../../src/features/match-setup/store';
import type { BoosterId } from '../../src/game/types/booster';
import type { Opponent } from '../../src/game/types/match';
import { PLAYER_DATA_KEY } from '../../src/services/player-storage';
import {
  createMockMatchmakingService,
  MatchmakingCancelledError,
  resolveMockMatch,
} from '../../src/services/mock-matchmaking';
import {
  DEFAULT_SELECTIONS,
  parseStoredSelections,
  PLAYER_SELECTIONS_KEY,
  usePlayerStore,
} from '../../src/store/player-store';

const nightQuill: Opponent = OPPONENTS[0];

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('category draft', () => {
  test('runs ban, opponent ban, pick, opponent pick and system fill in order', () => {
    let draft = createDraft();
    expect(() => submitPick(draft, 'science', nightQuill, 1)).toThrow('Picks are not open.');

    draft = submitBan(draft, 'history', nightQuill);
    expect(draft).toMatchObject({ stage: 'pick', playerBan: 'history', opponentBan: 'geography' });
    expect(() => submitBan(draft, 'science', nightQuill)).toThrow('The ban phase is over.');
    expect(() => submitPick(draft, 'geography', nightQuill, 1)).toThrow('not available');

    draft = submitPick(draft, 'sports', nightQuill, 1);
    expect(draft.opponentPick).toBe('technology');
    expect(draft.rounds.slice(0, 2)).toEqual([
      { categoryId: 'sports', source: 'player' },
      { categoryId: 'technology', source: 'opponent' },
    ]);
    const ids = draft.rounds.map((round) => round.categoryId);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(ids).not.toContain('history');
    expect(ids).not.toContain('geography');
    expect(draft.rounds.slice(2).every((round) => round.source === 'system')).toBe(true);
    expect(isDraftComplete(draft)).toBe(true);
  });

  test('is deterministic for the same seed and opponent', () => {
    const run = (seed: number) =>
      submitPick(submitBan(createDraft(), 'music', nightQuill), 'space', nightQuill, seed).rounds;
    expect(run(7)).toEqual(run(7));
    expect(isDraftComplete(createDraft())).toBe(false);
    expect(isDraftComplete(null)).toBe(false);
  });

  test('the opponent falls back to canonical order when its priorities are taken', () => {
    const blank: Opponent = { ...nightQuill, banPriority: [], pickPriority: [] };
    const draft = submitBan(createDraft(), CATEGORY_IDS[0], blank);
    expect(draft.opponentBan).toBe(CATEGORY_IDS[1]);
    expect(availableCategories(draft)).toEqual(CATEGORY_IDS.slice(2));
  });
});

describe('loadout rules', () => {
  test('toggling never exceeds three boosters or duplicates one', () => {
    let selection: BoosterId[] = [];
    for (const id of ['50-50', 'extra-time', 'mind-shield', 'double-damage'] as const) {
      selection = toggleBooster(selection, id);
    }
    expect(selection).toEqual(['50-50', 'extra-time', 'mind-shield']);
    selection = toggleBooster(selection, 'extra-time');
    expect(selection).toEqual(['50-50', 'mind-shield']);
    expect(loadoutError(selection)).toBe('Select exactly 3 boosters (2 selected).');
    expect(loadoutError(['50-50', '50-50', 'extra-time'])).toBe('Boosters must be distinct.');
    expect(loadoutError(DEFAULT_LOADOUT)).toBeNull();
  });

  test.each([
    [DEFAULT_LOADOUT, true],
    [['50-50', 'extra-time'], false],
    [['50-50', 'extra-time', 'mind-shield', 'streak-saver'], false],
    [['50-50', '50-50', 'extra-time'], false],
    [['50-50', 'extra-time', 'unknown'], false],
    ['50-50', false],
  ])('isValidLoadout(%j) is %s', (ids, expected) => {
    expect(isValidLoadout(ids)).toBe(expected);
  });
});

describe('mock matchmaking', () => {
  test('the same seed always resolves the same local opponent', () => {
    const match = resolveMockMatch({ modeId: 'offline-duel', seed: 2 });
    expect(match).toEqual({ matchId: 'local-2', seed: 2, modeId: 'offline-duel', opponent: OPPONENTS[1] });
    expect(resolveMockMatch({ modeId: 'offline-duel', seed: 2 })).toEqual(match);
    expect(resolveMockMatch({ modeId: 'offline-duel', seed: 5 }).opponent).toBe(OPPONENTS[0]);
    expect(() => resolveMockMatch({ modeId: 'offline-duel', seed: 0 })).toThrow(RangeError);
  });

  test('resolves after the delay and cancels cleanly', async () => {
    jest.useFakeTimers();
    const service = createMockMatchmakingService(1000);
    const found = service.findOpponent({ modeId: 'offline-duel', seed: 1 }, new AbortController().signal);
    await jest.advanceTimersByTimeAsync(1000);
    await expect(found).resolves.toMatchObject({ matchId: 'local-1' });

    const controller = new AbortController();
    const cancelled = service.findOpponent({ modeId: 'offline-duel', seed: 1 }, controller.signal);
    controller.abort();
    await expect(cancelled).rejects.toBeInstanceOf(MatchmakingCancelledError);
    expect(jest.getTimerCount()).toBe(0);
    await expect(service.findOpponent({ modeId: 'offline-duel', seed: 1 }, controller.signal))
      .rejects.toBeInstanceOf(MatchmakingCancelledError);
  });
});

describe('match setup store', () => {
  test('validates every pre-battle step before the battle can start', () => {
    const store = useMatchSetupStore.getState();
    expect(() => store.beginSetup('ranked-online')).toThrow('not available offline');
    expect(validateMatchSetup({ match: null, draft: null, fighterId: null }, [])).toEqual([
      'No active offline match.',
      'The category draft is incomplete.',
      'Choose a fighter.',
      'Select exactly three distinct boosters.',
    ]);

    store.beginSetup('offline-duel');
    useMatchSetupStore.getState().matchFound(resolveMockMatch({ modeId: 'friend-challenge', seed: 1 }));
    expect(useMatchSetupStore.getState().match).toBeNull();
    useMatchSetupStore.getState().matchFound(resolveMockMatch({ modeId: 'offline-duel', seed: 1 }));
    expect(useMatchSetupStore.getState().nextSeed).toBe(2);
    expect(() => useMatchSetupStore.getState().confirmFighter('titan')).toThrow('Finish the category draft');

    useMatchSetupStore.getState().ban('history');
    useMatchSetupStore.getState().pick('sports');
    usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:titan'] }));
    useMatchSetupStore.getState().confirmFighter('titan');
    expect(useMatchSetupStore.getState().confirmLoadout(['50-50'])).toEqual({
      ok: false,
      errors: ['Select exactly three distinct boosters.'],
    });
    const result = useMatchSetupStore.getState().confirmLoadout(DEFAULT_LOADOUT);
    expect(result).toMatchObject({ ok: true, setup: { matchId: 'local-1', fighterId: 'titan' } });
    expect(useMatchSetupStore.getState().ready).toEqual(result.ok ? result.setup : null);

    useMatchSetupStore.getState().reset();
    expect(useMatchSetupStore.getState()).toMatchObject({ match: null, draft: null, nextSeed: 2 });
  });
});

describe('persisted player selections', () => {
  const stored = (value: object) => JSON.stringify({ version: 1, ...value });

  test.each([
    ['missing', null, DEFAULT_SELECTIONS, false],
    ['malformed', '{', DEFAULT_SELECTIONS, true],
    ['non-object', '"titan"', DEFAULT_SELECTIONS, true],
    ['outdated', JSON.stringify({ version: 0, ...DEFAULT_SELECTIONS }), DEFAULT_SELECTIONS, true],
    [
      'partially invalid',
      stored({ fighterId: 'titan', boosterIds: ['50-50', '50-50', 'extra-time'] }),
      { fighterId: 'titan', boosterIds: DEFAULT_LOADOUT },
      true,
    ],
    [
      'valid',
      stored({ fighterId: 'sylva', boosterIds: ['second-chance', 'streak-saver', 'double-damage'] }),
      { fighterId: 'sylva', boosterIds: ['second-chance', 'streak-saver', 'double-damage'] },
      false,
    ],
  ])('%s data loads safely', (_label, raw, selections, repaired) => {
    expect(parseStoredSelections(raw)).toEqual({ selections, repaired });
  });

  test('hydrates once, repairs corrupt storage and saves validated selections', async () => {
    await AsyncStorage.setItem(PLAYER_SELECTIONS_KEY, stored({ fighterId: 'ghost', boosterIds: [] }));
    await Promise.all([usePlayerStore.getState().hydrate(), usePlayerStore.getState().hydrate()]);
    expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
    expect(usePlayerStore.getState()).toMatchObject({ ...DEFAULT_SELECTIONS, status: 'ready' });
    expect(JSON.parse((await AsyncStorage.getItem(PLAYER_DATA_KEY)) ?? '')).toMatchObject({
      version: 3,
      ...DEFAULT_SELECTIONS,
    });

    usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:shadow', 'booster:streak-saver'] }));
    await expect(usePlayerStore.getState().saveFighter('shadow')).resolves.toBe(true);
    await expect(usePlayerStore.getState().saveLoadout(['streak-saver', '50-50', 'extra-time']))
      .resolves.toBe(true);
    await expect(usePlayerStore.getState().saveLoadout(['50-50'] as never)).rejects.toThrow('exactly three');
    expect(JSON.parse((await AsyncStorage.getItem(PLAYER_DATA_KEY)) ?? '')).toMatchObject({
      version: 3,
      fighterId: 'shadow',
      boosterIds: ['streak-saver', '50-50', 'extra-time'],
    });
  });

  test('storage failures stay visible and do not publish unpersisted equipment', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('disk unavailable'));
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk full'));
    await usePlayerStore.getState().hydrate();
    expect(usePlayerStore.getState()).toMatchObject({ ...DEFAULT_SELECTIONS, status: 'error' });
    await expect(usePlayerStore.getState().saveFighter('arcane')).resolves.toBe(false);
    expect(usePlayerStore.getState().fighterId).toBe('arcane');
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
