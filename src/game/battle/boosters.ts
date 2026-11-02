import { isBattleBoosterId } from '../../data/boosters';
import { hashSeed, seededShuffle } from '../random';
import type { BoosterId } from '../types/booster';
import type { PreparedQuestion } from '../types/question';
import type { BattleError, BattleState, FighterState, Side } from './types';

/** Seeded choice of which incorrect options 50:50 removes for one side on one question. */
export function fiftyFiftyRemoval(
  seed: number,
  questionKey: string,
  side: Side,
  question: PreparedQuestion,
  count: number,
): number[] {
  const incorrect = question.options.map((_, index) => index).filter((index) => index !== question.correctIndex);
  return seededShuffle(incorrect, hashSeed(seed, questionKey, side, '50-50'))
    .slice(0, count)
    .sort((a, b) => a - b);
}

export const isBoosterUsed = (fighter: FighterState, boosterId: BoosterId) =>
  fighter.boostersUsed.some((use) => use.boosterId === boosterId);

export const unusedBoosters = (fighter: FighterState): BoosterId[] =>
  fighter.boosterIds.filter((id) => isBattleBoosterId(id) && !isBoosterUsed(fighter, id));

/** Activation window, once-per-match and one-per-question rules (CTX-05). */
export function boosterActivationError(state: BattleState, side: Side, boosterId: BoosterId): BattleError | null {
  if (state.phase === 'finished') return { code: 'match-finished', message: 'The match is over.' };
  const turn = state.phase === 'open' ? state.turn : null;
  if (!turn) return { code: 'no-open-question', message: 'Boosters can only be used while a question is open.' };
  if (!isBattleBoosterId(boosterId)) {
    return { code: 'booster-unavailable', message: 'Second Chance is disabled. Every answer is final.' };
  }
  const sideTurn = turn.sides[side];
  const fighter = state.fighters[side];
  if (!fighter.boosterIds.includes(boosterId)) {
    return { code: 'booster-not-equipped', message: 'That booster is not in the loadout.' };
  }
  if (isBoosterUsed(fighter, boosterId)) {
    return { code: 'booster-used', message: 'Each booster can be used once per match.' };
  }
  if (sideTurn.booster !== null) {
    return { code: 'booster-limit', message: 'Only one booster can be used per question.' };
  }
  if (sideTurn.status !== 'answering') {
    return { code: 'booster-window', message: 'Boosters must be used before answering.' };
  }
  return null;
}

/** Applies a booster that already passed `boosterActivationError`. Mutates the working state. */
export function applyBooster(state: BattleState, side: Side, boosterId: BoosterId, atMs: number) {
  if (!isBattleBoosterId(boosterId)) throw new Error('Second Chance is disabled. Every answer is final.');
  const turn = state.turn;
  const sideTurn = turn?.sides[side];
  if (!turn || !sideTurn) throw new Error('No open question for this booster.');
  const fighter = state.fighters[side];

  switch (boosterId) {
    case '50-50':
      sideTurn.removed = fiftyFiftyRemoval(state.setup.seed, turn.key, side, sideTurn.question, state.rules.fiftyFiftyRemoves);
      break;
    case 'extra-time':
      sideTurn.deadlineMs += state.rules.extraTimeMs;
      break;
    case 'double-damage':
      fighter.armed.doubleDamage = true;
      break;
    case 'mind-shield':
      fighter.armed.mindShield = true;
      break;
    case 'streak-saver':
      fighter.armed.streakSaver = true;
      break;
  }
  sideTurn.booster = boosterId;
  fighter.boostersUsed.push({ boosterId, questionKey: turn.key, atMs });
}
