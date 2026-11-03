import {
  BATTLE_RULES, createBattle, SIDES, step, type BattleAction, type BattleSetup, type BattleState, type Side,
} from '../../src/game/battle';

export function manualBattle(overrides: Partial<BattleSetup> = {}) {
  return createBattle({
    matchId: 'visual-fixture', seed: 1,
    player: { name: 'You', fighterId: 'arcane', level: 3, boosterIds: ['50-50', 'extra-time', 'mind-shield'] },
    opponent: { name: 'Rival', fighterId: 'shadow', level: 3, boosterIds: ['double-damage', 'mind-shield', 'streak-saver'] },
    categoryIds: ['science', 'sports', 'history', 'space', 'music'],
    ...overrides,
  }, 0, { control: 'manual', rules: { ...BATTLE_RULES, passivesEnabled: false } });
}

export function ok(state: BattleState, action: BattleAction) {
  const result = step(state, action);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

export function correctOption(state: BattleState, side: Side) {
  if (!state.turn) throw new Error('Expected an open question.');
  return state.turn.sides[side].question.correctIndex;
}

export function wrongOption(state: BattleState, side: Side) {
  if (!state.turn) throw new Error('Expected an open question.');
  const turn = state.turn.sides[side];
  return turn.question.options.findIndex((_, index) => index !== turn.question.correctIndex && !turn.removed.includes(index));
}

export function play(state: BattleState, moves: Record<Side, 'correct' | 'wrong'>) {
  if (!state.turn) throw new Error('Expected an open question.');
  let next = state;
  for (const side of SIDES) {
    next = ok(next, {
      type: 'answer', side, atMs: state.turn.openedAtMs + 1000,
      optionIndex: moves[side] === 'correct' ? correctOption(next, side) : wrongOption(next, side),
    });
  }
  return next;
}

export function withHp(state: BattleState, hp: Partial<Record<Side, number>>): BattleState {
  return {
    ...state,
    fighters: {
      player: { ...state.fighters.player, hp: hp.player ?? state.fighters.player.hp },
      opponent: { ...state.fighters.opponent, hp: hp.opponent ?? state.fighters.opponent.hp },
    },
  };
}
