import { create } from 'zustand';

import { usePlayerStore } from '../../store/player-store';
import { createBattle, step, type BattleAction, type BattleError, type BattleSetup, type BattleState } from '../../game/battle';
import type { BoosterId } from '../../game/types/booster';
import type { MatchSetup } from '../../game/types/match';

/** How long a result stays on screen before play continues (unless the user taps Continue). */
export const REVEAL_MS = 2200;

type BattleStoreState = {
  battle: BattleState | null;
  /** Monotonic time of the last processed action; the view is computed at this time. */
  nowMs: number;
  revealKey: string | null;
  revealUntilMs: number | null;
  error: BattleError | null;
};

type BattleStoreActions = {
  start: (setup: MatchSetup) => void;
  answer: (optionIndex: number) => void;
  activateBooster: (boosterId: BoosterId) => void;
  tick: () => void;
  continue: () => void;
  forfeit: () => void;
  reset: () => void;
};

export function toBattleSetup(setup: MatchSetup): BattleSetup {
  return {
    matchId: setup.matchId,
    seed: setup.seed,
    player: { name: 'You', fighterId: setup.fighterId, boosterIds: setup.boosterIds, level: usePlayerStore.getState().profile.level },
    opponent: {
      name: setup.opponent.name,
      fighterId: setup.opponent.fighterId,
      boosterIds: setup.opponent.boosterIds,
      level: setup.opponent.level,
    },
    categoryIds: setup.categories.map((category) => category.categoryId),
  };
}

const initialState: BattleStoreState = { battle: null, nowMs: 0, revealKey: null, revealUntilMs: null, error: null };

/** Live battle session. Transient: never persisted, so an app restart abandons the match. */
export const useBattleStore = create<BattleStoreState & BattleStoreActions>()((set, get) => {
  const dispatch = (make: (atMs: number) => BattleAction) => {
    const { battle, revealKey, error } = get();
    if (!battle) return;
    const atMs = Math.max(Date.now(), battle.nowMs);
    const action = make(atMs);
    const result = step(battle, action);
    const next = result.state;
    const lastKey = next.log[next.log.length - 1]?.key ?? null;
    const reveal =
      next.phase === 'resolved'
        ? lastKey === revealKey
          ? {}
          : { revealKey: lastKey, revealUntilMs: atMs + REVEAL_MS }
        : { revealUntilMs: null };
    // A rejected action's message stays until the user acts again or play moves on.
    const unchanged = next.phase === battle.phase && next.turn?.key === battle.turn?.key;
    const nextError = !result.ok ? result.error : action.type === 'tick' && unchanged ? error : null;
    set({ battle: next, nowMs: atMs, error: nextError, ...reveal });
  };

  return {
    ...initialState,
    start: (setup) => {
      const previous = get().battle;
      if (previous?.outcome && !usePlayerStore.getState().matches.some((match) => match.matchId === previous.setup.matchId)) {
        throw new Error('Save the finished match rewards before starting another battle.');
      }
      const atMs = Date.now();
      set({ ...initialState, battle: createBattle(toBattleSetup(setup), atMs), nowMs: atMs });
    },
    answer: (optionIndex) => dispatch((atMs) => ({ type: 'answer', side: 'player', optionIndex, atMs })),
    activateBooster: (boosterId) =>
      dispatch((atMs) => ({ type: 'activateBooster', side: 'player', boosterId, atMs })),
    tick: () => {
      dispatch((atMs) => ({ type: 'tick', atMs }));
      const { battle, nowMs, revealUntilMs } = get();
      if (battle?.phase === 'resolved' && revealUntilMs !== null && nowMs >= revealUntilMs) {
        dispatch((atMs) => ({ type: 'advance', atMs }));
      }
    },
    continue: () => {
      if (get().battle?.phase === 'resolved') dispatch((atMs) => ({ type: 'advance', atMs }));
    },
    forfeit: () => dispatch((atMs) => ({ type: 'forfeit', side: 'player', atMs })),
    reset: () => set(initialState),
  };
});
