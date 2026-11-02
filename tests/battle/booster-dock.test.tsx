import { afterEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { BoosterDock } from '../../src/components/battle/BoosterDock';
import { DEFAULT_LOADOUT, getBooster } from '../../src/data/boosters';
import { useBattleStore } from '../../src/features/battle/store';
import { createBattle, selectBattleView, type BattleState, type BattleView } from '../../src/game/battle';
import type { BoosterId, BoosterLoadout } from '../../src/game/types/booster';
import { colors } from '../../src/theme';

afterEach(() => { jest.useRealTimers(); });

function Dock({ condensed }: { condensed: boolean }) {
  const battle = useBattleStore((state) => state.battle)!;
  const nowMs = useBattleStore((state) => state.nowMs);
  return <BoosterDock view={selectBattleView(battle, nowMs)} motionEnabled={false} condensed={condensed} />;
}

async function openDock(boosterIds: BoosterLoadout = DEFAULT_LOADOUT, condensed = false) {
  jest.useFakeTimers();
  jest.setSystemTime(0);
  const battle = createBattle({
    matchId: 'dock-test', seed: 1,
    player: { name: 'You', fighterId: 'arcane', level: 3, boosterIds },
    opponent: { name: 'Rival', fighterId: 'shadow', level: 3, boosterIds: DEFAULT_LOADOUT },
    categoryIds: ['science', 'sports', 'history', 'space', 'music'],
  }, 0, { control: 'manual' });
  useBattleStore.setState({ battle, nowMs: 0 });
  return render(<Dock condensed={condensed} />);
}

function expectUsed(id: BoosterId, armed = false) {
  const button = screen.getByTestId(`booster-${id}`);
  expect(button.props.accessibilityState.disabled).toBe(true);
  expect(button.props.accessibilityLabel).toContain(armed ? 'used / armed' : 'used');
  expect(StyleSheet.flatten(button.props.style)).toEqual(expect.objectContaining({
    backgroundColor: colors.track, borderColor: colors.border,
  }));
  expect(StyleSheet.flatten(within(button).getByText(armed ? 'USED / ARMED' : 'USED').props.style).color).toBe(colors.muted);
  expect(StyleSheet.flatten(within(button).getByText(
    id === 'extra-time' ? 'Time +5s' : id === 'mind-shield' ? 'Shield' : id === 'double-damage' ? 'Double hit'
      : id === 'streak-saver' ? 'Streak' : '50:50',
  ).props.style).color).toBe(colors.muted);
  expect(StyleSheet.flatten(screen.getByTestId(`power-icon-${id}`, { includeHiddenElements: true }).props.style).color).toBe(colors.muted);
}

test.each([false, true])('only the three equipped powers appear (condensed: %s)', async (condensed) => {
  await openDock(DEFAULT_LOADOUT, condensed);
  expect(screen.getAllByRole('button')).toHaveLength(3);
  expect(screen.getAllByText('READY')).toHaveLength(3);
  for (const id of DEFAULT_LOADOUT) {
    const button = screen.getByTestId(`booster-${id}`);
    expect(button.props.accessibilityState.disabled).toBe(false);
    expect(button.props.accessibilityLabel).toContain(getBooster(id).name);
    expect(StyleSheet.flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(48);
  }
  for (const id of ['second-chance', 'double-damage', 'streak-saver']) {
    expect(screen.queryByTestId(`booster-${id}`)).toBeNull();
  }
  expect(StyleSheet.flatten(screen.getByTestId('booster-50-50').props.style).borderColor)
    .not.toBe(StyleSheet.flatten(screen.getByTestId('booster-extra-time').props.style).borderColor);
});

test('alternative equipped powers replace the starter powers', async () => {
  await openDock(['double-damage', 'mind-shield', 'streak-saver']);
  expect(screen.getAllByRole('button')).toHaveLength(3);
  expect(screen.getByTestId('booster-double-damage').props.accessibilityState.disabled).toBe(false);
  expect(screen.getByTestId('booster-streak-saver').props.accessibilityState.disabled).toBe(false);
  expect(screen.queryByTestId('booster-50-50')).toBeNull();
  expect(screen.queryByTestId('booster-extra-time')).toBeNull();
});

test('Second Chance is not rendered even if present in a legacy view', async () => {
  await openDock();
  const view: BattleView = selectBattleView(useBattleStore.getState().battle!, 0);
  view.boosters.push({ ...getBooster('second-chance'), used: false, armed: false, canActivate: false });
  await render(<BoosterDock view={view} motionEnabled={false} />);
  expect(screen.queryByTestId('booster-second-chance')).toBeNull();
});

test.each<BoosterId>(['50-50', 'extra-time', 'mind-shield', 'double-damage', 'streak-saver'])(
  '%s turns grey immediately after activation, including armed effects',
  async (id) => {
    const others = DEFAULT_LOADOUT.filter((other) => other !== id);
    await openDock([id, others[0], others[1]]);
    await fireEvent.press(screen.getByTestId(`booster-${id}`));
    const armed = ['mind-shield', 'double-damage', 'streak-saver'].includes(id);
    expectUsed(id, armed);
    expect(useBattleStore.getState().battle!.fighters.player.boostersUsed).toHaveLength(1);
    expect(screen.getAllByText('WAIT')).toHaveLength(2);
    await fireEvent.press(screen.getByTestId(`booster-${id}`));
    expect(useBattleStore.getState().battle!.fighters.player.boostersUsed).toHaveLength(1);
    expect(useBattleStore.getState().error).toBeNull();
    if (id === 'extra-time') {
      expect(selectBattleView(useBattleStore.getState().battle!, 0).question?.remainingMs).toBe(17_000);
    }
    if (id === '50-50') {
      expect(selectBattleView(useBattleStore.getState().battle!, 0).question?.options.filter((option) => option.removed)).toHaveLength(2);
    }
  },
);

test('used power stays grey on the next question while other powers become ready', async () => {
  await openDock();
  await fireEvent.press(screen.getByTestId('booster-50-50'));
  await act(() => {
    jest.setSystemTime(12_000);
    useBattleStore.getState().tick();
    useBattleStore.getState().continue();
  });
  expectUsed('50-50');
  expect(screen.getAllByText('READY')).toHaveLength(2);
  expect(selectBattleView(useBattleStore.getState().battle!, 12_000).questionNumber).toBe(2);
});

test('shield remains grey after its armed effect is consumed', async () => {
  await openDock();
  await fireEvent.press(screen.getByTestId('booster-mind-shield'));
  const battle = useBattleStore.getState().battle!;
  const consumed: BattleState = {
    ...battle,
    fighters: {
      ...battle.fighters,
      player: { ...battle.fighters.player, armed: { ...battle.fighters.player.armed, mindShield: false } },
    },
  };
  await act(() => useBattleStore.setState({ battle: consumed }));
  expectUsed('mind-shield');
});
