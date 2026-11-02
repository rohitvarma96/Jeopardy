import type { BattleView, Hit, Side } from '../../game/battle';

const fighter = (side: Side): BattleView['player'] => ({
  side, fighterId: side === 'player' ? 'arcane' : 'shadow', name: side === 'player' ? 'You' : 'Shadow',
  level: 3, hp: 100, maxHp: 100, combo: 0, bestCombo: 0,
  stats: { correct: 0, wrong: 0, timeouts: 0, damageDealt: 0, attacksBlocked: 0 },
  boosterIds: ['50-50', 'extra-time', 'mind-shield'], usedBoosterIds: [],
  armed: { doubleDamage: false, mindShield: false, streakSaver: false },
});

const base: BattleView = {
  phase: 'open', questionNumber: 1, categoryId: 'science',
  initiative: 'player', player: fighter('player'), opponent: fighter('opponent'),
  question: {
    key: 'preview', categoryId: 'science', difficulty: 'easy',
    prompt: 'Animation preview only', options: [], timeMs: 12000, totalMs: 12000, remainingMs: 12000,
    status: 'answering', outcome: null, correctIndex: null, boosterUsed: null, opponentLocked: false,
  },
  reveal: null, boosters: [], outcome: null,
};

const hit: Hit = {
  attacker: 'player', base: 10, doubled: false, speedBonus: 2, passiveBonus: 0, raw: 12,
  blocked: false, bulwarkReduction: 0, damage: 12, void: false, targetHp: 88,
};
const combat: BattleView = {
  ...base, phase: 'resolved', opponent: { ...base.opponent, hp: 88 },
  reveal: {
    key: 'preview-hit',
    results: {
      player: { outcome: 'correct', comboAfter: 3, comboSaved: false, boosterId: null },
      opponent: { outcome: 'wrong', comboAfter: 0, comboSaved: false, boosterId: null },
    },
    hits: [hit],
  },
};
const shield: BattleView = {
  ...combat, opponent: base.opponent,
  reveal: { ...combat.reveal!, key: 'preview-shield', hits: [{ ...hit, blocked: true, damage: 0, targetHp: 100 }] },
};
const victory: BattleView = {
  ...combat, phase: 'finished', opponent: { ...base.opponent, hp: 0 },
  reveal: { ...combat.reveal!, key: 'preview-finisher', hits: [{ ...hit, damage: 12, targetHp: 0 }] },
  outcome: { winner: 'player', reason: 'knockout', atMs: 1 },
};
const defeat: BattleView = {
  ...combat, phase: 'finished', player: { ...base.player, hp: 0 }, opponent: base.opponent,
  reveal: { ...combat.reveal!, key: 'preview-defeat', hits: [{ ...hit, attacker: 'opponent', targetHp: 0 }] },
  outcome: { winner: 'opponent', reason: 'knockout', atMs: 2 },
};

/** Synthetic public views, isolated from the live store and engine. No preview can dispatch gameplay. */
export const ANIMATION_PREVIEWS: { label: string; view: BattleView }[] = [
  { label: 'Entrance / idle', view: base },
  { label: 'Attack / hit / answers / combo', view: combat },
  { label: 'Shield impact', view: shield },
  { label: 'Booster activation', view: { ...base, question: { ...base.question!, boosterUsed: 'extra-time' } } },
  { label: 'Next question', view: { ...base, questionNumber: 2, question: { ...base.question!, key: 'preview-next' } } },
  { label: 'Finisher / victory', view: victory },
  { label: 'Finisher / defeat', view: defeat },
];
