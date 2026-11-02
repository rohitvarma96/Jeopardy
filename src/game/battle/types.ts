import type { BoosterId, BoosterLoadout } from '../types/booster';
import type { FighterId } from '../types/fighter';
import type { CategoryId } from '../types/match';
import type { PreparedQuestion, Question } from '../types/question';
import type { BattleRules } from './rules';

export type Side = 'player' | 'opponent';
export const SIDES = ['player', 'opponent'] as const satisfies readonly Side[];
export const otherSide = (side: Side): Side => (side === 'player' ? 'opponent' : 'player');

export type Combatant = {
  name: string;
  fighterId: FighterId;
  boosterIds: BoosterLoadout;
  /** Skill level; drives the mock opponent's accuracy and speed. */
  level: number;
};

export type BattleSetup = {
  matchId: string;
  seed: number;
  player: Combatant;
  opponent: Combatant;
  categoryIds: readonly CategoryId[];
};

export type AnswerOutcome = 'correct' | 'wrong' | 'timeout';
/** HP-lead and sudden-death reasons remain readable in previously saved match history. */
export type EndReason = 'knockout' | 'hp-lead' | 'sudden-death' | 'forfeit';

export type Attempt = { optionIndex: number; atMs: number; correct: boolean };

/** Precomputed mock-opponent step, executed through the same validated actions as the user. */
export type AiStep =
  | { atMs: number; type: 'booster'; boosterId: BoosterId }
  | { atMs: number; type: 'answer'; optionIndex: number };

export type SideTurn = {
  question: PreparedQuestion;
  deadlineMs: number;
  status: 'answering' | 'final';
  removed: number[];
  booster: BoosterId | null;
  attempts: Attempt[];
  outcome: AnswerOutcome | null;
  finalAtMs: number | null;
  aiSteps: AiStep[];
  aiCursor: number;
};

export type QuestionTurn = {
  key: string;
  openedAtMs: number;
  /** Base timer; also the speed-bonus window. Extra Time only moves a side's deadline. */
  timeMs: number;
  sides: Record<Side, SideTurn>;
};

export type BoosterUse = { boosterId: BoosterId; questionKey: string; atMs: number };

export type FighterState = Combatant & {
  hp: number;
  combo: number;
  bestCombo: number;
  boostersUsed: BoosterUse[];
  armed: { doubleDamage: boolean; mindShield: boolean; streakSaver: boolean };
  passiveUsed: boolean;
  stats: { correct: number; wrong: number; timeouts: number; damageDealt: number; attacksBlocked: number };
};

export type Hit = {
  attacker: Side;
  base: number;
  doubled: boolean;
  speedBonus: number;
  passiveBonus: number;
  raw: number;
  blocked: boolean;
  bulwarkReduction: number;
  damage: number;
  /** The match had already ended earlier in the same resolution. */
  void: boolean;
  targetHp: number;
};

export type SideResult = {
  outcome: AnswerOutcome;
  comboAfter: number;
  comboSaved: boolean;
  boosterId: BoosterId | null;
};

export type Resolution = {
  key: string;
  atMs: number;
  results: Partial<Record<Side, SideResult>>;
  hits: Hit[];
};

export type BattleOutcome = { winner: Side; reason: EndReason; atMs: number };

/** Ordered pool; question n uses pool[n % length] with a fresh option shuffle. */
export type MatchQuestions = readonly Question[];

export type BattleState = {
  rules: BattleRules;
  setup: BattleSetup;
  /** 'ai' runs the deterministic mock opponent; 'manual' accepts actions for both sides. */
  control: 'ai' | 'manual';
  questions: MatchQuestions;
  firstInitiative: Side;
  startedAtMs: number;
  nowMs: number;
  questionIndex: number;
  phase: 'open' | 'resolved' | 'finished';
  turn: QuestionTurn | null;
  fighters: Record<Side, FighterState>;
  log: Resolution[];
  outcome: BattleOutcome | null;
};

export type BattleAction =
  | { type: 'answer'; side: Side; optionIndex: number; atMs: number }
  | { type: 'activateBooster'; side: Side; boosterId: BoosterId; atMs: number }
  | { type: 'tick'; atMs: number }
  | { type: 'advance'; atMs: number }
  | { type: 'forfeit'; side: Side; atMs: number };

export type BattleErrorCode =
  | 'invalid-time'
  | 'match-finished'
  | 'no-open-question'
  | 'opponent-is-ai'
  | 'already-answered'
  | 'invalid-option'
  | 'option-unavailable'
  | 'booster-not-equipped'
  | 'booster-unavailable'
  | 'booster-used'
  | 'booster-limit'
  | 'booster-window'
  | 'not-resolved';

export type BattleError = { code: BattleErrorCode; message: string };

export type StepResult =
  | { ok: true; state: BattleState }
  | { ok: false; state: BattleState; error: BattleError };
