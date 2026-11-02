import { router } from 'expo-router';

import { exitPreview } from '../../navigation/exitPreview';
import { routes, type TabHref } from '../../navigation/routes';
import { useMatchSetupStore } from '../match-setup/store';
import { useBattleStore } from './store';
import { usePlayerStore } from '../../store/player-store';

function clearSavedBattle() {
  const battle = useBattleStore.getState().battle;
  // Keep a failed grant retryable when navigation leaves the result screen.
  if (battle?.outcome && !usePlayerStore.getState().matches.some((match) => match.matchId === battle.setup.matchId)) return;
  useBattleStore.getState().reset();
}

/** Ends the battle session and returns to Arena home without stale battle history. */
function finishSession(destination: TabHref) {
  exitPreview(destination);
  clearSavedBattle();
  useMatchSetupStore.getState().reset();
}

export function leaveBattle() {
  finishSession(routes.arena);
}

/** Starts setup again; only a durably recorded finished battle is discarded. */
export function playAgain() {
  router.dismissAll();
  router.push(routes.mode);
  clearSavedBattle();
  useMatchSetupStore.getState().reset();
}
