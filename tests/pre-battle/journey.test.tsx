import { afterEach, describe, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { findEventHandler } from '@testing-library/react-native/dist/events/propagation';
import { act, fireEvent, renderRouter, screen, testRouter } from 'expo-router/testing-library';

import { useMatchSetupStore } from '../../src/features/match-setup/store';
import { usePlayerStore } from '../../src/store/player-store';
import { PLAYER_DATA_KEY } from '../../src/services/player-storage';
import { useBattleStore } from '../../src/features/battle/store';
import { selectBattleView } from '../../src/game/battle';
import { REWARD_RULES } from '../../src/game/rewards';
import { correctOption } from '../battle/helpers';

afterEach(() => { jest.restoreAllMocks(); });

const press = (role: 'button' | 'radio' | 'checkbox', name: string) =>
  fireEvent.press(screen.getByRole(role, { name }));

async function openHome() {
  const app = await renderRouter('./app', { initialUrl: '/arena' });
  await screen.findByText('Selected fighter');
  return app;
}

async function findOpponent() {
  await press('button', 'Play');
  await press('button', 'Find opponent');
  expect(screen.getByText('Searching for a local opponent...')).toBeTruthy();
  await screen.findByText('Opponent found', undefined, { timeout: 3000 });
}

async function draftCategories() {
  await press('button', 'Continue to category draft');
  await press('radio', 'History');
  await press('button', 'Confirm ban');
  await press('radio', 'Sports');
  await press('button', 'Confirm pick');
}

describe('Phase 8A integration', () => {
  test.each([
    ['fighter', 'Back', '/battle/category-draft'],
    ['fighter', 'Leave match', '/arena'],
    ['loadout', 'Back', '/battle/fighter-select'],
    ['loadout', 'Leave match', '/arena'],
  ] as const)('%s save cannot navigate or start battle after %s', async (step, exit, destination) => {
    const app = await openHome();
    await findOpponent();
    await draftCategories();
    await press('button', 'Continue to fighter selection');
    if (step === 'loadout') await press('button', 'Confirm Astral Sage');
    let complete!: () => void;
    jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(() => new Promise<void>((resolve) => { complete = resolve; }));
    const label = step === 'fighter' ? 'Confirm Astral Sage' : 'Save loadout and enter battle';
    const { handler: onPress } = findEventHandler(screen.getByRole('button', { name: label }), 'press', { bubbles: true });
    if (!onPress) throw new Error('Expected the button press handler.');
    let saving!: Promise<void>;
    await act(() => { saving = Promise.resolve(onPress()).then(() => undefined); });
    try {
      await press('button', exit);
      expect(app.getPathname()).toBe(destination);
    } finally {
      await act(async () => { complete(); await saving; });
    }
    expect(app.getPathname()).toBe(destination);
    expect(useBattleStore.getState().battle).toBeNull();
  });

  test.each(['win', 'loss'] as const)('launch through a complete %s, capsule, Arena, restart and replay', async (outcome) => {
    await openHome();
    const initialProfile = { ...usePlayerStore.getState().profile };
    await findOpponent();
    await draftCategories();
    await press('button', 'Continue to fighter selection');
    await press('button', 'Confirm Astral Sage');
    await press('button', 'Save loadout and enter battle');
    const stages = new Set<string>();
    for (let guard = 0; ; guard++) {
      const battle = useBattleStore.getState().battle;
      if (!battle || guard > 80) throw new Error('Match did not finish.');
      stages.add(battle.stage.kind);
      if (battle.outcome) break;
      if (battle.phase === 'resolved') {
        await act(() => {
          jest.setSystemTime(useBattleStore.getState().revealUntilMs!);
          useBattleStore.getState().tick();
        });
        continue;
      }
      const question = selectBattleView(battle, battle.nowMs).question;
      if (outcome === 'win' && question?.status === 'answering') {
        const option = question.options[correctOption(battle, 'player')];
        await act(() => jest.setSystemTime(battle.turn!.openedAtMs + 500));
        await press('button', `${option.label}. ${option.text}`);
      }
      const deadline = Math.max(...Object.values(battle.turn!.sides).map((turn) => turn.deadlineMs));
      await act(() => {
        jest.setSystemTime(deadline);
        useBattleStore.getState().tick();
      });
    }
    expect(stages).toEqual(new Set(['standard', 'round-bonus', 'clash']));
    await press('button', 'View result');
    await screen.findByText('Rewards saved');
    const record = usePlayerStore.getState().matches[0];
    expect(record.outcome.winner).toBe(outcome === 'win' ? 'player' : 'opponent');
    expect(record.xp).toBe((outcome === 'win' ? REWARD_RULES.winXp : REWARD_RULES.lossXp) +
      record.fighters.player.stats.correct * REWARD_RULES.correctXp);
    expect(usePlayerStore.getState().profile.coins).toBe(initialProfile.coins + record.coins);
    await press('button', 'Continue');
    await press('button', 'Open capsule');
    expect(usePlayerStore.getState().matches[0].capsule?.opened).toBe(true);
    const profile = { ...usePlayerStore.getState().profile };
    const inventory = [...usePlayerStore.getState().collectionIds];
    await press('button', 'Arena home');
    expect(useBattleStore.getState().battle).toBeNull();
    await screen.unmount();
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useMatchSetupStore.setState(useMatchSetupStore.getInitialState(), true);
    const restarted = await renderRouter('./app', { initialUrl: '/arena' });
    await screen.findByText('Selected fighter');
    expect(usePlayerStore.getState().profile).toEqual(profile);
    expect(usePlayerStore.getState().collectionIds).toEqual(inventory);
    await fireEvent.press(screen.getByLabelText('Profile tab'));
    await press('button', `${outcome === 'win' ? 'Victory' : 'Defeat'} vs ${record.fighters.opponent.name} - ${record.matchId}`);
    await press('button', 'Continue');
    expect(screen.queryByRole('button', { name: 'Open capsule' })).toBeNull();
    expect(usePlayerStore.getState().profile).toEqual(profile);
    await press('button', 'Play again');
    expect(restarted.getPathname()).toBe('/battle/mode');
    expect(useMatchSetupStore.getState().match).toBeNull();
    expect(testRouter.canGoBack()).toBe(true);
    await press('button', 'Back');
    expect(restarted.getPathname()).toBe('/profile');
    await fireEvent.press(screen.getByLabelText('Arena tab'));
    expect(restarted.getPathname()).toBe('/arena');
  });
});

describe('Phase 3 pre-battle journey', () => {
  test('home to loadout works with local mock data and persists selections across a restart', async () => {
    const app = await openHome();
    expect(screen.getByText('Local progression - offline prototype')).toBeTruthy();
    await act(() => usePlayerStore.setState((state) => ({ collectionIds: [...state.collectionIds, 'fighter:titan', 'booster:second-chance'] })));
    expect(screen.getByText('Rookie Brawler')).toBeTruthy();
    expect(screen.getByText('Astral Sage')).toBeTruthy();

    await findOpponent();
    expect(app.getPathname()).toBe('/battle/matchmaking');
    expect(screen.getByText('NightQuill')).toBeTruthy();

    await press('button', 'Continue to category draft');
    expect(screen.getByRole('button', { name: 'Confirm ban' }).props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await press('radio', 'History');
    await press('button', 'Confirm ban');
    expect(screen.getByText('You banned History. NightQuill banned Geography.')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Geography. Banned by NightQuill', disabled: true })).toBeTruthy();
    await press('radio', 'Sports');
    await press('button', 'Confirm pick');
    expect(screen.getByText('Round 1: Sports')).toBeTruthy();
    expect(screen.getByText('Round 2: Technology')).toBeTruthy();
    expect(screen.getByText("NightQuill's pick")).toBeTruthy();
    expect(screen.getAllByText('System')).toHaveLength(3);

    await press('button', 'Continue to fighter selection');
    expect(screen.getByRole('radio', { name: 'Astral Sage', checked: true })).toBeTruthy();
    expect(screen.queryByText('Placeholder art')).toBeNull();
    await press('radio', 'Iron Bastion');
    await press('button', 'Confirm Iron Bastion');
    expect(app.getPathname()).toBe('/battle/loadout');

    expect(screen.getByText('3 / 3 boosters selected')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Second Chance', disabled: true })).toBeTruthy();
    await press('checkbox', 'Second Chance');
    expect(screen.getByText('3 / 3 boosters selected')).toBeTruthy();
    await press('checkbox', 'Extra Time');
    expect(screen.getByText('Select exactly 3 boosters (2 selected).')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save loadout and enter battle' }).props.accessibilityState)
      .toMatchObject({ disabled: true });
    await press('checkbox', 'Second Chance');
    await press('button', 'Save loadout and enter battle');
    expect(app.getPathname()).toBe('/battle/arena');
    expect(useMatchSetupStore.getState().ready).toMatchObject({
      matchId: 'reward-match-1',
      fighterId: 'titan',
      boosterIds: ['50-50', 'mind-shield', 'second-chance'],
    });
    expect(JSON.parse((await AsyncStorage.getItem(PLAYER_DATA_KEY)) ?? '')).toMatchObject({
      version: 3,
      fighterId: 'titan',
      boosterIds: ['50-50', 'mind-shield', 'second-chance'],
    });

    // Cold restart: in-memory state is gone, storage remains.
    await screen.unmount();
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    useMatchSetupStore.setState(useMatchSetupStore.getInitialState(), true);
    await openHome();
    expect(screen.getByText('Iron Bastion')).toBeTruthy();
    await findOpponent();
    await draftCategories();
    await press('button', 'Continue to fighter selection');
    expect(screen.getByRole('radio', { name: 'Iron Bastion', checked: true })).toBeTruthy();
    await press('button', 'Confirm Iron Bastion');
    expect(screen.getByRole('checkbox', { name: 'Second Chance', checked: true })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Extra Time', checked: false })).toBeTruthy();
  });

  test('cancel, back and leave keep the setup state consistent', async () => {
    const app = await openHome();
    expect(screen.queryByRole('button', { name: 'Leave match' })).toBeNull();
    await press('button', 'Play');
    expect(screen.getByRole('radio', { name: 'Ranked Online, unavailable future mode', disabled: true }))
      .toBeTruthy();
    await press('button', 'Find opponent');
    await press('button', 'Cancel search');
    expect(app.getPathname()).toBe('/battle/mode');
    // A cancelled search must never resolve later (renderRouter installs fake timers).
    await act(() => jest.advanceTimersByTimeAsync(1400));
    expect(useMatchSetupStore.getState()).toMatchObject({ modeId: null, match: null, nextSeed: 1 });

    await press('button', 'Find opponent');
    await screen.findByText('Opponent found', undefined, { timeout: 3000 });
    await press('button', 'Continue to category draft');
    await press('button', 'Back');
    expect(app.getPathname()).toBe('/battle/matchmaking');
    expect(screen.getByText('NightQuill')).toBeTruthy();
    expect(useMatchSetupStore.getState().nextSeed).toBe(2);

    await press('button', 'Continue to category draft');
    await press('button', 'Leave match');
    expect(app.getPathname()).toBe('/arena');
    expect(testRouter.canGoBack()).toBe(false);
    expect(useMatchSetupStore.getState().match).toBeNull();

    await findOpponent();
    expect(screen.getByText('RuneScholar')).toBeTruthy();
    await press('button', 'Cancel match');
    expect(app.getPathname()).toBe('/battle/mode');
    expect(useMatchSetupStore.getState().match).toBeNull();
  });

  test.each(['/battle/matchmaking', '/battle/category-draft', '/battle/fighter-select', '/battle/loadout'])(
    'direct entry to %s is guarded and recovers to mode selection',
    async (initialUrl) => {
      const app = await renderRouter('./app', { initialUrl });
      expect(screen.getByText('Match setup not ready')).toBeTruthy();
      await press('button', 'Choose a mode');
      expect(app.getPathname()).toBe('/battle/mode');
    },
  );
});
