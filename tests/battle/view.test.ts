import { describe, expect, test } from '@jest/globals';

import { selectBattleView, type BattleState } from '../../src/game/battle';
import {
  activate,
  advance,
  answer,
  correctOption,
  isOpen,
  manualBattle,
  ok,
  OPPONENT,
  openedAt,
  play,
  timeoutUntil,
} from './helpers';

const view = (state: BattleState, atMs = state.nowMs) => selectBattleView(state, atMs);
const activatable = (state: BattleState, atMs = state.nowMs) =>
  Object.fromEntries(view(state, atMs).boosters.map((booster) => [booster.id, booster.canActivate]));
const NONE = { '50-50': false, 'extra-time': false, 'second-chance': false };

describe('battle view: hidden information', () => {
  test('the correct option and the outcome stay hidden until the question resolves', () => {
    let state = manualBattle();
    const fresh = view(state);
    expect(fresh.question).toMatchObject({
      key: 'r1-q1',
      kind: 'standard',
      status: 'answering',
      correctIndex: null,
      outcome: null,
      timeMs: 12_000,
      totalMs: 12_000,
      remainingMs: 12_000,
      opponentLocked: false,
    });
    expect(fresh.question!.options.every((option) => option.correct === null)).toBe(true);

    state = answer(state, 'player', true, 1_000);
    const locked = view(state);
    expect(locked.question).toMatchObject({ status: 'locked', correctIndex: null, outcome: null, remainingMs: 11_000 });
    expect(locked.question!.options.filter((option) => option.selected)).toHaveLength(1);
    expect(locked.question!.options.every((option) => option.correct === null)).toBe(true);
    expect(locked.player).toMatchObject({ combo: 0, stats: { correct: 0 } });
    expect(locked.reveal).toBeNull();

    state = play(state, { opponent: 'wrong' }, { opponent: 2_000 });
    const resolved = view(state);
    const correct = correctOption(state, 'player');
    expect(resolved.question).toMatchObject({ status: 'resolved', correctIndex: correct, outcome: 'correct', remainingMs: 0 });
    expect(resolved.question!.options.map((option) => option.correct)).toEqual([0, 1, 2, 3].map((index) => index === correct));
    expect(resolved.reveal?.results).toMatchObject({ player: { outcome: 'correct' }, opponent: { outcome: 'wrong' } });
    expect(resolved.player.stats.correct).toBe(1);
  });

  test("the opponent's choice and boosters stay hidden until the reveal; only its lock-in shows", () => {
    let state = activate(manualBattle(), 'opponent', 'mind-shield', 500);
    state = answer(state, 'opponent', false, 1_000);
    const before = view(state);
    expect(before.question?.opponentLocked).toBe(true);
    expect(before.question!.options.some((option) => option.selected)).toBe(false);
    expect(before.opponent.usedBoosterIds).toEqual([]);
    expect(before.opponent.armed.mindShield).toBe(false);
    expect(before.opponent.stats).toEqual({ correct: 0, wrong: 0, timeouts: 0, damageDealt: 0, attacksBlocked: 0 });

    state = play(state, { player: 'wrong' });
    const after = view(state);
    expect(after.opponent.usedBoosterIds).toEqual(['mind-shield']);
    expect(after.opponent.armed.mindShield).toBe(true);
    expect(after.opponent.stats.wrong).toBe(1);
    expect(after.reveal?.results.opponent).toMatchObject({ outcome: 'wrong', boosterId: 'mind-shield' });
  });

  test("the opponent's clash question, timer extension and boosters never reach the view", () => {
    const opponent = { ...OPPONENT, boosterIds: ['extra-time', 'mind-shield', 'double-damage'] as const };
    let state = timeoutUntil(manualBattle({ seed: 2, opponent }), isOpen('clash', 1, 0));
    const hidden = state.turn!.sides.opponent!.question;
    expect(state.turn!.sides.player).toBeUndefined();
    state = activate(state, 'opponent', 'extra-time', 1_000);
    const start = openedAt(state);

    const during = view(state, start + 11_000);
    expect(during.question).toBeNull();
    expect(during.opponentTurn).toEqual({ remainingMs: 1_000, timeMs: 12_000 });
    expect(during.opponent.usedBoosterIds).toEqual([]);
    expect(during.boosters.every((booster) => !booster.canActivate)).toBe(true);
    const json = JSON.stringify(during);
    expect(json).not.toContain(hidden.prompt);
    expect(json).not.toContain(hidden.id);

    // Extra Time keeps the turn open past the base timer without revealing why.
    state = ok(state, { type: 'tick', atMs: start + 13_000 });
    expect(state.phase).toBe('open');
    expect(view(state).opponentTurn).toEqual({ remainingMs: 0, timeMs: 12_000 });

    state = answer(state, 'opponent', true, 14_000);
    const after = view(state);
    expect(after.opponentTurn).toBeNull();
    expect(after.question).toBeNull();
    expect(after.reveal?.results.opponent).toMatchObject({ outcome: 'correct', boosterId: 'extra-time' });
    expect(after.opponent.usedBoosterIds).toEqual(['extra-time']);
  });
});

describe('battle view: timers and boosters', () => {
  test('own Extra Time extends the total and remaining time, not the base timer', () => {
    const state = activate(manualBattle(), 'player', 'extra-time', 2_000);
    expect(view(state, 2_000).question).toMatchObject({
      timeMs: 12_000,
      totalMs: 17_000,
      remainingMs: 15_000,
      boosterUsed: 'extra-time',
    });
    expect(view(state).boosters.find((booster) => booster.id === 'extra-time')).toMatchObject({ used: true, canActivate: false });
  });

  test('boosters are offered only while the user can still act on an open question', () => {
    const state = manualBattle();
    expect(activatable(state)).toEqual({ '50-50': true, 'extra-time': true, 'second-chance': false });
    expect(activatable(state, 12_000)).toEqual(NONE);

    const fifty = activate(state, 'player', '50-50', 500);
    expect(activatable(fifty)).toEqual(NONE);
    expect(view(fifty).question!.options.filter((option) => option.removed)).toHaveLength(2);

    const offered = answer(state, 'player', false, 1_000);
    expect(view(offered).question?.status).toBe('awaiting-retry');
    expect(activatable(offered)).toEqual({ '50-50': false, 'extra-time': false, 'second-chance': true });

    const retrying = activate(offered, 'player', 'second-chance', 1_000);
    expect(view(retrying).question).toMatchObject({ status: 'retrying', boosterUsed: 'second-chance' });
    expect(view(retrying).question!.options.filter((option) => option.eliminated)).toHaveLength(1);
    expect(activatable(retrying)).toEqual(NONE);

    expect(activatable(answer(state, 'player', true, 1_000))).toEqual(NONE);
    expect(activatable(play(state, {}))).toEqual(NONE);
  });

  test('a forfeited question is abandoned and the outcome is exposed', () => {
    const state = ok(manualBattle(), { type: 'forfeit', side: 'player', atMs: 3_000 });
    const finished = view(state);
    expect(finished.phase).toBe('finished');
    expect(finished.outcome).toEqual({ winner: 'opponent', reason: 'forfeit', atMs: 3_000 });
    expect(finished.question).toMatchObject({ status: 'abandoned', correctIndex: null, remainingMs: 0 });
    expect(finished.reveal).toBeNull();
    expect(activatable(state)).toEqual(NONE);
  });
});

describe('battle view: stages', () => {
  test('the round-bonus stage shows the tally and bonuses, with no question', () => {
    let state = manualBattle();
    for (let index = 0; index < 3; index++) state = advance(play(state, { player: 'correct', opponent: 'wrong' }));
    const bonus = view(state);
    expect(bonus.stage).toEqual({ kind: 'round-bonus', round: 1 });
    expect(bonus.question).toBeNull();
    expect(bonus.opponentTurn).toBeNull();
    expect(bonus.roundCorrect).toEqual({ player: 3, opponent: 0 });
    // 3 x 13 = 39 already dealt, so only 1 of the 10 bonus points fits under the round cap.
    expect(bonus.reveal?.bonuses).toEqual([
      expect.objectContaining({ side: 'player', roundWinner: true, perfect: true, amount: 10, capReduction: 9, damage: 1 }),
    ]);
    expect(activatable(state)).toEqual(NONE);
  });

  test('the view names the category, round and initiative holder, including in sudden death', () => {
    expect(view(manualBattle({ seed: 1 }))).toMatchObject({ round: 1, categoryId: 'science', initiative: 'player' });
    expect(view(manualBattle({ seed: 2 }))).toMatchObject({ round: 1, initiative: 'opponent' });
    const suddenDeath = timeoutUntil(manualBattle(), isOpen('sudden-death'));
    expect(view(suddenDeath)).toMatchObject({ round: 6, categoryId: 'geography', initiative: 'opponent' });
    expect(view(suddenDeath).question?.kind).toBe('sudden-death');
  });
});
