import { isBattleBoosterId } from '../../data/boosters';
import { CATEGORY_IDS } from '../../data/categories';
import { isFighterId } from '../../data/fighters';
import { MATCH_RULES } from '../rules';
import type { BoosterId } from '../types/booster';
import type { Question } from '../types/question';
import { applyBooster, boosterActivationError, unusedBoosters } from './boosters';
import { applyComboResult } from './combo';
import { calculateAttack } from './damage';
import { planOpponentTurn } from './opponent';
import { buildMatchQuestions, matchQuestion } from './questions';
import { BATTLE_RULES, type BattleRules } from './rules';
import {
  otherSide,
  SIDES,
  type AnswerOutcome,
  type BattleAction,
  type BattleError,
  type BattleErrorCode,
  type BattleSetup,
  type BattleState,
  type Combatant,
  type FighterState,
  type Hit,
  type Resolution,
  type Side,
  type SideTurn,
  type StepResult,
} from './types';

export type CreateBattleOptions = {
  rules?: BattleRules;
  control?: BattleState['control'];
  bank?: readonly Question[];
};

const error = (code: BattleErrorCode, message: string): BattleError => ({ code, message });

/** Rule state is plain JSON. Rules, setup and questions are never mutated, so they are shared. */
function cloneState(state: BattleState): BattleState {
  const { rules, setup, questions, ...rest } = state;
  return { ...(JSON.parse(JSON.stringify(rest)) as typeof rest), rules, setup, questions };
}

function validateCombatant(combatant: Combatant, label: string) {
  if (!isFighterId(combatant.fighterId)) throw new Error(`Unknown ${label} fighter.`);
  const ids = combatant.boosterIds;
  if (ids.length !== MATCH_RULES.loadoutSize || new Set(ids).size !== ids.length || !ids.every(isBattleBoosterId)) {
    throw new Error(`The ${label} loadout must have three distinct available boosters. Second Chance is disabled.`);
  }
  if (!Number.isFinite(combatant.level)) throw new Error(`Invalid ${label} level.`);
}

function newFighter(combatant: Combatant, rules: BattleRules): FighterState {
  return {
    ...combatant,
    hp: rules.startingHp,
    combo: 0,
    bestCombo: 0,
    boostersUsed: [],
    armed: { doubleDamage: false, mindShield: false, streakSaver: false },
    passiveUsed: false,
    stats: { correct: 0, wrong: 0, timeouts: 0, damageDealt: 0, attacksBlocked: 0 },
  };
}

export function createBattle(setup: BattleSetup, atMs: number, options: CreateBattleOptions = {}): BattleState {
  const rules = options.rules ?? BATTLE_RULES;
  if (!Number.isFinite(atMs)) throw new Error('Battle start time must be finite.');
  if (!Number.isSafeInteger(setup.seed)) throw new Error('Battle seed must be an integer.');
  if (
    setup.categoryIds.length !== MATCH_RULES.categoryCount ||
    new Set(setup.categoryIds).size !== setup.categoryIds.length ||
    !setup.categoryIds.every((id) => CATEGORY_IDS.includes(id))
  ) {
    throw new Error(`A battle needs ${MATCH_RULES.categoryCount} distinct question categories.`);
  }
  validateCombatant(setup.player, 'player');
  validateCombatant(setup.opponent, 'opponent');

  const state: BattleState = {
    rules,
    setup,
    control: options.control ?? 'ai',
    questions: buildMatchQuestions(setup.seed, setup.categoryIds, options.bank),
    firstInitiative: Math.abs(setup.seed) % 2 === 1 ? 'player' : 'opponent',
    startedAtMs: atMs,
    nowMs: atMs,
    questionIndex: 0,
    phase: 'open',
    turn: null,
    fighters: { player: newFighter(setup.player, rules), opponent: newFighter(setup.opponent, rules) },
    log: [],
    outcome: null,
  };
  openQuestion(state, 0, atMs);
  return state;
}

/** Equal-time attacks use seeded initiative, alternating each shared question. */
export function initiativeFor(state: Pick<BattleState, 'firstInitiative'>, questionNumber: number): Side {
  return questionNumber % 2 === 1 ? state.firstInitiative : otherSide(state.firstInitiative);
}

export function questionKey(index: number): string {
  return `q${index + 1}`;
}

/** Whether `side` may activate `boosterId` right now. Shared by the engine and the UI view. */
export function activationError(state: BattleState, side: Side, boosterId: BoosterId): BattleError | null {
  return boosterActivationError(state, side, boosterId);
}

function newSideTurn(question: SideTurn['question'], deadlineMs: number): SideTurn {
  return {
    question,
    deadlineMs,
    status: 'answering',
    removed: [],
    booster: null,
    attempts: [],
    outcome: null,
    finalAtMs: null,
    aiSteps: [],
    aiCursor: 0,
  };
}

function openQuestion(state: BattleState, index: number, atMs: number) {
  const { rules, questions } = state;
  state.questionIndex = index;
  state.phase = 'open';
  const timeMs = rules.questionTimeMs;
  const deadline = atMs + timeMs;
  const question = matchQuestion(questions, state.setup.seed, index);
  const key = questionKey(index);
  const sides = { player: newSideTurn(question, deadline), opponent: newSideTurn(question, deadline) };

  state.turn = { key, openedAtMs: atMs, timeMs, sides };
  const ai = sides.opponent;
  if (state.control === 'ai') {
    const opponent = state.fighters.opponent;
    ai.aiSteps = planOpponentTurn({
      rules,
      seed: state.setup.seed,
      questionKey: key,
      questionNumber: index + 1,
      openedAtMs: atMs,
      timeMs,
      question: ai.question,
      level: opponent.level,
      hp: opponent.hp,
      combo: opponent.combo,
      available: unusedBoosters(opponent),
    });
  }
}

function finish(state: BattleState, winner: Side, reason: 'knockout' | 'forfeit', atMs: number) {
  state.outcome = { winner, reason, atMs };
  state.phase = 'finished';
}

function finalize(sideTurn: SideTurn, outcome: AnswerOutcome, atMs: number) {
  sideTurn.status = 'final';
  sideTurn.outcome = outcome;
  sideTurn.finalAtMs = atMs;
}

function openSideTurn(state: BattleState, side: Side): SideTurn | BattleError {
  if (state.phase === 'finished') return error('match-finished', 'The match is over.');
  if (state.phase !== 'open' || !state.turn) return error('no-open-question', 'No question is open.');
  return state.turn.sides[side];
}

function doAnswer(state: BattleState, side: Side, optionIndex: number, atMs: number): BattleError | null {
  const sideTurn = openSideTurn(state, side);
  if ('code' in sideTurn) return sideTurn;
  if (sideTurn.status === 'final') return error('already-answered', 'This answer is locked.');
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= sideTurn.question.options.length) {
    return error('invalid-option', 'That option does not exist.');
  }
  if (sideTurn.removed.includes(optionIndex)) {
    return error('option-unavailable', 'That option was removed.');
  }

  const correct = optionIndex === sideTurn.question.correctIndex;
  sideTurn.attempts.push({ optionIndex, atMs, correct });
  finalize(sideTurn, correct ? 'correct' : 'wrong', atMs);
  return null;
}

function doActivate(state: BattleState, side: Side, boosterId: BoosterId, atMs: number): BattleError | null {
  const failure = boosterActivationError(state, side, boosterId);
  if (failure) return failure;
  applyBooster(state, side, boosterId, atMs);
  return null;
}

/** A private deadline passed without an answer. */
function expire(state: BattleState, side: Side) {
  const sideTurn = state.turn?.sides[side];
  if (!sideTurn || sideTurn.status === 'final') return;
  finalize(sideTurn, 'timeout', sideTurn.deadlineMs);
}

type DueEvent = { atMs: number; priority: number; side: Side; type: 'deadline' | 'ai' };

/** Earliest pending event at or before `atMs`: deadlines first, then mock-opponent steps. */
function nextDue(state: BattleState, atMs: number): DueEvent | null {
  if (state.phase !== 'open' || !state.turn) return null;
  let next: DueEvent | null = null;
  const consider = (event: DueEvent) => {
    if (event.atMs > atMs) return;
    if (!next || event.atMs < next.atMs || (event.atMs === next.atMs && event.priority < next.priority)) next = event;
  };
  for (const side of SIDES) {
    const sideTurn = state.turn.sides[side];
    if (!sideTurn || sideTurn.status === 'final') continue;
    consider({ atMs: sideTurn.deadlineMs, priority: 0, side, type: 'deadline' });
    const aiStep = state.control === 'ai' && side === 'opponent' ? sideTurn.aiSteps[sideTurn.aiCursor] : undefined;
    if (aiStep) consider({ atMs: aiStep.atMs, priority: 1, side, type: 'ai' });
  }
  return next;
}

function runAiStep(state: BattleState) {
  const sideTurn = state.turn?.sides.opponent;
  const aiStep = sideTurn?.aiSteps[sideTurn.aiCursor];
  if (!sideTurn || !aiStep) return;
  sideTurn.aiCursor += 1;
  // Plan steps go through the same validation as user actions; an invalid step is skipped.
  if (aiStep.type === 'booster') doActivate(state, 'opponent', aiStep.boosterId, aiStep.atMs);
  else doAnswer(state, 'opponent', aiStep.optionIndex, aiStep.atMs);
}

/** Processes every deadline and opponent step due at or before `atMs`, in time order. */
function advanceTo(state: BattleState, atMs: number): BattleState {
  if (!nextDue(state, atMs)) return state.nowMs === atMs ? state : { ...state, nowMs: atMs };
  const working = cloneState(state);
  for (let guard = 0; ; guard++) {
    const due = nextDue(working, atMs);
    if (!due) break;
    if (guard > 1000) throw new Error('Battle events did not settle.');
    working.nowMs = due.atMs;
    if (due.type === 'deadline') expire(working, due.side);
    else runAiStep(working);
    settle(working, due.atMs);
  }
  working.nowMs = atMs;
  return working;
}

/** Resolves the open question exactly once, when every participant is final. */
function settle(state: BattleState, atMs: number) {
  const turn = state.turn;
  if (state.phase !== 'open' || !turn) return;
  if (SIDES.some((side) => turn.sides[side].status !== 'final')) return;
  resolve(state, atMs);
}

function strike(state: BattleState, attacker: Side): Hit {
  const turn = state.turn!;
  const sideTurn = turn.sides[attacker];
  const a = state.fighters[attacker];
  const defender = state.fighters[otherSide(attacker)];
  const result = calculateAttack({
    rules: state.rules,
    elapsedMs: (sideTurn.finalAtMs ?? turn.openedAtMs) - turn.openedAtMs,
    timeMs: turn.timeMs,
    attacker: { fighterId: a.fighterId, passiveUsed: a.passiveUsed, doubleDamageArmed: a.armed.doubleDamage },
    defender: {
      fighterId: defender.fighterId,
      passiveUsed: defender.passiveUsed,
      shieldArmed: defender.armed.mindShield,
      hp: defender.hp,
    },
  });
  const summary = {
    attacker,
    base: result.base,
    doubled: result.doubled,
    speedBonus: result.speedBonus,
    passiveBonus: result.passiveBonus,
    raw: result.raw,
  };
  if (state.outcome) {
    return { ...summary, blocked: false, bulwarkReduction: 0, damage: 0, void: true, targetHp: defender.hp };
  }

  if (result.consumes.doubleDamage) a.armed.doubleDamage = false;
  if (result.consumes.attackerPassive) a.passiveUsed = true;
  if (result.consumes.shield) {
    defender.armed.mindShield = false;
    defender.stats.attacksBlocked += 1;
  }
  if (result.consumes.defenderPassive) defender.passiveUsed = true;
  defender.hp -= result.damage;
  a.stats.damageDealt += result.damage;
  if (defender.hp <= 0) finish(state, attacker, 'knockout', state.nowMs);

  return {
    ...summary,
    blocked: result.blocked,
    bulwarkReduction: result.bulwarkReduction,
    damage: result.damage,
    void: false,
    targetHp: defender.hp,
  };
}

function resolve(state: BattleState, atMs: number) {
  const turn = state.turn!;
  state.nowMs = atMs;
  const resolution: Resolution = { key: turn.key, atMs, results: {}, hits: [] };

  for (const side of SIDES) {
    const sideTurn = turn.sides[side];
    if (!sideTurn?.outcome) continue;
    const fighter = state.fighters[side];
    const correct = sideTurn.outcome === 'correct';
    const combo = applyComboResult(
      { combo: fighter.combo, bestCombo: fighter.bestCombo, streakSaverArmed: fighter.armed.streakSaver },
      correct,
    );
    fighter.combo = combo.combo;
    fighter.bestCombo = combo.bestCombo;
    fighter.armed.streakSaver = combo.streakSaverArmed;
    if (correct) fighter.stats.correct += 1;
    else if (sideTurn.outcome === 'wrong') fighter.stats.wrong += 1;
    else fighter.stats.timeouts += 1;
    resolution.results[side] = {
      outcome: sideTurn.outcome,
      comboAfter: combo.combo,
      comboSaved: combo.saved,
      boosterId: sideTurn.booster,
    };
  }

  // Faster answer strikes first; equal times go to this question's initiative holder.
  const holder = initiativeFor(state, state.questionIndex + 1);
  const attackers = SIDES.filter((side) => turn.sides[side]?.outcome === 'correct').sort(
    (a, b) =>
      (turn.sides[a]!.finalAtMs ?? 0) - (turn.sides[b]!.finalAtMs ?? 0) || (a === holder ? -1 : b === holder ? 1 : 0),
  );
  for (const side of attackers) resolution.hits.push(strike(state, side));
  state.log.push(resolution);
  if (state.outcome) return;

  state.phase = 'resolved';
}

function advance(state: BattleState, atMs: number): BattleError | null {
  if (state.phase === 'finished') return error('match-finished', 'The match is over.');
  if (state.phase !== 'resolved') return error('not-resolved', 'The current question has not resolved yet.');
  openQuestion(state, state.questionIndex + 1, atMs);
  return null;
}

function apply(state: BattleState, action: Exclude<BattleAction, { type: 'tick' }>): BattleError | null {
  switch (action.type) {
    case 'answer':
      return doAnswer(state, action.side, action.optionIndex, action.atMs);
    case 'activateBooster':
      return doActivate(state, action.side, action.boosterId, action.atMs);
    case 'advance':
      return advance(state, action.atMs);
    case 'forfeit':
      if (state.phase === 'finished') return error('match-finished', 'The match is over.');
      finish(state, otherSide(action.side), 'forfeit', action.atMs);
      return null;
  }
}

/**
 * Pure transition: returns a new state and never mutates the input. Every action carries its own
 * timestamp; pending deadlines and opponent steps up to that time are processed first.
 */
export function step(state: BattleState, action: BattleAction): StepResult {
  if (!Number.isFinite(action.atMs) || action.atMs < state.nowMs) {
    return { ok: false, state, error: error('invalid-time', 'Actions cannot move time backwards.') };
  }
  const advanced = advanceTo(state, action.atMs);
  if (action.type === 'tick') return { ok: true, state: advanced };
  if ('side' in action && action.side === 'opponent' && advanced.control === 'ai') {
    return { ok: false, state: advanced, error: error('opponent-is-ai', 'The opponent is controlled by the engine.') };
  }

  const working = cloneState(advanced);
  working.nowMs = action.atMs;
  const failure = apply(working, action);
  if (failure) return { ok: false, state: advanced, error: failure };
  settle(working, action.atMs);
  return { ok: true, state: working };
}
