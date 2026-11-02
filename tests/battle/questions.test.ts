import { describe, expect, test } from '@jest/globals';

import { CATEGORY_IDS } from '../../src/data/categories';
import { QUESTIONS } from '../../src/data/questions';
import {
  BATTLE_RULES,
  buildMatchQuestions,
  createBattle,
  prepareQuestion,
  suddenDeathQuestion,
  type MatchQuestions,
} from '../../src/game/battle';
import type { CategoryId } from '../../src/game/types/match';
import type { Question } from '../../src/game/types/question';
import { makeSetup } from './helpers';

const ROUNDS: CategoryId[] = ['science', 'sports', 'history', 'space', 'music'];
const build = (seed: number, suddenDeath: CategoryId | null = 'geography', bank?: readonly Question[]) =>
  buildMatchQuestions(seed, ROUNDS, suddenDeath, BATTLE_RULES, bank);
const byId = new Map(QUESTIONS.map((question) => [question.id, question]));
const roundIds = (match: MatchQuestions) =>
  match.rounds.flatMap((round) => [...round.standard, round.clash.player, round.clash.opponent].map((q) => q.id));

describe('question fixtures', () => {
  test('8 questions per category (3 easy, 3 medium, 2 hard) with unique ids and 4 distinct options', () => {
    expect(QUESTIONS).toHaveLength(CATEGORY_IDS.length * 8);
    expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(QUESTIONS.length);
    for (const categoryId of CATEGORY_IDS) {
      const inCategory = QUESTIONS.filter((question) => question.categoryId === categoryId);
      const count = (difficulty: string) => inCategory.filter((question) => question.difficulty === difficulty).length;
      expect([count('easy'), count('medium'), count('hard')]).toEqual([3, 3, 2]);
    }
    for (const question of QUESTIONS) {
      expect(new Set([question.answer, ...question.incorrect]).size).toBe(4);
      expect(question.prompt.trim()).not.toBe('');
    }
  });
});

describe('match question selection', () => {
  test.each([1, 2, 3, 77, -5, 123_456])('seed %p: 3 standard questions and a clash pair per round, never repeated', (seed) => {
    const match = build(seed);
    expect(match.rounds).toHaveLength(BATTLE_RULES.standardRounds);
    match.rounds.forEach((round, index) => {
      expect(round.categoryId).toBe(ROUNDS[index]);
      expect(round.standard).toHaveLength(BATTLE_RULES.questionsPerRound);
      const all = [...round.standard, round.clash.player, round.clash.opponent];
      expect(all.every((question) => question.categoryId === ROUNDS[index])).toBe(true);
      // Each player gets a different clash question of the same difficulty.
      expect(round.clash.player.id).not.toBe(round.clash.opponent.id);
      expect(round.clash.player.difficulty).toBe(round.clash.opponent.difficulty);
    });
    const ids = roundIds(match);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('options are a permutation of the answer and the incorrect options; correctIndex marks the answer', () => {
    const positions = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) {
      const match = build(seed);
      for (const prepared of match.rounds.flatMap((round) => [...round.standard, round.clash.player])) {
        const source = byId.get(prepared.id)!;
        expect([...prepared.options].sort()).toEqual([source.answer, ...source.incorrect].sort());
        expect(prepared.options[prepared.correctIndex]).toBe(source.answer);
        positions.add(prepared.correctIndex);
      }
    }
    // The answer is not always in the same place.
    expect([...positions].sort()).toEqual([0, 1, 2, 3]);
  });

  test('selection is deterministic per seed and differs between seeds', () => {
    expect(build(9)).toEqual(build(9));
    const orders = new Set(Array.from({ length: 10 }, (_, seed) => roundIds(build(seed + 1)).join()));
    expect(orders.size).toBeGreaterThan(1);
    expect(prepareQuestion(QUESTIONS[0], 5)).toEqual(prepareQuestion(QUESTIONS[0], 5));
  });

  test('the clash pair uses a difficulty that has at least two questions', () => {
    const bank = QUESTIONS.filter(
      (question) => question.difficulty !== 'easy' || question.id.endsWith('1') || !ROUNDS.includes(question.categoryId),
    );
    for (let seed = 1; seed <= 20; seed++) {
      for (const round of build(seed, null, bank).rounds) expect(round.clash.player.difficulty).not.toBe('easy');
    }
  });

  test('a category without enough questions is rejected', () => {
    const bank = QUESTIONS.filter((question) => question.categoryId !== 'music' || question.difficulty === 'easy');
    expect(() => build(1, null, bank)).toThrow('Not enough music questions for round 5.');
    expect(() => createBattle(makeSetup(), 0, { bank })).toThrow('Not enough music questions');
  });
});

describe('sudden-death questions', () => {
  test('the leftover draft category comes first, then unused round questions', () => {
    const match = build(4);
    const used = new Set(roundIds(match));
    const pool = match.suddenDeath;
    // 8 geography questions + 3 unused questions from each of the 5 round categories.
    expect(pool).toHaveLength(8 + 5 * 3);
    expect(pool.slice(0, 8).every((question) => question.categoryId === 'geography')).toBe(true);
    expect(pool.slice(8).every((question) => ROUNDS.includes(question.categoryId))).toBe(true);
    expect(pool.some((question) => used.has(question.id))).toBe(false);
    expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
  });

  test('without a sudden-death category the unused round questions are used', () => {
    const pool = build(4, null).suddenDeath;
    expect(pool).toHaveLength(15);
    expect(pool.every((question) => ROUNDS.includes(question.categoryId))).toBe(true);
  });

  test('the pool cycles with a fresh option order, deterministically', () => {
    const match = build(6);
    const size = match.suddenDeath.length;
    const first = suddenDeathQuestion(match, 6, 0);
    expect(first.id).toBe(match.suddenDeath[0].id);
    expect(suddenDeathQuestion(match, 6, 3)).toEqual(suddenDeathQuestion(match, 6, 3));
    const repeats = Array.from({ length: 6 }, (_, cycle) => suddenDeathQuestion(match, 6, cycle * size));
    expect(repeats.every((question) => question.id === first.id)).toBe(true);
    expect(new Set(repeats.map((question) => question.options.join())).size).toBeGreaterThan(1);
  });

  test('falls back to the whole bank when nothing else is left', () => {
    // Exactly five questions (three easy) per round category and no draft leftover.
    const bank = ROUNDS.flatMap((categoryId) =>
      QUESTIONS.filter((question) => question.categoryId === categoryId && question.difficulty !== 'hard').slice(0, 5),
    );
    const match = build(2, 'geography', bank);
    expect(match.suddenDeath).toHaveLength(bank.length);
    expect(new Set(match.suddenDeath.map((question) => question.id))).toEqual(new Set(bank.map((question) => question.id)));
  });
});
