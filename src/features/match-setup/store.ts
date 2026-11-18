import { create } from 'zustand';

import { isFighterId } from '../../data/fighters';
import { isAvailableMode } from '../../data/modes';
import { usePlayerStore } from '../../store/player-store';
import type { BoosterLoadout } from '../../game/types/booster';
import type { FighterId } from '../../game/types/fighter';
import type { CategoryId, DraftState, FoundMatch, GameModeId, MatchSetup } from '../../game/types/match';
import { createDraft, isDraftComplete, submitBan, submitPick } from '../category-draft/draft';
import { isValidLoadout, loadoutError } from '../loadout/loadout';
import { preparationError } from '../loadout/preparation';

/** Transient pre-battle state. Never persisted; kept apart from long-lived player data (ARC-04). */
type MatchSetupState = {
  nextSeed: number;
  modeId: GameModeId | null;
  match: FoundMatch | null;
  draft: DraftState | null;
  fighterId: FighterId | null;
  boosterIds: BoosterLoadout | null;
  ready: MatchSetup | null;
};

type MatchSetupActions = {
  beginSetup: (modeId: GameModeId) => void;
  matchFound: (match: FoundMatch) => void;
  ban: (categoryId: CategoryId) => void;
  pick: (categoryId: CategoryId) => void;
  confirmFighter: (fighterId: FighterId) => void;
  confirmLoadout: (boosterIds: readonly string[]) => { ok: true; setup: MatchSetup } | { ok: false; errors: string[] };
  prepareSavedEquipment: () => { ok: true; setup: MatchSetup } | { ok: false; errors: string[] };
  reset: () => void;
};

const emptySetup = {
  modeId: null,
  match: null,
  draft: null,
  fighterId: null,
  boosterIds: null,
  ready: null,
} as const satisfies Omit<MatchSetupState, 'nextSeed'>;

export function validateMatchSetup(
  state: Pick<MatchSetupState, 'match' | 'draft' | 'fighterId'>,
  boosterIds: readonly string[],
): string[] {
  const errors: string[] = [];
  if (!state.match || !isAvailableMode(state.match.modeId)) errors.push('No active offline match.');
  if (!isDraftComplete(state.draft)) errors.push('The category draft is incomplete.');
  if (!isFighterId(state.fighterId)) errors.push('Choose a Brawler.');
  else if (!usePlayerStore.getState().collectionIds.includes(`fighter:${state.fighterId}`)) errors.push('Collect this Brawler before battle.');
  if (!isValidLoadout(boosterIds)) errors.push('Select exactly three distinct boosters.');
  else {
    const problem = loadoutError(boosterIds);
    if (problem) errors.push(problem);
    if (!boosterIds.every((id) => usePlayerStore.getState().collectionIds.includes(`booster:${id}`))) errors.push('Collect each equipped booster before battle.');
  }
  return errors;
}

export const useMatchSetupStore = create<MatchSetupState & MatchSetupActions>()((set, get) => ({
  nextSeed: 1,
  ...emptySetup,
  beginSetup: (modeId) => {
    if (!isAvailableMode(modeId)) throw new Error(`Mode ${modeId} is not available offline.`);
    set({ ...emptySetup, modeId });
  },
  matchFound: (match) => {
    const { modeId, match: current } = get();
    if (match.modeId !== modeId || current) return;
    set({ match, draft: createDraft(), nextSeed: match.seed + 1 });
  },
  ban: (categoryId) => {
    const { draft, match } = get();
    if (!draft || !match) throw new Error('No active draft.');
    set({ draft: submitBan(draft, categoryId, match.opponent) });
  },
  pick: (categoryId) => {
    const { draft, match } = get();
    if (!draft || !match) throw new Error('No active draft.');
    set({ draft: submitPick(draft, categoryId, match.opponent, match.seed) });
  },
  confirmFighter: (fighterId) => {
    if (!isDraftComplete(get().draft)) throw new Error('Finish the category draft first.');
    if (!isFighterId(fighterId)) throw new Error(`Unknown fighter: ${String(fighterId)}`);
    if (!usePlayerStore.getState().collectionIds.includes(`fighter:${fighterId}`)) throw new Error('Collect this Brawler before equipping it.');
    set({ fighterId, ready: null });
  },
  confirmLoadout: (boosterIds) => {
    const state = get();
    const errors = validateMatchSetup(state, boosterIds);
    if (errors.length > 0 || !state.match || !state.draft || !state.fighterId || !isValidLoadout(boosterIds)) {
      return { ok: false, errors };
    }
    const setup: MatchSetup = {
      ...state.match,
      categories: state.draft.categories,
      fighterId: state.fighterId,
      boosterIds,
    };
    set({ boosterIds, ready: setup });
    return { ok: true, setup };
  },
  prepareSavedEquipment: () => {
    const player = usePlayerStore.getState();
    const error = preparationError(player);
    if (error) return { ok: false, errors: [error] };
    const errors = validateMatchSetup({ ...get(), fighterId: player.fighterId }, player.boosterIds);
    if (errors.length) return { ok: false, errors };
    set({ fighterId: player.fighterId });
    return get().confirmLoadout(player.boosterIds);
  },
  reset: () => set(emptySetup),
}));
