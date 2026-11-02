import { describe, expect, test } from '@jest/globals';

import {
  BATTLE_RULES,
  createBattle,
  initiativeFor,
  stageRound,
  step,
  type BattleRules,
  type BattleSetup,
} from '../../src/game/battle';
import {
  activate,
  advance,
  answer,
  correctOption,
  isOpen,
  last,
  makeSetup,
  manualBattle,
  NO_PASSIVES,
  ok,
  OPPONENT,
  play,
  PLAYER,
  rejected,
  sideTurn,
  timeoutUntil,
  withHp,
  wrongOption,
} from './helpers';

/** Plays the three standard questions of the open round with the same moves each time. */
function playRound(state: ReturnType<typeof manualBattle>, moves: Parameters<typeof play>[1], elapsed?: Parameters<typeof play>[2]) {
  let next = state;
  for (let index = 0; index < BATTLE_RULES.questionsPerRound; index++) {
    next = advance(play(next, moves, elapsed));
  }
  return next;
}

describe('battle setup', () => {
  test('both fighters start at 100 HP on the same first question with a 12 s timer', () => {
    const state = manualBattle();
    expect(state.fighters.player.hp).toBe(100);
    expect(state.fighters.opponent.hp).toBe(100);
    expect(state.stage).toEqual({ kind: 'standard', round: 1, index: 0 });
    expect(state.phase).toBe('open');
    expect(state.turn?.key).toBe('r1-q1');
    expect(sideTurn(state, 'player').question).toEqual(sideTurn(state, 'opponent').question);
    expect(sideTurn(state, 'player').deadlineMs).toBe(12_000);
    expect(sideTurn(state, 'opponent').deadlineMs).toBe(12_000);
  });

  test.each([
    [1, 'player'],
    [2, 'opponent'],
    [-3, 'player'],
    [0, 'opponent'],
  ])('seed %i gives round 1 initiative to %s', (seed, side) => {
    expect(manualBattle({ seed }).firstInitiative).toBe(side);
  });

  test('initiative alternates every round and keeps alternating through sudden death', () => {
    const state = manualBattle({ seed: 1 });
    expect([1, 2, 3, 4, 5, 6, 7].map((round) => initiativeFor(state, round))).toEqual([
      'player',
      'opponent',
      'player',
      'opponent',
      'player',
      'opponent',
      'player',
    ]);
    expect(stageRound(BATTLE_RULES, { kind: 'sudden-death', index: 0 })).toBe(6);
    expect(stageRound(BATTLE_RULES, { kind: 'clash', round: 3, turn: 1 })).toBe(3);
  });

  test.each<[string, Partial<BattleSetup>]>([
    ['four rounds', { rounds: ['science', 'sports', 'history', 'space'] }],
    ['a repeated round category', { rounds: ['science', 'science', 'history', 'space', 'music'] }],
    ['an unknown round category', { rounds: ['science', 'sports', 'history', 'space', 'cooking' as never] }],
    ['an unknown sudden-death category', { suddenDeathCategoryId: 'cooking' as never }],
    ['an unknown fighter', { player: { ...PLAYER, fighterId: 'ninja' as never } }],
    ['two boosters', { player: { ...PLAYER, boosterIds: ['50-50', 'extra-time'] as never } }],
    ['a repeated booster', { opponent: { ...OPPONENT, boosterIds: ['mind-shield', 'mind-shield', 'streak-saver'] } }],
    ['an unknown booster', { opponent: { ...OPPONENT, boosterIds: ['mind-shield', 'teleport' as never, 'streak-saver'] } }],
    ['a fractional seed', { seed: 1.5 }],
    ['a non-finite level', { opponent: { ...OPPONENT, level: Number.NaN } }],
  ])('rejects a setup with %s', (_label, overrides) => {
    expect(() => manualBattle(overrides)).toThrow();
  });

  test('rejects a non-finite start time', () => {
    expect(() => createBattle(makeSetup(), Number.NaN)).toThrow();
  });
});

describe('simultaneous questions', () => {
  test('a question resolves once, only when both players are final', () => {
    let state = answer(manualBattle(), 'player', true, 1_000);
    expect(state.phase).toBe('open');
    expect(state.log).toHaveLength(0);
    expect(sideTurn(state, 'opponent').status).toBe('answering');
    expect(state.fighters.opponent.hp).toBe(100);

    state = answer(state, 'opponent', false, 2_000);
    expect(state.phase).toBe('resolved');
    expect(state.log).toHaveLength(1);
    expect(state.log[0].results).toEqual({
      player: { outcome: 'correct', comboAfter: 1, comboSaved: false, boosterId: null },
      opponent: { outcome: 'wrong', comboAfter: 0, comboSaved: false, boosterId: null },
    });
    expect(state.log[0].hits).toEqual([
      expect.objectContaining({ attacker: 'player', base: 10, speedBonus: 3, damage: 13, targetHp: 87, void: false }),
    ]);
    expect(state.fighters.opponent.hp).toBe(87);
    expect(state.fighters.player.hp).toBe(100);
    expect(state.fighters.player.stats).toEqual({ correct: 1, wrong: 0, timeouts: 0, damageDealt: 13, attacksBlocked: 0 });
    expect(state.fighters.opponent.stats).toEqual({ correct: 0, wrong: 1, timeouts: 0, damageDealt: 0, attacksBlocked: 0 });

    const later = ok(state, { type: 'tick', atMs: 60_000 });
    expect(later.log).toHaveLength(1);
    expect(later.fighters.opponent.hp).toBe(87);
  });

  test('unanswered questions time out at the deadline and not before', () => {
    let state = ok(manualBattle(), { type: 'tick', atMs: 11_999 });
    expect(state.phase).toBe('open');
    state = ok(state, { type: 'tick', atMs: 12_000 });
    expect(state.phase).toBe('resolved');
    expect(state.log[0].results).toMatchObject({ player: { outcome: 'timeout' }, opponent: { outcome: 'timeout' } });
    expect(state.log[0].hits).toEqual([]);
    expect(state.fighters.player.stats.timeouts).toBe(1);
    expect(state.fighters.opponent.stats.timeouts).toBe(1);
  });

  test('an answer at 11.999 s counts; at exactly 12 s it is a timeout', () => {
    const state = answer(manualBattle(), 'opponent', false, 500);
    const inTime = ok(state, { type: 'answer', side: 'player', optionIndex: correctOption(state, 'player'), atMs: 11_999 });
    expect(inTime.log[0].results.player?.outcome).toBe('correct');
    expect(inTime.log[0].hits[0]).toMatchObject({ speedBonus: 0, damage: 10 });

    const late = step(state, { type: 'answer', side: 'player', optionIndex: correctOption(state, 'player'), atMs: 12_000 });
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.error.code).toBe('no-open-question');
    expect(late.state.log[0].results.player?.outcome).toBe('timeout');
    expect(late.state.fighters.opponent.hp).toBe(100);
  });

  test('the speed bonus is measured from when each question opens', () => {
    let state = advance(play(manualBattle(), {}), 15_000);
    expect(state.turn?.openedAtMs).toBe(15_000);
    state = play(state, { player: 'correct' }, { player: 2_500 });
    expect(last(state.log).hits[0]).toMatchObject({ speedBonus: 3, damage: 13 });
  });

  test('both correct answers land, faster first', () => {
    const state = play(manualBattle(), { player: 'correct', opponent: 'correct' }, { player: 4_000, opponent: 1_000 });
    expect(state.log[0].hits.map((hit) => [hit.attacker, hit.damage])).toEqual([
      ['opponent', 13],
      ['player', 12],
    ]);
    expect(state.fighters.player.hp).toBe(87);
    expect(state.fighters.opponent.hp).toBe(88);
  });

  test('a knockout by the faster answer voids the slower hit (no draws)', () => {
    const state = withHp(manualBattle(), { player: 10, opponent: 10 });
    const end = play(state, { player: 'correct', opponent: 'correct' }, { player: 2_000, opponent: 1_500 });
    expect(end.phase).toBe('finished');
    expect(end.outcome).toEqual({ winner: 'opponent', reason: 'knockout', atMs: 2_000 });
    expect(end.log[0].hits).toEqual([
      expect.objectContaining({ attacker: 'opponent', raw: 13, damage: 10, targetHp: 0, void: false }),
      expect.objectContaining({ attacker: 'player', damage: 0, targetHp: 10, void: true }),
    ]);
    expect(end.fighters.player.hp).toBe(0);
    expect(end.fighters.opponent.hp).toBe(10);
    expect(end.fighters.player.stats.damageDealt).toBe(0);
  });

  test.each([
    [1, 'player'],
    [2, 'opponent'],
  ] as const)('equal answer times go to the initiative holder (seed %i: %s)', (seed, first) => {
    const state = withHp(manualBattle({ seed }), { player: 5, opponent: 5 });
    const end = play(state, { player: 'correct', opponent: 'correct' }, { player: 2_000, opponent: 2_000 });
    expect(end.log[0].hits[0].attacker).toBe(first);
    expect(end.outcome).toMatchObject({ winner: first, reason: 'knockout' });
  });

  test('HP never goes below 0', () => {
    const end = play(withHp(manualBattle(), { opponent: 4 }), { player: 'correct' });
    expect(end.fighters.opponent.hp).toBe(0);
    expect(end.log[0].hits[0]).toMatchObject({ raw: 13, damage: 4 });
    expect(end.outcome).toMatchObject({ winner: 'player', reason: 'knockout' });
  });
});

describe('round cap and round bonuses', () => {
  test('a perfect, fastest round deals at most 40 including the round bonuses', () => {
    const state = playRound(manualBattle(), { player: 'correct', opponent: 'wrong' }, { player: 500 });
    expect(state.stage).toEqual({ kind: 'round-bonus', round: 1 });
    expect(state.phase).toBe('resolved');
    expect(last(state.log)).toMatchObject({ key: 'r1-bonus', hits: [] });
    expect(last(state.log).bonuses).toEqual([
      expect.objectContaining({ side: 'player', roundWinner: true, perfect: true, amount: 10, capReduction: 9, damage: 1, targetHp: 60 }),
    ]);
    expect(state.fighters.opponent.hp).toBe(60);
    expect(state.roundTally.player).toEqual({ correct: 3, damage: 40 });
    expect(state.fighters.player.stats.damageDealt).toBe(40);
  });

  test('Double Damage is still limited by the round cap', () => {
    let state = manualBattle({ player: { ...PLAYER, boosterIds: ['double-damage', 'extra-time', 'second-chance'] } });
    state = activate(state, 'player', 'double-damage', 100);
    state = playRound(state, { player: 'correct', opponent: 'wrong' }, { player: 500 });
    const hits = state.log.filter((entry) => entry.stage.kind === 'standard').map((entry) => entry.hits[0]);
    expect(hits.map((hit) => [hit.raw, hit.damage, hit.capReduction])).toEqual([
      [23, 23, 0],
      [13, 13, 0],
      [13, 4, 9],
    ]);
    expect(hits[0].doubled).toBe(true);
    expect(last(state.log).bonuses[0]).toMatchObject({ amount: 10, capReduction: 10, damage: 0 });
    expect(state.fighters.opponent.hp).toBe(60);
  });

  test('the cap resets every round and does not apply to the clash', () => {
    let state = playRound(manualBattle(), { player: 'correct', opponent: 'wrong' }, { player: 500 });
    state = advance(state);
    expect(state.stage).toEqual({ kind: 'clash', round: 1, turn: 0 });
    state = play(state, { player: 'correct' }, { player: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ damage: 12, capReduction: 0 });
    expect(state.fighters.opponent.hp).toBe(48);
    state = advance(play(advance(state), {}));
    expect(state.stage).toEqual({ kind: 'standard', round: 2, index: 0 });
    expect(state.roundTally.player).toEqual({ correct: 0, damage: 0 });
    state = play(state, { player: 'correct' }, { player: 500 });
    expect(last(state.log).hits[0].damage).toBe(13);
  });

  test('more correct answers win the round bonus (+5)', () => {
    let state = manualBattle();
    state = advance(play(state, { player: 'correct', opponent: 'correct' }, { player: 9_000, opponent: 9_000 }));
    state = advance(play(state, { player: 'correct', opponent: 'wrong' }, { player: 9_000 }));
    state = advance(play(state, { player: 'wrong', opponent: 'wrong' }));
    expect(state.roundTally.player.correct).toBe(2);
    expect(state.roundTally.opponent.correct).toBe(1);
    expect(last(state.log).bonuses).toEqual([
      expect.objectContaining({ side: 'player', roundWinner: true, perfect: false, amount: 5, damage: 5 }),
    ]);
    expect(state.fighters.opponent.hp).toBe(100 - 20 - 5);
  });

  test.each([
    [1, ['player', 'opponent']],
    [2, ['opponent', 'player']],
  ] as const)('both perfect: no round winner, +5 each, initiative holder first (seed %i)', (seed, order) => {
    const state = playRound(manualBattle({ seed }), { player: 'correct', opponent: 'correct' }, { player: 9_000, opponent: 9_000 });
    const bonuses = last(state.log).bonuses;
    expect(bonuses.map((bonus) => bonus.side)).toEqual(order);
    for (const bonus of bonuses) expect(bonus).toMatchObject({ roundWinner: false, perfect: true, amount: 5, damage: 5 });
    expect(state.fighters.player.hp).toBe(65);
    expect(state.fighters.opponent.hp).toBe(65);
  });

  test('a tied round gives no bonus', () => {
    const state = playRound(manualBattle(), { player: 'wrong', opponent: 'wrong' });
    expect(state.stage).toEqual({ kind: 'round-bonus', round: 1 });
    expect(last(state.log)).toMatchObject({ key: 'r1-bonus', bonuses: [], hits: [] });
    expect(state.phase).toBe('resolved');
  });

  test('a bonus knockout ends the match; the other bonus is void', () => {
    let state = manualBattle({ seed: 1 });
    state = advance(play(state, { player: 'correct', opponent: 'correct' }, { player: 9_000, opponent: 9_000 }));
    state = advance(play(state, { player: 'correct', opponent: 'correct' }, { player: 9_000, opponent: 9_000 }));
    state = play(state, { player: 'correct', opponent: 'correct' }, { player: 9_000, opponent: 9_000 });
    state = advance(withHp(state, { player: 5, opponent: 5 }));
    expect(state.outcome).toMatchObject({ winner: 'player', reason: 'knockout' });
    expect(last(state.log).bonuses).toEqual([
      expect.objectContaining({ side: 'player', damage: 5, targetHp: 0, void: false }),
      expect.objectContaining({ side: 'opponent', damage: 0, targetHp: 5, void: true }),
    ]);
    expect(state.fighters.player.hp).toBe(5);
  });

  test('round bonuses are not blocked by Mind Shield or doubled by Double Damage', () => {
    let state = manualBattle({ player: { ...PLAYER, boosterIds: ['double-damage', 'extra-time', 'second-chance'] } });
    state = advance(play(state, { player: 'correct', opponent: 'wrong' }, { player: 9_000 }));
    state = advance(play(state, { player: 'correct', opponent: 'wrong' }, { player: 9_000 }));
    state = activate(state, 'player', 'double-damage', 100);
    state = activate(state, 'opponent', 'mind-shield', 200);
    state = advance(play(state, { player: 'wrong', opponent: 'wrong' }));
    expect(last(state.log).bonuses).toEqual([expect.objectContaining({ side: 'player', amount: 5, damage: 5 })]);
    expect(state.fighters.opponent.hp).toBe(75);
    expect(state.fighters.opponent.armed.mindShield).toBe(true);
    expect(state.fighters.player.armed.doubleDamage).toBe(true);

    state = play(advance(state), { player: 'correct' }, { player: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ base: 20, doubled: true, raw: 22, blocked: true, damage: 0 });
    expect(state.fighters.opponent).toMatchObject({ hp: 75, armed: { mindShield: false } });
    expect(state.fighters.player.armed.doubleDamage).toBe(false);
    expect(state.fighters.opponent.stats.attacksBlocked).toBe(1);
  });
});

describe('clash', () => {
  const toClash = (seed = 1, rules?: BattleRules) => timeoutUntil(manualBattle({ seed }, rules), isOpen('clash'));

  test('the initiative holder answers first, then the other player, on different questions', () => {
    let state = toClash(1);
    expect(state.stage).toEqual({ kind: 'clash', round: 1, turn: 0 });
    expect(Object.keys(state.turn?.sides ?? {})).toEqual(['player']);
    expect(state.turn?.key).toBe('r1-clash-player');
    expect(state.turn?.kind).toBe('clash');
    const playerQuestion = sideTurn(state, 'player').question;

    state = advance(play(state, {}));
    expect(state.stage).toEqual({ kind: 'clash', round: 1, turn: 1 });
    expect(Object.keys(state.turn?.sides ?? {})).toEqual(['opponent']);
    expect(state.turn?.key).toBe('r1-clash-opponent');
    const opponentQuestion = sideTurn(state, 'opponent').question;
    expect(opponentQuestion.id).not.toBe(playerQuestion.id);
    expect(opponentQuestion.difficulty).toBe(playerQuestion.difficulty);
    expect([playerQuestion.categoryId, opponentQuestion.categoryId]).toEqual(['science', 'science']);

    state = timeoutUntil(state, isOpen('clash', 2));
    expect(state.stage).toEqual({ kind: 'clash', round: 2, turn: 0 });
    expect(Object.keys(state.turn?.sides ?? {})).toEqual(['opponent']);
  });

  test('seed parity flips who starts the first clash', () => {
    expect(Object.keys(toClash(2).turn?.sides ?? {})).toEqual(['opponent']);
  });

  test('the other player cannot answer, use boosters or decline during a clash turn', () => {
    const state = toClash(1);
    const atMs = state.nowMs + 100;
    expect(rejected(state, { type: 'answer', side: 'opponent', optionIndex: 0, atMs })).toBe('not-participating');
    expect(rejected(state, { type: 'activateBooster', side: 'opponent', boosterId: 'mind-shield', atMs })).toBe(
      'not-participating',
    );
    expect(rejected(state, { type: 'declineRetry', side: 'opponent', atMs })).toBe('not-participating');
  });

  test.each([
    [1_000, 2],
    [3_999, 2],
    [4_000, 1],
    [7_999, 1],
    [8_000, 0],
    [11_999, 0],
  ])('a clash answer after %i ms hits for 10 + %i', (elapsed, bonus) => {
    const state = play(toClash(1), { player: 'correct' }, { player: elapsed });
    expect(last(state.log).hits).toEqual([
      expect.objectContaining({ attacker: 'player', base: 10, speedBonus: bonus, damage: 10 + bonus }),
    ]);
  });

  test('a wrong clash answer or timeout deals no damage', () => {
    const wrong = play(toClash(1), { player: 'wrong' });
    expect(last(wrong.log)).toMatchObject({ results: { player: { outcome: 'wrong' } }, hits: [] });
    const timeout = play(toClash(1), {});
    expect(last(timeout.log)).toMatchObject({ results: { player: { outcome: 'timeout' } }, hits: [] });
  });

  test('a first-turn knockout ends the match before the second turn', () => {
    const end = play(withHp(toClash(1), { opponent: 12 }), { player: 'correct' }, { player: 1_000 });
    expect(end.outcome).toMatchObject({ winner: 'player', reason: 'knockout' });
    expect(end.stage).toEqual({ kind: 'clash', round: 1, turn: 0 });
    expect(rejected(end, { type: 'advance', atMs: end.nowMs })).toBe('match-finished');
  });

  test('a second-turn knockout ends the match', () => {
    let state = advance(play(toClash(1), {}));
    state = play(withHp(state, { player: 3 }), { opponent: 'correct' }, { opponent: 6_000 });
    expect(state.outcome).toMatchObject({ winner: 'opponent', reason: 'knockout' });
    expect(state.fighters.player.hp).toBe(0);
  });
});

describe('match end', () => {
  const lastClashTurn = isOpen('clash', 5, 1);

  test('after round 5 the higher HP wins', () => {
    let state = timeoutUntil(manualBattle({ seed: 1 }), lastClashTurn);
    expect(Object.keys(state.turn?.sides ?? {})).toEqual(['opponent']);
    state = play(state, { opponent: 'correct' }, { opponent: 1_000 });
    expect(state.phase).toBe('finished');
    expect(state.outcome).toEqual({ winner: 'opponent', reason: 'hp-lead', atMs: state.nowMs });
    expect(state.fighters.player.hp).toBe(88);
  });

  test('a lead earlier in the match also wins after round 5', () => {
    let state = play(manualBattle({ seed: 2 }), { player: 'correct' });
    state = timeoutUntil(advance(state), lastClashTurn);
    state = play(state, {});
    expect(state.outcome).toMatchObject({ winner: 'player', reason: 'hp-lead' });
  });

  test('equal HP after round 5 starts sudden death, decided by the first question that separates HP', () => {
    let state = play(timeoutUntil(manualBattle({ seed: 1 }), lastClashTurn), {});
    expect(state.phase).toBe('resolved');
    expect(state.outcome).toBeNull();

    state = advance(state);
    expect(state.stage).toEqual({ kind: 'sudden-death', index: 0 });
    expect(state.turn?.key).toBe('sd1');
    expect(sideTurn(state, 'player').question).toEqual(sideTurn(state, 'opponent').question);
    expect(sideTurn(state, 'player').question.categoryId).toBe('geography');

    state = advance(play(state, { player: 'wrong', opponent: 'wrong' }));
    expect(state.stage).toEqual({ kind: 'sudden-death', index: 1 });
    expect(state.turn?.key).toBe('sd2');

    state = play(state, { player: 'correct', opponent: 'correct' }, { player: 1_000, opponent: 1_000 });
    expect(state.phase).toBe('resolved');
    expect([state.fighters.player.hp, state.fighters.opponent.hp]).toEqual([87, 87]);

    state = play(advance(state), { player: 'correct', opponent: 'correct' }, { player: 1_000, opponent: 4_000 });
    expect(state.outcome).toMatchObject({ winner: 'player', reason: 'sudden-death' });
    expect([state.fighters.player.hp, state.fighters.opponent.hp]).toEqual([75, 74]);
    // Sudden death is uncapped and never counts toward a round.
    expect(state.roundTally.player.damage).toBe(0);
  });

  test('sudden-death ties go to the alternating initiative holder', () => {
    // Seed 1: the user holds odd rounds, so sudden-death question 1 (round 6) belongs to the opponent.
    let state = advance(play(timeoutUntil(manualBattle({ seed: 1 }), lastClashTurn), {}));
    state = play(withHp(state, { player: 5, opponent: 5 }), { player: 'correct', opponent: 'correct' }, { player: 900, opponent: 900 });
    expect(state.log[state.log.length - 1].hits[0].attacker).toBe('opponent');
    expect(state.outcome).toMatchObject({ winner: 'opponent', reason: 'knockout' });
  });

  test('forfeit ends the match for the other side and blocks further actions', () => {
    const state = ok(manualBattle(), { type: 'forfeit', side: 'player', atMs: 3_000 });
    expect(state.outcome).toEqual({ winner: 'opponent', reason: 'forfeit', atMs: 3_000 });
    expect(state.phase).toBe('finished');
    expect(rejected(state, { type: 'answer', side: 'player', optionIndex: 0, atMs: 3_100 })).toBe('match-finished');
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: '50-50', atMs: 3_100 })).toBe('match-finished');
    expect(rejected(state, { type: 'advance', atMs: 3_100 })).toBe('match-finished');
    expect(rejected(state, { type: 'forfeit', side: 'opponent', atMs: 3_100 })).toBe('match-finished');
    expect(ok(state, { type: 'tick', atMs: 60_000 }).log).toHaveLength(0);
  });
});

describe('boosters', () => {
  test('50:50 removes two incorrect options for the activating player only', () => {
    const state = activate(manualBattle(), 'player', '50-50', 500);
    const turn = sideTurn(state, 'player');
    expect(turn.removed).toHaveLength(2);
    expect(new Set(turn.removed).size).toBe(2);
    expect(turn.removed).not.toContain(turn.question.correctIndex);
    expect(sideTurn(state, 'opponent').removed).toEqual([]);
    expect(rejected(state, { type: 'answer', side: 'player', optionIndex: turn.removed[0], atMs: 600 })).toBe(
      'option-unavailable',
    );
    expect(state.fighters.player.boostersUsed).toEqual([{ boosterId: '50-50', questionKey: 'r1-q1', atMs: 500 }]);
    expect(sideTurn(activate(manualBattle(), 'player', '50-50', 900), 'player').removed).toEqual(turn.removed);
  });

  test('Extra Time adds 5 s to the user’s own deadline only, without extending the speed window', () => {
    let state = activate(manualBattle(), 'player', 'extra-time', 1_000);
    expect(sideTurn(state, 'player').deadlineMs).toBe(17_000);
    expect(sideTurn(state, 'opponent').deadlineMs).toBe(12_000);
    expect(state.turn?.timeMs).toBe(12_000);

    state = ok(state, { type: 'tick', atMs: 12_000 });
    expect(sideTurn(state, 'opponent')).toMatchObject({ status: 'final', outcome: 'timeout' });
    expect(sideTurn(state, 'player').status).toBe('answering');
    expect(state.phase).toBe('open');

    state = answer(state, 'player', true, 16_999);
    expect(last(state.log).hits[0]).toMatchObject({ speedBonus: 0, damage: 10 });
  });

  test('the Extra Time deadline is exclusive too', () => {
    const state = ok(activate(manualBattle(), 'player', 'extra-time'), { type: 'tick', atMs: 17_000 });
    expect(last(state.log).results.player?.outcome).toBe('timeout');
  });

  test("a player cannot answer at their deadline while the opponent's Extra Time keeps the question open", () => {
    let state = manualBattle({ opponent: { ...OPPONENT, boosterIds: ['extra-time', 'mind-shield', 'streak-saver'] } });
    state = activate(state, 'opponent', 'extra-time', 100);
    const code = rejected(state, { type: 'answer', side: 'player', optionIndex: correctOption(state, 'player'), atMs: 12_000 });
    expect(code).toBe('already-answered');
  });

  test('Double Damage arms until the next correct answer, then is spent', () => {
    let state = activate(manualBattle(), 'opponent', 'double-damage', 200);
    state = advance(play(state, { opponent: 'wrong' }));
    expect(state.fighters.opponent.armed.doubleDamage).toBe(true);
    state = advance(play(state, { opponent: 'correct' }, { opponent: 1_000 }));
    expect(state.log[1].hits[0]).toMatchObject({ attacker: 'opponent', base: 20, doubled: true, damage: 23 });
    expect(state.fighters.opponent.armed.doubleDamage).toBe(false);
    state = play(state, { opponent: 'correct' }, { opponent: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ base: 10, doubled: false, damage: 13 });
  });

  test('Mind Shield blocks the next incoming attack entirely, once', () => {
    let state = activate(manualBattle(), 'opponent', 'mind-shield', 200);
    state = advance(play(state, { player: 'correct' }, { player: 1_000 }));
    expect(state.log[0].hits[0]).toMatchObject({ raw: 13, blocked: true, damage: 0 });
    expect(state.fighters.opponent).toMatchObject({ hp: 100, armed: { mindShield: false } });
    expect(state.fighters.opponent.stats.attacksBlocked).toBe(1);
    state = play(state, { player: 'correct' }, { player: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ blocked: false, damage: 13 });
  });

  test('Mind Shield is spent on a hit the round cap has already reduced to 0', () => {
    const rules = { ...NO_PASSIVES, standardRoundCap: 20 };
    let state = manualBattle({}, rules);
    state = advance(play(state, { player: 'correct' }, { player: 1_000 }));
    state = advance(play(state, { player: 'correct' }, { player: 1_000 }));
    expect(state.roundTally.player.damage).toBe(20);
    state = play(activate(state, 'opponent', 'mind-shield', 100), { player: 'correct' }, { player: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ blocked: true, damage: 0 });
    expect(state.fighters.opponent.armed.mindShield).toBe(false);
  });

  test('Streak Saver keeps the combo on the next miss only', () => {
    let state = advance(play(manualBattle(), { opponent: 'correct' }));
    state = advance(play(state, { opponent: 'correct' }));
    state = activate(state, 'opponent', 'streak-saver', 100);
    expect(state.fighters.opponent.armed.streakSaver).toBe(true);
    state = play(state, { opponent: 'wrong' });
    expect(last(state.log).results.opponent).toEqual({
      outcome: 'wrong',
      comboAfter: 2,
      comboSaved: true,
      boosterId: 'streak-saver',
    });
    expect(state.fighters.opponent).toMatchObject({ combo: 2, bestCombo: 2, armed: { streakSaver: false } });
    // Next miss (the opponent's clash turn times out) resets it.
    state = timeoutUntil(advance(state), isOpen('clash', 1, 1));
    state = play(state, {});
    expect(state.fighters.opponent).toMatchObject({ combo: 0, bestCombo: 2 });
  });

  test('each booster is used once per match and at most one per question', () => {
    let state = activate(manualBattle(), 'player', '50-50', 100);
    const atMs = state.nowMs + 100;
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: 'extra-time', atMs })).toBe('booster-limit');
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: '50-50', atMs })).toBe('booster-used');
    state = advance(play(state, {}));
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: '50-50', atMs: state.nowMs })).toBe(
      'booster-used',
    );
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: 'double-damage', atMs: state.nowMs })).toBe(
      'booster-not-equipped',
    );
    expect(activate(state, 'player', 'extra-time').fighters.player.boostersUsed.map((use) => use.boosterId)).toEqual([
      '50-50',
      'extra-time',
    ]);
  });

  test('boosters are only usable on an open question, before answering', () => {
    let state = answer(manualBattle(), 'player', true, 1_000);
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: 'extra-time', atMs: 1_100 })).toBe(
      'booster-window',
    );
    state = play(state, {});
    expect(state.phase).toBe('resolved');
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: 'extra-time', atMs: state.nowMs })).toBe(
      'no-open-question',
    );
  });

  test('a clash turn counts as a question for boosters', () => {
    let state = timeoutUntil(manualBattle(), isOpen('clash', 1, 0));
    state = activate(state, 'player', '50-50', 100);
    expect(sideTurn(state, 'player').removed).toHaveLength(2);
    expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: 'extra-time', atMs: state.nowMs })).toBe(
      'booster-limit',
    );
  });

  describe('Second Chance', () => {
    test('a wrong answer offers a retry; the eliminated option is blocked and the retry is final', () => {
      let state = manualBattle();
      const wrong = wrongOption(state, 'player');
      state = ok(state, { type: 'answer', side: 'player', optionIndex: wrong, atMs: 1_000 });
      expect(sideTurn(state, 'player').status).toBe('awaiting-retry');
      expect(rejected(state, { type: 'answer', side: 'player', optionIndex: correctOption(state, 'player'), atMs: 1_100 })).toBe(
        'already-answered',
      );
      state = answer(state, 'opponent', false, 1_200);
      expect(state.phase).toBe('open');

      state = ok(state, { type: 'activateBooster', side: 'player', boosterId: 'second-chance', atMs: 1_500 });
      expect(sideTurn(state, 'player')).toMatchObject({ status: 'retrying', eliminated: wrong, booster: 'second-chance' });
      expect(rejected(state, { type: 'answer', side: 'player', optionIndex: wrong, atMs: 1_600 })).toBe('option-unavailable');

      state = answer(state, 'player', true, 4_000);
      expect(last(state.log).results.player).toEqual({
        outcome: 'correct',
        comboAfter: 1,
        comboSaved: false,
        boosterId: 'second-chance',
      });
      // Timed by the retry answer.
      expect(last(state.log).hits[0]).toMatchObject({ speedBonus: 2, damage: 12 });
      expect(state.fighters.player.stats).toMatchObject({ correct: 1, wrong: 0 });
    });

    test('a wrong retry is final', () => {
      let state = answer(manualBattle(), 'player', false, 1_000);
      state = activate(state, 'player', 'second-chance', 1_100);
      state = answer(state, 'player', false, 2_000);
      expect(sideTurn(state, 'player')).toMatchObject({ status: 'final', outcome: 'wrong' });
      expect(sideTurn(state, 'player').attempts).toHaveLength(2);
    });

    test('declining keeps the answer wrong and does not spend Second Chance', () => {
      let state = answer(manualBattle(), 'player', false, 1_000);
      state = ok(state, { type: 'declineRetry', side: 'player', atMs: 1_500 });
      expect(sideTurn(state, 'player')).toMatchObject({ status: 'final', outcome: 'wrong', finalAtMs: 1_500 });
      expect(state.fighters.player.boostersUsed).toEqual([]);
      state = advance(play(state, {}));
      state = answer(state, 'player', false, 1_000);
      expect(sideTurn(state, 'player').status).toBe('awaiting-retry');
    });

    test.each(['awaiting-retry', 'retrying'] as const)('time running out while %s keeps the answer wrong', (status) => {
      let state = answer(manualBattle(), 'player', false, 1_000);
      if (status === 'retrying') state = activate(state, 'player', 'second-chance', 1_100);
      expect(sideTurn(state, 'player').status).toBe(status);
      state = ok(state, { type: 'tick', atMs: 12_000 });
      expect(last(state.log).results.player?.outcome).toBe('wrong');
      expect(state.fighters.player.stats).toMatchObject({ wrong: 1, timeouts: 0 });
    });

    test.each(['50-50', 'extra-time'] as const)('is not offered after %s was used on the same question', (boosterId) => {
      let state = activate(manualBattle(), 'player', boosterId, 100);
      state = answer(state, 'player', false, 1_000);
      expect(sideTurn(state, 'player')).toMatchObject({ status: 'final', outcome: 'wrong' });
    });

    test('is offered once per match', () => {
      let state = answer(manualBattle(), 'player', false, 1_000);
      state = advance(play(activate(state, 'player', 'second-chance', 1_100), {}));
      state = answer(state, 'player', false, 1_000);
      expect(sideTurn(state, 'player')).toMatchObject({ status: 'final', outcome: 'wrong' });
    });

    test('cannot be activated before a wrong answer, and only an offer can be declined', () => {
      const state = manualBattle();
      expect(rejected(state, { type: 'activateBooster', side: 'player', boosterId: 'second-chance', atMs: 100 })).toBe(
        'booster-window',
      );
      expect(rejected(state, { type: 'declineRetry', side: 'player', atMs: 100 })).toBe('no-retry');
    });
  });
});

describe('fighter passives (enabled)', () => {
  const rules = BATTLE_RULES;

  test('Arcane: +3 on the first correct answer only', () => {
    let state = play(manualBattle({ player: { ...PLAYER, fighterId: 'arcane' } }, rules), { player: 'correct' }, { player: 10_000 });
    expect(last(state.log).hits[0]).toMatchObject({ passiveBonus: 3, damage: 13 });
    state = play(advance(state), { player: 'correct' }, { player: 10_000 });
    expect(last(state.log).hits[0]).toMatchObject({ passiveBonus: 0, damage: 10 });
  });

  test('Shadow: +3 on the first correct answer in the first half of the base timer', () => {
    let state = manualBattle({ player: { ...PLAYER, fighterId: 'shadow' } }, rules);
    state = advance(play(state, { player: 'correct' }, { player: 7_000 }));
    expect(state.log[0].hits[0]).toMatchObject({ passiveBonus: 0, damage: 11 });
    state = advance(play(state, { player: 'correct' }, { player: 5_999 }));
    expect(state.log[1].hits[0]).toMatchObject({ passiveBonus: 3, damage: 15 });
    state = play(state, { player: 'correct' }, { player: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ passiveBonus: 0, damage: 13 });
  });

  test('Sylva: +3 on the first correct clash answer', () => {
    let state = play(manualBattle({ player: { ...PLAYER, fighterId: 'sylva' } }, rules), { player: 'correct' });
    expect(last(state.log).hits[0].passiveBonus).toBe(0);
    state = timeoutUntil(state, isOpen('clash', 1, 0));
    state = play(state, { player: 'correct' }, { player: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ passiveBonus: 3, damage: 15 });
  });

  test('Titan: the first unblocked incoming hit deals 3 less', () => {
    let state = manualBattle(
      {
        player: { ...PLAYER, fighterId: 'titan', boosterIds: ['mind-shield', 'extra-time', 'second-chance'] },
        opponent: { ...OPPONENT, fighterId: 'sylva' },
      },
      rules,
    );
    state = advance(play(activate(state, 'player', 'mind-shield'), { opponent: 'correct' }));
    expect(state.log[0].hits[0]).toMatchObject({ blocked: true, bulwarkReduction: 0 });
    expect(state.fighters.player.passiveUsed).toBe(false);
    state = advance(play(state, { opponent: 'correct' }));
    expect(state.log[1].hits[0]).toMatchObject({ raw: 13, bulwarkReduction: 3, damage: 10 });
    state = play(state, { opponent: 'correct' });
    expect(last(state.log).hits[0]).toMatchObject({ bulwarkReduction: 0, damage: 13 });
  });

  test('an offensive passive is spent even when Mind Shield blocks the hit', () => {
    let state = manualBattle({}, rules);
    state = advance(play(activate(state, 'opponent', 'mind-shield'), { player: 'correct' }));
    expect(state.log[0].hits[0]).toMatchObject({ passiveBonus: 3, blocked: true });
    state = play(state, { player: 'correct' }, { player: 1_000 });
    expect(last(state.log).hits[0]).toMatchObject({ passiveBonus: 0, damage: 13 });
  });
});

describe('combo tracking', () => {
  test('counts correct final answers across standard and clash questions and resets on a miss', () => {
    let state = advance(play(manualBattle(), { player: 'correct' }));
    state = advance(play(state, { player: 'correct' }));
    state = advance(play(state, { player: 'correct' }));
    state = advance(state);
    state = play(state, { player: 'correct' });
    expect(state.fighters.player).toMatchObject({ combo: 4, bestCombo: 4 });
    state = play(timeoutUntil(advance(state), isOpen('standard', 2)), { player: 'wrong' });
    expect(state.fighters.player).toMatchObject({ combo: 0, bestCombo: 4 });
  });

  test('combo never changes damage', () => {
    let state = advance(play(manualBattle(), { player: 'correct' }, { player: 9_500 }));
    state = advance(play(state, { player: 'correct' }, { player: 9_500 }));
    expect(state.log.map((entry) => entry.hits[0].damage)).toEqual([10, 10]);
  });
});

describe('validation', () => {
  test('time cannot move backwards or be non-finite', () => {
    const state = ok(manualBattle(), { type: 'tick', atMs: 5_000 });
    expect(rejected(state, { type: 'tick', atMs: 4_999 })).toBe('invalid-time');
    expect(rejected(state, { type: 'answer', side: 'player', optionIndex: 0, atMs: Number.NaN })).toBe('invalid-time');
    expect(rejected(state, { type: 'tick', atMs: Number.POSITIVE_INFINITY })).toBe('invalid-time');
  });

  test.each([-1, 4, 1.5])('rejects option %p', (optionIndex) => {
    expect(rejected(manualBattle(), { type: 'answer', side: 'player', optionIndex, atMs: 100 })).toBe('invalid-option');
  });

  test('an answer cannot be changed', () => {
    const state = answer(manualBattle(), 'player', true, 1_000);
    expect(rejected(state, { type: 'answer', side: 'player', optionIndex: wrongOption(state, 'player'), atMs: 1_100 })).toBe(
      'already-answered',
    );
  });

  test('advance is only valid after a resolution', () => {
    expect(rejected(manualBattle(), { type: 'advance', atMs: 100 })).toBe('not-resolved');
  });

  test('deadlines that passed are applied before the action itself', () => {
    const result = step(manualBattle(), { type: 'advance', atMs: 12_500 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.stage).toEqual({ kind: 'standard', round: 1, index: 1 });
    const answerLate = step(manualBattle(), { type: 'answer', side: 'player', optionIndex: 0, atMs: 12_500 });
    expect(answerLate.ok).toBe(false);
    expect(answerLate.state.phase).toBe('resolved');
    expect(answerLate.state.nowMs).toBe(12_500);
  });

  test('the engine-controlled opponent cannot be driven by actions', () => {
    const state = createBattle(makeSetup(), 0, { rules: NO_PASSIVES });
    expect(rejected(state, { type: 'answer', side: 'opponent', optionIndex: 0, atMs: 100 })).toBe('opponent-is-ai');
    expect(rejected(state, { type: 'activateBooster', side: 'opponent', boosterId: 'mind-shield', atMs: 100 })).toBe(
      'opponent-is-ai',
    );
    expect(rejected(state, { type: 'forfeit', side: 'opponent', atMs: 100 })).toBe('opponent-is-ai');
  });
});
