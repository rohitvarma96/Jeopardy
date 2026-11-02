import type { CategoryId } from './match';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Fixture form: the correct answer is stored separately and options are shuffled per match. */
export type Question = {
  id: string;
  categoryId: CategoryId;
  difficulty: Difficulty;
  prompt: string;
  answer: string;
  incorrect: readonly [string, string, string];
};

/** A question as presented in one match: shuffled options and the resulting correct index. */
export type PreparedQuestion = {
  id: string;
  categoryId: CategoryId;
  difficulty: Difficulty;
  prompt: string;
  options: readonly string[];
  correctIndex: number;
};
