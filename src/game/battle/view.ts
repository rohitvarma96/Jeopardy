import { getBooster } from '../../data/boosters';
import type { BoosterId } from '../types/booster';
import type { CategoryId } from '../types/match';
import type { Difficulty } from '../types/question';
import { isBoosterUsed } from './boosters';
import { activationError, initiativeFor } from './engine';
import type {
  AnswerOutcome,
  BattleOutcome,
  BattleState,
  FighterState,
  Hit,
  Side,
  SideResult,
} from './types';

export type OptionView = {
  index: number;
  label: string;
  text: string;
  removed: boolean;
  selected: boolean;
  /** Known only after the question resolves. */
  correct: boolean | null;
};

export type QuestionView = {
  key: string;
  categoryId: CategoryId;
  difficulty: Difficulty;
  prompt: string;
  options: OptionView[];
  timeMs: number;
  /** The user's own window, including their Extra Time. */
  totalMs: number;
  remainingMs: number;
  /** 'locked' = answered and waiting for the reveal; the outcome stays hidden until then. */
  status: 'answering' | 'locked' | 'resolved' | 'abandoned';
  outcome: AnswerOutcome | null;
  correctIndex: number | null;
  boosterUsed: BoosterId | null;
  opponentLocked: boolean;
};

export type BoosterOptionView = {
  id: BoosterId;
  name: string;
  effect: string;
  used: boolean;
  armed: boolean;
  canActivate: boolean;
};

export type FighterView = Pick<FighterState, 'name' | 'fighterId' | 'level' | 'hp' | 'combo' | 'bestCombo' | 'stats'> & {
  side: Side;
  maxHp: number;
  boosterIds: readonly BoosterId[];
  usedBoosterIds: BoosterId[];
  armed: FighterState['armed'];
};

export type RevealView = {
  key: string;
  results: Partial<Record<Side, SideResult>>;
  hits: Hit[];
};

export type BattleView = {
  phase: BattleState['phase'];
  questionNumber: number;
  categoryId: CategoryId | null;
  initiative: Side;
  player: FighterView;
  opponent: FighterView;
  question: QuestionView | null;
  reveal: RevealView | null;
  boosters: BoosterOptionView[];
  outcome: BattleOutcome | null;
};

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ARMED_BY: Record<keyof FighterState['armed'], BoosterId> = {
  doubleDamage: 'double-damage',
  mindShield: 'mind-shield',
  streakSaver: 'streak-saver',
};

function fighterView(state: BattleState, side: Side, hidden: readonly BoosterId[]): FighterView {
  const fighter = state.fighters[side];
  const armed = { ...fighter.armed };
  for (const key of Object.keys(ARMED_BY) as (keyof typeof ARMED_BY)[]) {
    if (hidden.includes(ARMED_BY[key])) armed[key] = false;
  }
  return {
    side,
    name: fighter.name,
    fighterId: fighter.fighterId,
    level: fighter.level,
    hp: fighter.hp,
    maxHp: state.rules.startingHp,
    combo: fighter.combo,
    bestCombo: fighter.bestCombo,
    stats: { ...fighter.stats },
    boosterIds: [...fighter.boosterIds],
    usedBoosterIds: fighter.boostersUsed.map((use) => use.boosterId).filter((id) => !hidden.includes(id)),
    armed,
  };
}

/**
 * The user's perspective of the battle at `nowMs`. Never includes the correct option before
 * the reveal, the opponent's choices, its plan or its unrevealed boosters.
 */
export function selectBattleView(state: BattleState, nowMs: number): BattleView {
  const { turn } = state;
  const last = state.log[state.log.length - 1];
  const revealKey = turn?.key;
  const resolution = state.phase !== 'open' && last && last.key === revealKey ? last : null;
  const unresolved = state.phase === 'open' ? turn?.key : undefined;
  const hiddenOpponent = state.fighters.opponent.boostersUsed
    .filter((use) => use.questionKey === unresolved)
    .map((use) => use.boosterId);

  let question: QuestionView | null = null;
  const own = turn?.sides.player;
  if (turn && own) {
    const result = resolution?.results.player;
    const selected = own.attempts[own.attempts.length - 1]?.optionIndex ?? null;
    const correctIndex = resolution ? own.question.correctIndex : null;
    const opponent = turn.sides.opponent;
    question = {
      key: turn.key,
      categoryId: own.question.categoryId,
      difficulty: own.question.difficulty,
      prompt: own.question.prompt,
      options: own.question.options.map((text, index) => ({
        index,
        label: LABELS[index] ?? String(index + 1),
        text,
        removed: own.removed.includes(index),
        selected: selected === index,
        correct: correctIndex === null ? null : index === correctIndex,
      })),
      timeMs: turn.timeMs,
      totalMs: own.deadlineMs - turn.openedAtMs,
      remainingMs: state.phase === 'open' ? Math.max(0, own.deadlineMs - nowMs) : 0,
      status: resolution
        ? 'resolved'
        : state.phase !== 'open'
          ? 'abandoned'
          : own.status === 'final'
            ? 'locked'
            : own.status,
      outcome: result?.outcome ?? null,
      correctIndex,
      boosterUsed: own.booster,
      opponentLocked: opponent.status === 'final',
    };
  }

  const player = state.fighters.player;
  const canAct = state.phase === 'open' && question !== null && question.remainingMs > 0;
  const questionNumber = state.questionIndex + 1;

  return {
    phase: state.phase,
    questionNumber,
    categoryId: own?.question.categoryId ?? null,
    initiative: initiativeFor(state, questionNumber),
    player: fighterView(state, 'player', []),
    opponent: fighterView(state, 'opponent', hiddenOpponent),
    question,
    reveal: resolution
      ? { key: resolution.key, results: resolution.results, hits: resolution.hits }
      : null,
    boosters: player.boosterIds.map((id) => {
      const booster = getBooster(id);
      const armedKey = (Object.keys(ARMED_BY) as (keyof typeof ARMED_BY)[]).find((key) => ARMED_BY[key] === id);
      return {
        id,
        name: booster.name,
        effect: booster.effect,
        used: isBoosterUsed(player, id),
        armed: armedKey ? player.armed[armedKey] : false,
        canActivate: canAct && activationError(state, 'player', id) === null,
      };
    }),
    outcome: state.outcome,
  };
}
