import {
  BATTLE_RULES,
  createBattle,
  SIDES,
  step,
  type BattleAction,
  type BattleErrorCode,
  type BattleRules,
  type BattleSetup,
  type BattleState,
  type Combatant,
  type Side,
  type SideTurn,
} from '../../src/game/battle';
import type { BoosterId } from '../../src/game/types/booster';

export const NO_PASSIVES: BattleRules = { ...BATTLE_RULES, passivesEnabled: false };

export const PLAYER: Combatant = {
  name: 'You',
  fighterId: 'arcane',
  boosterIds: ['50-50', 'extra-time', 'second-chance'],
  level: 3,
};

export const OPPONENT: Combatant = {
  name: 'Rival',
  fighterId: 'shadow',
  boosterIds: ['double-damage', 'mind-shield', 'streak-saver'],
  level: 3,
};

export function makeSetup(overrides: Partial<BattleSetup> = {}): BattleSetup {
  return {
    matchId: 'test-match',
    seed: 1,
    player: PLAYER,
    opponent: OPPONENT,
    rounds: ['science', 'sports', 'history', 'space', 'music'],
    suddenDeathCategoryId: 'geography',
    ...overrides,
  };
}

/** Both sides driven by the test. Passives are off unless a test passes rules with them on. */
export function manualBattle(overrides: Partial<BattleSetup> = {}, rules: BattleRules = NO_PASSIVES) {
  return createBattle(makeSetup(overrides), 0, { rules, control: 'manual' });
}

export function ok(state: BattleState, action: BattleAction): BattleState {
  const result = step(state, action);
  if (!result.ok) throw new Error(`${action.type} rejected: ${result.error.code}`);
  return result.state;
}

export function rejected(state: BattleState, action: BattleAction): BattleErrorCode {
  const result = step(state, action);
  if (result.ok) throw new Error(`${action.type} was accepted`);
  return result.error.code;
}

export const last = <T>(items: readonly T[]): T => {
  if (items.length === 0) throw new Error('Empty list');
  return items[items.length - 1];
};

export function sideTurn(state: BattleState, side: Side): SideTurn {
  const turn = state.turn?.sides[side];
  if (!turn) throw new Error(`${side} has no turn`);
  return turn;
}

export const correctOption = (state: BattleState, side: Side) => sideTurn(state, side).question.correctIndex;

/** First incorrect option that `side` can still select. */
export function wrongOption(state: BattleState, side: Side): number {
  const turn = sideTurn(state, side);
  return turn.question.options.findIndex(
    (_, index) => index !== turn.question.correctIndex && !turn.removed.includes(index) && turn.eliminated !== index,
  );
}

export const openedAt = (state: BattleState) => {
  if (!state.turn) throw new Error('No open question');
  return state.turn.openedAtMs;
};

export const answer = (state: BattleState, side: Side, correct: boolean, elapsedMs: number) =>
  ok(state, {
    type: 'answer',
    side,
    optionIndex: correct ? correctOption(state, side) : wrongOption(state, side),
    atMs: openedAt(state) + elapsedMs,
  });

export const activate = (state: BattleState, side: Side, boosterId: BoosterId, elapsedMs = 0) =>
  ok(state, { type: 'activateBooster', side, boosterId, atMs: Math.max(state.nowMs, openedAt(state) + elapsedMs) });

export const advance = (state: BattleState, atMs = state.nowMs) => ok(state, { type: 'advance', atMs });

export type Move = 'correct' | 'wrong' | 'timeout';

/**
 * Plays the open question: each listed side answers `elapsed` ms after it opened (default 1 s);
 * unlisted sides time out. Second Chance offers are declined. Returns the resolved state.
 */
export function play(
  state: BattleState,
  moves: Partial<Record<Side, Move>>,
  elapsed: Partial<Record<Side, number>> = {},
): BattleState {
  const start = openedAt(state);
  const sides = SIDES.filter((side) => state.turn?.sides[side] && state.turn.sides[side]?.status !== 'final');
  const timed = sides
    .filter((side) => (moves[side] ?? 'timeout') !== 'timeout')
    .map((side) => ({ side, atMs: Math.max(state.nowMs, start + (elapsed[side] ?? 1_000)) }))
    .sort((a, b) => a.atMs - b.atMs);
  let next = state;
  for (const { side, atMs } of timed) {
    const optionIndex = moves[side] === 'correct' ? correctOption(next, side) : wrongOption(next, side);
    next = ok(next, { type: 'answer', side, optionIndex, atMs });
    if (next.phase === 'open' && next.turn?.sides[side]?.status === 'awaiting-retry') {
      next = ok(next, { type: 'declineRetry', side, atMs });
    }
  }
  if (next.phase === 'open') {
    const deadline = Math.max(...SIDES.flatMap((side) => (next.turn?.sides[side] ? [sideTurn(next, side).deadlineMs] : [])));
    next = ok(next, { type: 'tick', atMs: Math.max(next.nowMs, deadline) });
  }
  return next;
}

/** Plays every question as a double timeout (and advances) until `done` holds. */
export function timeoutUntil(state: BattleState, done: (state: BattleState) => boolean): BattleState {
  let next = state;
  for (let guard = 0; !done(next); guard++) {
    if (guard > 200 || next.phase === 'finished') throw new Error('Stage was not reached');
    next = next.phase === 'open' ? play(next, {}) : advance(next);
  }
  return next;
}

export const isOpen = (kind: BattleState['stage']['kind'], round?: number, turn?: 0 | 1) => (state: BattleState) =>
  state.phase === 'open' &&
  state.stage.kind === kind &&
  (round === undefined || ('round' in state.stage && state.stage.round === round)) &&
  (turn === undefined || ('turn' in state.stage && state.stage.turn === turn));

/** Test-only copy with adjusted health, to reach end-game situations quickly. */
export function withHp(state: BattleState, hp: Partial<Record<Side, number>>): BattleState {
  const copy = JSON.parse(JSON.stringify(state)) as BattleState;
  for (const side of SIDES) {
    const value = hp[side];
    if (value !== undefined) copy.fighters[side].hp = value;
  }
  return copy;
}

export function deepFreeze<T>(value: T, seen = new Set<unknown>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}
