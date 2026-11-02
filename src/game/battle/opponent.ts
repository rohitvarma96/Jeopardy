import { createRng, hashSeed } from '../random';
import type { BoosterId } from '../types/booster';
import type { Difficulty, PreparedQuestion } from '../types/question';
import { fiftyFiftyRemoval } from './boosters';
import type { BattleRules } from './rules';
import type { AiStep } from './types';

const BASE_KNOW: Record<Difficulty, number> = { easy: 0.85, medium: 0.65, hard: 0.45 };
const MIN_RESPONSE_MS = 500;

export function knowProbability(difficulty: Difficulty, level: number): number {
  return Math.min(0.95, Math.max(0.05, BASE_KNOW[difficulty] + (level - 3) * 0.05));
}

/** Public information only: never the user's answer, choice timing or boosters. */
export type OpponentPlanInput = {
  rules: BattleRules;
  seed: number;
  questionKey: string;
  questionNumber: number;
  openedAtMs: number;
  timeMs: number;
  question: PreparedQuestion;
  level: number;
  hp: number;
  combo: number;
  /** Equipped boosters the opponent has not used yet. */
  available: readonly BoosterId[];
};

/**
 * Deterministic mock-opponent plan for one question, fixed when the question opens.
 * All random draws happen up front so the sequence never depends on the branch taken.
 */
export function planOpponentTurn(input: OpponentPlanInput): AiStep[] {
  const { rules, question, timeMs } = input;
  const rng = createRng(hashSeed(input.seed, input.questionKey, 'opponent-plan'));
  const [knowRoll, responseRoll, boosterRoll, guessRoll] = Array.from({ length: 4 }, rng);

  const knows = knowRoll < knowProbability(question.difficulty, input.level);
  const responseMs = knows
    ? Math.max(MIN_RESPONSE_MS, Math.round(2000 + responseRoll * 5000 - (input.level - 3) * 250))
    : Math.round(5000 + responseRoll * 10000);
  const has = (id: BoosterId) => input.available.includes(id);

  let booster: BoosterId | null = null;
  if (has('mind-shield') && (input.hp <= 60 || input.questionNumber >= 13)) booster = 'mind-shield';
  else if (has('double-damage') && knows && input.questionNumber >= 5) booster = 'double-damage';
  else if (has('extra-time') && responseMs >= timeMs && responseMs < timeMs + rules.extraTimeMs) booster = 'extra-time';
  else if (has('50-50') && !knows && question.difficulty === 'hard') booster = '50-50';
  else if (has('streak-saver') && !knows && input.combo >= 2) booster = 'streak-saver';

  const at = (offsetMs: number) => input.openedAtMs + offsetMs;
  const steps: AiStep[] = [];
  if (booster) {
    steps.push({ atMs: at(Math.min(600 + Math.round(boosterRoll * 1000), responseMs - 100)), type: 'booster', boosterId: booster });
  }

  const deadline = timeMs + (booster === 'extra-time' ? rules.extraTimeMs : 0);
  if (responseMs >= deadline) return steps;

  const removed =
    booster === '50-50'
      ? fiftyFiftyRemoval(input.seed, input.questionKey, 'opponent', question, rules.fiftyFiftyRemoves)
      : [];
  const visible = question.options.map((_, index) => index).filter((index) => !removed.includes(index));
  const choice = knows ? question.correctIndex : visible[Math.floor(guessRoll * visible.length)];
  steps.push({ atMs: at(responseMs), type: 'answer', optionIndex: choice });

  return steps;
}
