import { QUESTIONS } from '../../data/questions';
import { hashSeed, seededShuffle } from '../random';
import type { CategoryId } from '../types/match';
import type { PreparedQuestion, Question } from '../types/question';
import type { MatchQuestions } from './types';

const byId = (a: Question, b: Question) => a.id.localeCompare(b.id);

export function prepareQuestion(question: Question, seed: number): PreparedQuestion {
  const options = seededShuffle([question.answer, ...question.incorrect], seed);
  return {
    id: question.id,
    categoryId: question.categoryId,
    difficulty: question.difficulty,
    prompt: question.prompt,
    options,
    correctIndex: options.indexOf(question.answer),
  };
}

export function buildMatchQuestions(
  seed: number,
  categoryIds: readonly CategoryId[],
  bank: readonly Question[] = QUESTIONS,
): MatchQuestions {
  const pool = bank.filter((question) => categoryIds.includes(question.categoryId)).sort(byId);
  if (categoryIds.length === 0) throw new Error('A battle needs at least one question category.');
  for (const categoryId of categoryIds) {
    if (!pool.some((question) => question.categoryId === categoryId)) {
      throw new Error(`No questions available for ${categoryId}.`);
    }
  }
  return seededShuffle(pool, hashSeed(seed, 'questions'));
}

/** Exhaust the shared pool before repeating; each appearance has a seeded option order. */
export function matchQuestion(questions: MatchQuestions, seed: number, index: number): PreparedQuestion {
  return prepareQuestion(questions[index % questions.length], hashSeed(seed, 'question', index));
}
