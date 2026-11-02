import { describe, expect, test } from '@jest/globals';

import { QUESTIONS } from '../../src/data/questions';
import {
  BATTLE_RULES,
  createBattle,
  fiftyFiftyRemoval,
  knowProbability,
  planOpponentTurn,
  prepareQuestion,
  step,
  type AiStep,
  type BattleState,
  type OpponentPlanInput,
} from '../../src/game/battle';
import type { BoosterId } from '../../src/game/types/booster';
import type { Difficulty } from '../../src/game/types/question';
import { makeSetup, ok } from './helpers';

const ALL: BoosterId[] = ['50-50', 'extra-time', 'second-chance', 'double-damage', 'mind-shield', 'streak-saver'];
const OPENED = 1_000;
const TIME = BATTLE_RULES.questionTimeMs;

const questionOf = (difficulty: Difficulty) =>
  prepareQuestion(QUESTIONS.find((question) => question.difficulty === difficulty)!, 7);

function input(overrides: Partial<OpponentPlanInput> = {}): OpponentPlanInput {
  return {
    rules: BATTLE_RULES,
    seed: 1,
    questionKey: 'r1-q1',
    round: 1,
    openedAtMs: OPENED,
    timeMs: TIME,
    question: questionOf('medium'),
    level: 3,
    hp: 100,
    combo: 0,
    available: [],
    ...overrides,
  };
}

/** Plans for many seeds; everything else comes from `overrides`. */
function plans(overrides: Partial<OpponentPlanInput> = {}, count = 600) {
  return Array.from({ length: count }, (_, n) => {
    const planInput = input({ ...overrides, seed: n + 1 });
    const steps = planOpponentTurn(planInput);
    const answers = steps.filter((s): s is Extract<AiStep, { type: 'answer' }> => s.type === 'answer');
    const boosters = steps.filter((s): s is Extract<AiStep, { type: 'booster' }> => s.type === 'booster');
    const first = answers[0];
    return {
      input: planInput,
      steps,
      answers,
      boosters: boosters.map((s) => s.boosterId),
      first,
      offset: first ? first.atMs - OPENED : null,
      firstCorrect: first ? first.optionIndex === planInput.question.correctIndex : false,
    };
  });
}

const fraction = <T>(items: T[], predicate: (item: T) => boolean) => items.filter(predicate).length / items.length;

describe('opponent accuracy', () => {
  test.each([
    ['easy', 0.85],
    ['medium', 0.65],
    ['hard', 0.45],
  ] as const)('a level 3 opponent knows %s questions with p = %p, +/- 0.05 per level', (difficulty, base) => {
    expect(knowProbability(difficulty, 3)).toBeCloseTo(base);
    expect(knowProbability(difficulty, 4)).toBeCloseTo(base + 0.05);
    expect(knowProbability(difficulty, 1)).toBeCloseTo(base - 0.1);
  });

  test('probabilities are clamped to 0.05..0.95', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      expect(knowProbability(difficulty, 100)).toBe(0.95);
      expect(knowProbability(difficulty, -100)).toBe(0.05);
    }
  });

  test.each(['easy', 'medium', 'hard'] as const)(
    'the share of correct %s answers matches knowing plus a 1-in-4 guess',
    (difficulty) => {
      const sample = plans({ question: questionOf(difficulty) }, 2000);
      const know = knowProbability(difficulty, 3);
      const answered = sample.filter((plan) => plan.first);
      // Guesses come from 5-15 s; those past 12 s time out instead.
      const expected = know + (1 - know) * 0.7 * 0.25;
      expect(fraction(sample, (plan) => plan.firstCorrect)).toBeCloseTo(expected, 1);
      expect(answered.length).toBeLessThan(sample.length);
    },
  );
});

describe('opponent timing', () => {
  test('answers fall inside the timer: 2-7 s when it knows, 5-15 s when guessing; later guesses time out', () => {
    const sample = plans();
    for (const plan of sample) {
      if (!plan.first) continue;
      expect(plan.offset).toBeGreaterThanOrEqual(2000);
      expect(plan.offset).toBeLessThan(TIME);
      if (plan.offset! < 5000) expect(plan.firstCorrect).toBe(true);
      if (!plan.firstCorrect) expect(plan.offset).toBeGreaterThanOrEqual(5000);
    }
    expect(sample.some((plan) => !plan.first)).toBe(true);
    expect(sample.some((plan) => plan.offset !== null && plan.offset > 7000)).toBe(true);
  });

  test('higher levels answer faster, but never under 0.5 s', () => {
    const fast = plans({ level: 100 });
    const known = fast.filter((plan) => plan.first && plan.offset! < 5000);
    expect(known.length).toBeGreaterThan(fast.length * 0.9);
    expect(known.every((plan) => plan.offset === 500)).toBe(true);

    const slow = plans({ level: 1 });
    const slowKnown = slow.filter((plan) => plan.firstCorrect && plan.offset! < 5000);
    expect(Math.min(...slowKnown.map((plan) => plan.offset!))).toBeGreaterThanOrEqual(2500);
  });

  test('plans are deterministic per seed and question, and vary between them', () => {
    expect(planOpponentTurn(input({ seed: 42 }))).toEqual(planOpponentTurn(input({ seed: 42 })));
    const offsets = new Set(plans({}, 50).map((plan) => plan.offset));
    expect(offsets.size).toBeGreaterThan(10);
    const byKey = ['r1-q1', 'r1-q2', 'r2-q1', 'sd1'].map((questionKey) => planOpponentTurn(input({ questionKey })));
    expect(new Set(byKey.map((steps) => JSON.stringify(steps))).size).toBeGreaterThan(1);
  });

  test('plans are relative to when the question opened', () => {
    const later = planOpponentTurn(input({ openedAtMs: OPENED + 60_000, available: ALL, round: 4 }));
    const now = planOpponentTurn(input({ available: ALL, round: 4 }));
    expect(later).toEqual(now.map((s) => ({ ...s, atMs: s.atMs + 60_000 })));
  });
});

describe('opponent boosters', () => {
  test('no boosters are planned when none are available', () => {
    expect(plans({ round: 5, hp: 10, combo: 5 }).every((plan) => plan.boosters.length === 0)).toBe(true);
  });

  test('at most one booster per question, always before the answer', () => {
    for (const overrides of [{ round: 1 }, { round: 2, combo: 3 }, { round: 4 }, { hp: 50 }]) {
      for (const plan of plans({ ...overrides, available: ALL, question: questionOf('hard') })) {
        const regular = plan.boosters.filter((id) => id !== 'second-chance');
        expect(regular.length).toBeLessThanOrEqual(1);
        if (regular.length === 1) expect(plan.boosters).toEqual(regular);
        const booster = plan.steps.find((s) => s.type === 'booster' && s.boosterId !== 'second-chance');
        if (booster && plan.first) expect(booster.atMs).toBeLessThan(plan.first.atMs);
      }
    }
  });

  test('Mind Shield first when health is 60 or less, or from round 4', () => {
    const shielded = (overrides: Partial<OpponentPlanInput>) =>
      plans({ available: ALL, ...overrides }).map((plan) => plan.boosters[0] === 'mind-shield');
    expect(shielded({ hp: 60 }).every(Boolean)).toBe(true);
    expect(shielded({ round: 4 }).every(Boolean)).toBe(true);
    expect(shielded({ hp: 61, round: 3 }).some(Boolean)).toBe(false);
  });

  test('Double Damage only from round 2, and only on a question it knows', () => {
    expect(plans({ available: ['double-damage'] }).some((plan) => plan.boosters.length > 0)).toBe(false);
    const sample = plans({ available: ['double-damage'], round: 2 });
    for (const plan of sample) {
      if (plan.boosters.includes('double-damage')) expect(plan.firstCorrect && plan.offset! <= 7000).toBe(true);
      if (plan.firstCorrect && plan.offset! < 5000) expect(plan.boosters).toEqual(['double-damage']);
      if (!plan.firstCorrect) expect(plan.boosters).toEqual([]);
    }
  });

  test('Extra Time only when its answer would otherwise come too late; it then answers before the new deadline', () => {
    const sample = plans({ available: ['extra-time'] });
    for (const plan of sample) {
      expect(plan.first).toBeDefined();
      const late = plan.offset! >= TIME;
      expect(plan.boosters).toEqual(late ? ['extra-time'] : []);
      expect(plan.offset).toBeLessThan(TIME + BATTLE_RULES.extraTimeMs);
    }
    expect(sample.some((plan) => plan.boosters.length > 0)).toBe(true);
  });

  test('50:50 only on hard questions it does not know; the guess avoids the removed options', () => {
    expect(plans({ available: ['50-50'], question: questionOf('medium') }).some((plan) => plan.boosters.length > 0)).toBe(
      false,
    );
    const sample = plans({ available: ['50-50'], question: questionOf('hard') });
    for (const plan of sample) {
      if (plan.boosters.length === 0) {
        expect(plan.firstCorrect).toBe(true);
        continue;
      }
      expect(plan.boosters).toEqual(['50-50']);
      const removed = fiftyFiftyRemoval(plan.input.seed, plan.input.questionKey, 'opponent', plan.input.question, 2);
      if (plan.first) expect(removed).not.toContain(plan.first.optionIndex);
    }
    const guesses = sample.filter((plan) => plan.boosters.length > 0 && plan.first);
    // Two options left: about half of the guesses are right.
    expect(fraction(guesses, (plan) => plan.firstCorrect)).toBeGreaterThan(0.35);
    expect(fraction(guesses, (plan) => plan.firstCorrect)).toBeLessThan(0.65);
  });

  test('Streak Saver only with a combo of 2 or more on a question it does not know', () => {
    expect(plans({ available: ['streak-saver'], combo: 1 }).some((plan) => plan.boosters.length > 0)).toBe(false);
    for (const plan of plans({ available: ['streak-saver'], combo: 2 })) {
      if (plan.boosters.length > 0) {
        expect(plan.boosters).toEqual(['streak-saver']);
        if (plan.first) expect(plan.offset).toBeGreaterThanOrEqual(5000);
      } else expect(plan.firstCorrect && plan.offset! <= 7000).toBe(true);
    }
  });

  test('priority: Extra Time over 50:50 over Streak Saver', () => {
    const hard = questionOf('hard');
    for (const plan of plans({ available: ['extra-time', '50-50', 'streak-saver'], combo: 3, question: hard })) {
      if (plan.firstCorrect && plan.offset! < 5000) continue;
      if (plan.boosters[0] === 'extra-time') expect(plan.offset).toBeGreaterThanOrEqual(TIME);
      else if (!plan.firstCorrect || plan.offset! >= 5000) expect(['50-50', undefined]).toContain(plan.boosters[0]);
      expect(plan.boosters).not.toContain('streak-saver');
    }
    const medium = plans({ available: ['50-50', 'streak-saver'], combo: 3, question: questionOf('medium') });
    expect(medium.some((plan) => plan.boosters[0] === 'streak-saver')).toBe(true);
    expect(medium.some((plan) => plan.boosters[0] === '50-50')).toBe(false);
  });
});

describe('opponent Second Chance', () => {
  test('after a wrong guess it retries with a different option before the deadline, or keeps the answer', () => {
    const sample = plans({ available: ['second-chance'] });
    let retries = 0;
    let declines = 0;
    for (const plan of sample) {
      if (!plan.first || plan.firstCorrect) {
        expect(plan.steps.filter((s) => s.type !== 'answer')).toEqual([]);
        continue;
      }
      const followUp = plan.steps.slice(1);
      if (followUp[0]?.type === 'decline') {
        declines++;
        expect(followUp).toEqual([{ atMs: plan.first.atMs, type: 'decline' }]);
        continue;
      }
      retries++;
      expect(followUp).toHaveLength(2);
      expect(followUp[0]).toEqual({ atMs: plan.first.atMs + 400, type: 'booster', boosterId: 'second-chance' });
      const retry = followUp[1] as Extract<AiStep, { type: 'answer' }>;
      expect(retry.type).toBe('answer');
      expect(retry.optionIndex).not.toBe(plan.first.optionIndex);
      expect(retry.atMs - plan.first.atMs).toBeGreaterThanOrEqual(1200);
      expect(retry.atMs - plan.first.atMs).toBeLessThanOrEqual(2500);
      expect(retry.atMs).toBeLessThan(OPENED + TIME);
    }
    expect(retries).toBeGreaterThan(0);
    expect(declines).toBeGreaterThan(0);
  });

  test('is never planned on a question where another booster was used', () => {
    const sample = plans({ available: ['50-50', 'second-chance'], question: questionOf('hard') });
    for (const plan of sample.filter((p) => p.boosters.includes('50-50'))) {
      expect(plan.boosters).toEqual(['50-50']);
      expect(plan.answers.length).toBeLessThanOrEqual(1);
      expect(plan.steps.some((s) => s.type === 'decline')).toBe(false);
    }
    expect(sample.some((plan) => plan.boosters.includes('50-50') && plan.first && !plan.firstCorrect)).toBe(true);
  });

  test('without Second Chance a wrong answer is final', () => {
    for (const plan of plans()) expect(plan.steps.length).toBeLessThanOrEqual(1);
  });
});

describe('opponent in the engine', () => {
  const finish = (state: BattleState) => ok(state, { type: 'tick', atMs: state.turn!.openedAtMs + TIME + BATTLE_RULES.extraTimeMs });

  test("its plan is fixed when a question opens and never depends on the user's actions", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const start = createBattle(makeSetup({ seed }), 0);
      const turn = start.turn!;
      const correct = turn.sides.player!.question.correctIndex;
      const wrong = (correct + 1) % 4;
      const variants = [
        finish(start),
        finish(ok(start, { type: 'answer', side: 'player', optionIndex: correct, atMs: 300 })),
        finish(ok(start, { type: 'answer', side: 'player', optionIndex: wrong, atMs: 11_000 })),
        finish(ok(start, { type: 'activateBooster', side: 'player', boosterId: 'extra-time', atMs: 100 })),
      ];
      const opponentSides = variants.map((state) => state.turn!.sides.opponent!);
      for (const side of opponentSides.slice(1)) expect(side).toEqual(opponentSides[0]);
      expect(variants.every((state) => state.phase === 'resolved')).toBe(true);
    }
  });

  test('its plan uses only public information, through the same validation as the user', () => {
    const state = createBattle(makeSetup({ seed: 3 }), 0);
    const opponent = state.turn!.sides.opponent!;
    expect(opponent.aiSteps).toEqual(
      planOpponentTurn({
        rules: state.rules,
        seed: 3,
        questionKey: 'r1-q1',
        round: 1,
        openedAtMs: 0,
        timeMs: TIME,
        question: opponent.question,
        level: state.fighters.opponent.level,
        hp: 100,
        combo: 0,
        available: state.fighters.opponent.boosterIds,
      }),
    );
    const rejected = step(state, { type: 'answer', side: 'opponent', optionIndex: 0, atMs: 1 });
    expect(rejected.ok ? null : rejected.error.code).toBe('opponent-is-ai');
  });
});
